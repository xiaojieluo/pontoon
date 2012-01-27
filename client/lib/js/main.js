var Pontoon = (function () {

  'use strict';

  /* public  */
  return {



    /*
     * Simulate form POST
     *
     * params Parameters sending to server
     */
    post: function (url, params) {
      var post = $('<form>', {
        method: 'post',
        action: url
      });

      for(var key in params) {
        $('<input>', {
          type: 'hidden',
          name: key,
          value: params[key]
        }).appendTo(post);
      }

      post.appendTo('body').submit().remove();
    },



    /*
     * Save data in different formats
     *
     * type Data format
     * value Data
     */
    save: function (type, value) {
      var self = this,
          params = {
            type: type,
            locale: this._locale._code
          };

      if (type === "html") {
        params.data = value;
        this.post(this._app._path + 'save.php', params);

      } else if (type === "json") {
        var data = $.extend(true, {}, this._project._data); // Deep copy: http://api.jquery.com/jQuery.extend
        $(data.pages[Pontoon._app._page].entities).each(function () {
          delete this.ui;
          delete this.hover;
          delete this.unhover;
          delete this.id;
          delete this.body;
        });
        params.data = JSON.stringify(data, null, "\t");
        this.post(this._app._path + 'save.php', params);

      } else if (type === "po") {
        var date = new Date(),
            temp = date.toLocaleDateString().split("/"),
            y = temp[2],
            m = temp[0],
            d = temp[1],
            time = date.toTimeString(),
            temp = time.split(":"),
            h = temp[0],
            mi = temp[1],
            z = time.split("GMT")[1].split(" ")[0],
            timestamp = y + "-" + m + "-" + d + " " + h + ":" + mi + z;

        var po = 
          "# " + self._project._title + " language file (" + self._locale._language + ")\n" +
          "# This file is distributed under the same license as the website." + "\n" + 
          "# YOUR NAME <EMAIL@ADDRESS>, " + new Date().getFullYear() + "\n" + // TODO: author data
          "#" + "\n" + 
          "#, fuzzy" + "\n" + 
          "msgid \"\"" + "\n" + 
          "msgstr \"\"" + "\n" + 
          "\"Project-Id-Version: " + self._project._title + " 1.0\\n\"" + "\n" + 
          "\"POT-Creation-Date: " + timestamp + "\\n\"" + "\n" +
          "\"PO-Revision-Date: " + timestamp + "\\n\"" + "\n" +
          "\"Last-Translator: YOUR NAME <EMAIL@ADDRESS>\\n\"" + "\n" + // TODO: author data
          "\"Language-Team: " + self._locale._language + "\\n\"" + "\n" +
          "\"MIME-Version: 1.0\\n\"" + "\n" + 
          "\"Content-Type: text/plain; charset=UTF-8\\n\"" + "\n" + 
          "\"Content-Transfer-Encoding: 8bit\\n\"" + "\n";

        $(this._project._data.pages).each(function () {
          $(this.entities).each(function () {
            var fuzzy = false,
                msgstr = this.translation;

            if (this.suggestions && !msgstr) {
              fuzzy = true,
              msgstr = this.suggestions[0].translation;
            }

            po += 
              "\n" + 
              (this.comment ? "#. " + this.comment + "\n" : "") + 
              "#: " + self._project._url + "\n" + 
              (fuzzy ? "#, fuzzy\n" : "") + 
              "msgid \"" + this.original.replace(/"/g, "\\\"") + "\"\n" + 
              "msgstr \"" + (msgstr? msgstr.replace(/"/g, "\\\"") : "") + "\"\n";
          });
        });

        params.data = po;
        this.post(this._app._path + 'save.php', params);

      } else if (type === "server") {
        // TODO: save to server
      }
    },



    /*
     * Do not render HTML tags
     *
     * string HTML snippet that has to be displayed as code instead of rendered
     */
    doNotRender: function (string) {
      return string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },



    /*
     * Reverse function: do render HTML tags
     *
     * string HTML snippet that has to be rendered instead of displayed as code
     */
    doRender: function (string) {
      return string.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    },



    /**
     * Build source - translation pairs
     */
    entityList: function () {
      var self = this,
          list = $(this._app._win.document).find('#entitylist').empty().append('<ul></ul>');

      // Render
      $(this._project._data.pages[Pontoon._app._page].entities).each(function () {
        var li = $('<li class="entity' + 
          // append classes to translated and head entities
          (this.translation ? ' translated' : '') + 
          (!this.body ? ' head' : '') + '">' + 
        '<div class="source">' + 
          '<ol class="extra">' + 
            '<li class="active original-string" title="Original string"></li>' + 
            '<li class="other-users" title="Suggestions from other users"></li>' + 
            '<li class="other-locales" title="Translations from other locales"></li>' + 
            '<li class="translation-memory" title="Translation memory"></li>' + 
            '<li class="machine-translation" title="Machine translation by Microsoft Translator"></li>' + 
          '</ol>' +
          '<ol class="content">' + 
            '<li class="active original-string">' + 
              '<header>' + 
                (this.comment ? '<span class="comment" title="' + this.comment + '"></span>' : '') + 
                '<h3>Original string</h3>' + 
              '</header>' + 
              '<p class="source-string">' + self.doNotRender(this.original) + '</p>' + 
            '</li>' + 
            '<li class="other-users">' + 
              '<header>' + 
                (this.suggestions && this.suggestions.length > 1 ? '<a href="#prev" class="prev"></a><a href="#next" class="next"></a>' : '') + 
                '<h3>Other users' + 
                (this.suggestions ? ' (<span class="author">' + this.suggestions[0].author + '</span>)' : '') + 
                '</h3>' + 
              '</header>' + 
              (this.suggestions ? '<p data-id="0" class="source-string">' + this.suggestions[0].translation + '</p>' :
               '<p class="no">No suggestions yet</p>') + 
            '</li>' + 
            '<li class="other-locales">' + 
              '<header class="select">' + 
                '<h3 class="selector">' + 
                  '<span class="flag"></span>' + 
                  '<span class="language">Select locale</span>' + 
                  '<span class="handle"> &#9662;</span>' + 
                '</h3>' + 
                '<ul class="menu">' + 
                  '<li><span class="flag de"></span><span class="language">Deutsch</span></li>' + 
                  '<li><span class="flag fr"></span><span class="language">Français</span></li>' + 
                  '<li><span class="flag hr"></span><span class="language">Hrvatski</span></li>' + 
                  '<li><span class="flag pl"></span><span class="language">Polski</span></li>' + 
                  '<li><span class="flag sl"></span><span class="language">Slovenščina</span></li>' + 
                '</ul>' + 
              '</header>' + 
              '<p class="no">Get inspiration from other locales</p>' +
            '</li>' + 
            '<li class="translation-memory">' + 
              '<header><h3>Translation memory</h3></header>' + 
              '<p class="loader"></p>' + 
            '</li>' + 
            '<li class="machine-translation">' + 
              '<header><h3>Machine translation</h3></header>' + 
              '<p class="loader"></p>' + 
            '</li>' + 
          '</ol>' +
          '<div class="toolbar">' + 
            '<a href="#copy" class="copy" title="Copy source to translation"></a>' + 
          '</div>' +
        '</div>' +
        '<div class="translation">' + 
          '<div class="translation-wrapper">' +
            '<textarea>' + (this.translation || '') + '</textarea>' + 
            '<div class="toolbar">' + 
              '<a href="#save" class="save" title="Save translation"></a>' + 
              '<a href="#cancel" class="cancel" title="Cancel and revert to initial translation"></a>' + 
            '</div>' +
          '</div>' +
        '</div></li>', self._app._win);

        li.get(0).entity = this;
        this.ui = li; /* HTML Element representing string in the main UI */

        list.children('ul').append(li);
      });

      // Main entity list handlers
      $("#main .entity:not('.head')").hover(function () {
        self.common.postMessage("hover", this.entity.id);
      }, function () {
        self.common.postMessage("unhover", this.entity.id);
      }).click(function () {
        self.common.postMessage("edit");
      });

      // Source menu
      $("#main .extra li").click(function (e) {
        e.stopPropagation();
        var t = $(this),
            li = t.parents('.entity');
        t.parents(".extra").find("li").removeClass("active").end()

          .siblings(".toolbar").hide()
          .siblings(".content")
            .find("li.active").removeClass("active").end()
            .find("li." + t.attr("class")).addClass("active");

        t.addClass("active");

        if (li.find(".content > li:visible p.source-string").length > 0) {
          li.find('.toolbar').show();
        }
      });

      // Original string
      $("#main .extra .original-string").click(function () {
        $(this).parents('.entity').find('.toolbar').show();
      });

      // Other users
      $("#main .extra .other-users").click(function () {
        var li = $(this).parents('.entity');

        if (li.get(0).entity.suggestions) {
          li.find('.toolbar').show();
        }
      });

      // Navigate among suggestions from other users
      $("#main .source").find(".prev, .next").click(function (e) {
        e.stopPropagation();
        var li = $(this).parents('.entity'),
            suggestions = li.get(0).entity.suggestions,
            max = suggestions.length,
            ou = li.find(".other-users"),
            string = ou.find(".source-string"),
            id = string.data("id"),
            next = 0,
            cls = $(this).attr("class");

        if (cls === "prev") {
          next = max - 1;
          if (id > 0) {
            next = id - 1;
          }
        } else if (cls === "next") {
          if (id < max - 1) {
            next = id + 1;
          }
        }

        ou.find(".author").html(suggestions[next].author);
        string
          .html(self.doNotRender(suggestions[next].translation))
          .data("id", next);
      });

      // Other locales
      $("#main .source .other-locales .selector").click(function (e) {
        e.stopPropagation();
        if ($(this).siblings(".menu").is(":visible")) {
          $("#main .source .other-locales .menu").hide();
        } else {
          $("#main .source .other-locales .menu").hide();
          $(this).siblings('.menu').show();
        }
      });
      $("#main .source .other-locales .select .menu li").click(function (e) {
        e.stopPropagation();
        var li = $(this),
            entity = li.parents(".entity"),
            index = entity.index(), /* TODO: use IDs or XPath */
            locale = li.find(".flag").attr("class").split(" ")[1],
            p = li.parents('.select').next('p').show();

        li.parents('.menu').siblings('.selector')
          .find('.flag').attr("class", li.find('.flag').attr('class')).show().end()
          .find('.language').html(li.find('.language').html()).end().end()
        .hide();

        // TODO: AJAX request to display only locales with current string translation available
        if (locale === "sl") {
          // TODO: Only request each locale meta file once
          $.getJSON(self._project._url + "pontoon/" + locale + ".json").success(function (data) {
            var translation = data.entities[index].translation;
            if (translation) {
              p.removeClass("no").addClass("source-string").html(translation);
              entity.find('.toolbar').show();
            } else {
              p.addClass("no").html('No translations yet');
              entity.find('.toolbar').hide();
            }
          });
        } else {
          p.addClass("no").html('No translations yet');
          entity.find('.toolbar').hide();
        }
      });

      // Translation memory
      $("#main .extra .translation-memory").click(function () {
        var li = $(this).parents('.entity'),
            loader = li.find(".content .translation-memory .loader");
        if (loader.length === 0) {
          li.find(".toolbar").show();
        } else {
          $.ajax({
            url: 'http://www.frenchmozilla.fr/transvision/webservice.php',
            data: {
              recherche: li.find('.original-string .source-string').html(),
              locale: self._locale._code,
              whole_word: 'whole_word',
              repo: 'beta'
            },
            dataType: 'jsonp'
          }).error(function () {
            loader.removeClass("loader").addClass("no").html("Ooops, something went wrong... Please try again.");
          }).success(function (response) {
            if (response !== null) {
              // Not supported in some browsers, but needed with current JSON output:
              // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
              // TODO: use this kind of output - http://pastebin.mozilla.org/1316020
              Object.keys = function (obj) {
                var array = [],
                    prop;
                for (prop in obj) {
                  if (obj.hasOwnProperty(prop)) {
                    array.push(prop);
                  }
                }
                return array;
              };

              var first = response[Object.keys(response)[0]],
                  translation = first[Object.keys(first)[0]];
              loader.removeClass("loader").addClass("source-string").html(self.doNotRender(translation));
              li.find(".toolbar").show();
            } else {
              loader.removeClass("loader").addClass("no").html("No translations yet");
            }
          });
        }
      });

      // Machine translations
      $("#main .extra .machine-translation").click(function () {
        var li = $(this).parents('.entity'),
            loader = li.find(".content .machine-translation .loader"),
            entity = li.get(0).entity;
        if (loader.length === 0) {
          li.find(".toolbar").show();
        } else {
          $.ajax({
            url: "http://api.microsofttranslator.com/V2/Ajax.svc/Translate",
            dataType: 'jsonp',
            jsonp: "oncomplete",
            crossDomain: true,
            data: {
              appId: self._app._mt,
              text: entity.original,
              from: "en",
              to: self._locale._code,
              contentType: "text/html"
            }
          }).success(function(t) {
            loader.removeClass("loader").addClass("source-string").html(self.doNotRender(t));
            li.find(".toolbar").show();
          });
        }
      });

      // Copy source to translation
      $("#main .source .copy").click(function (e) {
        e.stopPropagation();
        var li = $(this).parents('.entity'),
            entity = li.get(0).entity,
            source = self.doRender(li.find('.source .content .active .source-string').html());

        // Only if no other entity is being edited in-place
        if (li.is('.hovered')) {
          self.common.postMessage("save", source);
        // Head entities cannot be edited in-place
        } else if (!entity.body) {
          entity.translation = source;
          self.updateEntityUI(entity);
        }
      });

      // Translate in textarea
      $("#main .translation textarea").click(function (e) {
        e.stopPropagation();
        var li = $(this).parents('.entity'),
            entity = li.get(0).entity;

        // Only if no other entity is being edited in-place
        if (!li.is('.hovered') && entity.body) {
          $(this).blur();
        }
      });

      // Save translation
      $("#main .translation .save").click(function (e) {
        e.stopPropagation();
        var li = $(this).parents('.entity'),
            entity = li.get(0).entity,
            source = li.find('.translation textarea').val();

        // Only if no other entity is being edited in-place
        if (li.is('.hovered')) {
          self.common.postMessage("save", source);
        // Head entities cannot be edited in-place
        } else if (!entity.body) {
          entity.translation = source;
          self.updateEntityUI(entity);
        }
      });

      // Cancel translation
      $("#main .translation .cancel").click(function (e) {
        e.stopPropagation();
        var li = $(this).parents('.entity'),
            entity = li.get(0).entity;

        // Only if no other entity is being edited in-place
        if (li.is('.hovered')) {
          self.common.postMessage("cancel", entity.id);
        // Head entities cannot be edited in-place
        } else if (!entity.body) {
          entity.translation = "";
          entity.ui.removeClass('translated').find('textarea').val(entity.translation);
          self.updateProgress();
        }
      });

      this.updateProgress();
    },



    /**
     * Update progress indicator and value
     */
    updateProgress: function () {
      var all = $("#entitylist .entity").length,
          translated = $("#entitylist .entity.translated").length;
      $('#progress span').width(Math.round(translated * 100 / all) + '%');
      $('#progress-value').html(translated + '/' + all);
    },



    /**
     * Update entity in the main UI
     * 
     * entity Entity
     */
    updateEntityUI: function (entity) {
      entity.ui.addClass('translated').find('textarea').val(entity.translation);
      this.updateProgress();
    },



    /**
     * Attach event handlers
     */
    attachHandlers: function () {
      var self = this,
          info = self._project._data.info,
          pages = self._project._data.pages;

      // General Project Info
      if (info) {
        $('#info')
          .find('.selector').show().end()
          .find('.menu')
            .find('.brief p').html(info.brief).end()
            .find('.locales p').html(info.locales).end()
            .find('.audience p').html(info.audience).end()
            .find('.metrics p').html(info.metrics);
      }

      // Page selector
      if (pages.length > 1) {
        $('#pontoon .page')
          .find('.selector .title').html(pages[Pontoon._app._page].title).end()
          .find('.menu').empty().end()
          .show();
          
        $(pages).each(function() {
          var count = 0,
              entities = this.entities;
          $(entities).each(function() {
            if (this.translation.length > 0) {
              count++;
            }
          });
          $('#pontoon .page .menu').append('<li>' +
            '<span class="title" data-url="' + this.url + '">' + this.title + '</span>' +
            '<span class="progress">' + Math.round(count*100/entities.length) + '%</span>' +
          '</li>');
        });

        $('#pontoon .page .menu li').click(function() {
          window.location = "?url=" + $(this).find('.title').data("url") + "&locale=" + self._locale._code;
        });
      }

      // Open/close Pontoon UI
      $('#switch').unbind("click.pontoon").bind("click.pontoon", function () {
        if ($('#main').is('.opened')) {
          $('#entitylist').height(0);
          self.common.postMessage("mode", "Advanced");
        } else {
          $('#entitylist').height(300);
          self.common.postMessage("mode", "Basic");
        }
        $('#source').height($(document).height() - $('#main').height());
        $('#main').toggleClass('opened');
      });

      // Authentication
      $('#authentication-menu .restricted .go').unbind("click.pontoon").bind("click.pontoon", function () {
        var author = $('#nickname').val() || $('#email').val();
        $('#authentication .selector').click();
        if (author) {
          $('#authentication .author').html(author).toggleClass('authenticated');
          $('#authentication-menu, #save-menu').toggleClass('menu');
        }
      });
      $('#nickname').unbind("keydown.pontoon").bind("keydown.pontoon", function (e) {
        var key = e.keyCode || e.which;
        if (key === 13) { // Enter
          $('#authentication-menu .restricted .go').click();
          return false;
        }
      });
      $("#browserid").click(function() {
        navigator.id.get(function(assertion) {
          if (assertion) {
            // Validate assertion on our own server
            $.ajax({
              url: self._app._path + 'browserid.php',
              dataType: 'json',
              data: {
                assertion: assertion,
                audience: self._app._path
              },
              success: function(data) {
                self._user.email = data.email;
                self._user.name = self._user.email.split("@")[0];
                self.common.postMessage("user", self._user);
                $('#nickname').val(self._user.name);
                $('#authentication-menu .restricted .go').click();
              }
            });
          }
        });
      });

      // Authentication toggle
      $('#authentication-menu .toggle').unbind("click.pontoon").bind("click.pontoon", function () {
        $('#authentication-menu')
          .find('.wrapper').toggle().end()
          .find('#password').toggle();
      });

      // Save menu
      $('#save-menu').find('.sign-out').unbind("click.pontoon").bind("click.pontoon", function () {
        $('#authentication .selector').click();
        $('#authentication .author').html('Sign in').toggleClass('authenticated');
        $('#authentication-menu, #save-menu').toggleClass('menu');
        $('#authentication-menu input').val("");
      }).end().find('li:not(".sign-out")').unbind("click.pontoon").bind("click.pontoon", function () {
        $('#authentication .selector').click();
        if ($(this).is(".html")) {
          self.common.postMessage("html");
        } else {
          self.save($(this).attr('class').split(" ")[0]);
        }
      });
    },



    /**
     * Handle messages from project code
     */
    receiveMessage: function (e) {
      if (e.source === Pontoon._project._win) {
        var message = JSON.parse(e.data);
        if (message.type === "data") {
          var value = message.value;
          Pontoon._app._page = value.page;
          Pontoon._project._url = value.url;
          Pontoon._project._title = value.title;
          Pontoon._project._data = $.extend(true, Pontoon._project._data, value.data); // Deep copy: http://api.jquery.com/jQuery.extend
          Pontoon._project._meta = value.meta;
        } else if (message.type === "render") {
          Pontoon.attachHandlers();
          Pontoon.entityList();
          $('#main').slideDown();
        } else if (message.type === "switch") {
          $("#switch").click();
        } else if (message.type === "hover") {
          Pontoon._project._data.pages[Pontoon._app._page].entities[message.value].ui.addClass('hovered');
        } else if (message.type === "unhover") {
          Pontoon._project._data.pages[Pontoon._app._page].entities[message.value].ui.removeClass('hovered');
        } else if (message.type === "active") {
          Pontoon._project._data.pages[Pontoon._app._page].entities[message.value].ui.addClass('active');
        } else if (message.type === "inactive") {
          Pontoon._project._data.pages[Pontoon._app._page].entities[message.value].ui.removeClass('active');
        } else if (message.type === "save") {
          Pontoon.updateEntityUI(Pontoon._project._data.pages[Pontoon._app._page].entities[message.value]);
        } else if (message.type === "cancel") {
          var entity = Pontoon._project._data.pages[Pontoon._app._page].entities[message.value];
          entity.ui.removeClass('translated').find('textarea').val(entity.translation);
          Pontoon.updateProgress();
        } else if (message.type === "supported") {
          Pontoon.init(Pontoon._project._win, document, Pontoon._locale._code);
        } else if (message.type === "html") {
          Pontoon.save("html", message.value);
        }
      }
    },



    /**
     * Initialize Pontoon
     *
     * app Pontoon window object
     * project Website window object
     * locale ISO 639-1 language code of the language website is localized to
     */
    init: function (app, project, locale) {
      var self = this;
      if (!project) {
        throw "Website handler required";
      }

      // Build Pontoon object
      this._app = {
        _win: app,
        _path: window.location.href.split("?")[0], // TOOD: more robust domain parser
        _mt: '',
        _page: 0
      };
      this._project = {
        _win: project,
        _url: "",
        _title: "",
        _data: {},
        _meta: ""
      };
      this._locale = {
        _code: locale,
        _language: $("#main .language").html()
      };
      this._user = {
        name: "",
        email: ""
      };

      // Instantate Microsoft Translator API
      $.getScript("client/lib/js/local-settings.js");
      
      // Activate project code: pontoon.js (iframe cross-domain policy solution)
      self.common.postMessage("locale", {locale: self._locale, domain: self._app._path});

      // Wait for project code messages
      // TODO: display page not ready for Pontoon notification if event not triggered
      window.addEventListener("message", self.receiveMessage, false);
    },



    /**
     * Common functions used in both, client specific code and Pontoon library
     */
    common: (function () {
      // Show/hide menu on click
      $('.selector').unbind("click.pontoon").bind("click.pontoon", function (e) {
        if (!$(this).siblings('.menu').is(':visible')) {
          e.stopPropagation();
          $('.menu').hide();
          $('#iframe-cover').hide(); // iframe fix
          $('.select').removeClass('opened');
          $(this).siblings('.menu').show();
          $('#iframe-cover').show().height($('#source').height()); // iframe fix
          $(this).parents('.select').addClass('opened');
        }
      });

      // Hide menus on click outside
      $('html').unbind("click.pontoon").bind("click.pontoon", function () {
        $('.menu').hide();
        $('#iframe-cover').hide(); // iframe fix
        $('.select').removeClass('opened');
      });
      $('.menu').unbind("click.pontoon").bind("click.pontoon", function (e) {
        e.stopPropagation();
      });

      // Start new project with current website url and locale
      $('.locale .confirm, .locale .menu li:not(".add")').unbind("click.pontoon").bind("click.pontoon", function () {
        // TODO: url and locale validation
        window.location = "?url=" + $('.url:visible').val() + "&locale=" + $(this).find('.flag').attr('class').split(' ')[1];
      });
      $('.url').unbind("keydown.pontoon").bind("keydown.pontoon", function (e) {
        var key = e.keyCode || e.which;
        if (key === 13) { // Enter
          $('.locale .confirm:visible').click();
          return false;
        }
      });

      // Menu hover
      $('.menu li').live('hover', function () {
        $('.menu li.hover').removeClass('hover');
        $(this).toggleClass('hover');
      });

      // Use arrow keys to move around menu, confirm with enter, close with escape
      $('html').unbind("keydown.pontoon").bind("keydown.pontoon", function (e) {
        if ($('.menu').is(':visible')) {
          var key = e.keyCode || e.which,
              menu = $('.menu:visible'),
              hovered = menu.find('li.hover');

          if (key === 38) { // up arrow
            if (hovered.length === 0 || menu.find('li:first').is('.hover')) {
              menu.find('li.hover').removeClass('hover');
              menu.find('li:last').addClass('hover');
            } else {
              menu.find('li.hover').removeClass('hover').prev().addClass('hover');
            }
            return false;
          }

          if (key === 40) { // down arrow
            if (hovered.length === 0 || menu.find('li:last').is('.hover')) {
              menu.find('li.hover').removeClass('hover');
              menu.find('li:first').addClass('hover');
            } else {
              menu.find('li.hover').removeClass('hover').next().addClass('hover');
            }
            return false;
          }

          if (key === 13) { // Enter
            menu.find('li.hover').click();
            return false;
          }

          if (key === 27) { // Escape
            menu.siblings('.selector').click();
            return false;
          }
        }
      });

      /*
       * window.postMessage improved
       *
       * messageType data type to be sent to the other window
       * messageValue data value to be sent to the other window
       * otherWindow reference to another window
       * targetOrigin specifies what the origin of otherWindow must be
      */
      return {
        postMessage: function (messageType, messageValue, otherWindow, targetOrigin) {
          var otherWindow = otherWindow || Pontoon._project._win,
              targetOrigin = targetOrigin || "*",
              message = {
                type: messageType,
                value: messageValue
              }
          otherWindow.postMessage(JSON.stringify(message), targetOrigin);
        }
      }
    })()

  };
}());
