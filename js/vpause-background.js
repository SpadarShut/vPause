var lastPlayer, lastPlayerState, singleClickPending, pendingAction, noResponse, waitBeforeIconUpdate, timer = [0, 0, 0];
var dblClickTimeout = 300;
var defaults = {
  btnTitle:               'vPause',
  dblClickAction:         'nextTrack',
  showTime:                false,
  'hotkey-togglePlay':    'Shift+End',
  'hotkey-prevTrack':     'Ctrl+Shift+Left',
  'hotkey-nextTrack':     'Ctrl+Shift+Right',
  'hotkey-volUp':         'Ctrl+Shift+Up',
  'hotkey-volDown':       'Ctrl+Shift+Down',
  'hotkey-toggleRepeat':  'R'
};

var Player = {
  STATE_IDLE : -1,
  STATE_NO_PLAYERS : 0,
  STATE_PLAYING : 1,
  STATE_PAUSED : 2
}

var vPause = (function(){
  var exports = function(){

    // vPause props:

    this.init = function () {
      vPause.goIdle();
      setPrefs(defaults);
      chrome.runtime.onConnect.addListener(vPause.handlePortConnect);
      chrome.runtime.onMessage.addListener(vPause.handleMessages);

      /*
       var port;
       chrome.extension.onConnect.addListener(function(_port) {
       // ...optional validation of port.name...
       port = _port;
       port.onMessage.addListener(function(message) { });
       port.onDisconnect.addListener(function() {
       port = null;
       });
       });
       */

      Button.button.onClicked.addListener(buttonClicked);
    }

    this.ports = [];

    this.VK_REGEXP = /^https?:\/\/(vk.com|vkontakte.ru)/;

    this.goIdle = function (from) {
      from && console.log('goIdle from ' + from);
      Button.setIcon('idle');
      Button.setTitle(getPref('btnTitle'));
      Button.setBadge('');
    }

    this.unIdle = function () {
      Button.setBadge('');
      Button.setIcon('play');
      window.clearTimeout(noResponse);
      noResponse = null;
    }

    this.handleMessages = function (message, port, callback) {
      if (message.type != 'playProgress') console.log(message.type, port.sender.tab.url);
      var fn = window[message.type];
      if (fn) {
        fn.apply(this, arguments);
      }
      else {
        throw new Error(message.type + ' is ' + fn);
      }
    }

    this.broadcastMessage = function (message, callback) {
      //  tag: mes
      // send to all connected ports
      var i = 0;
      vPause.ports.forEach(function (port) {
        port.postMessage(message, function (arg) {callback(arg)});
        i++
      });
      console.log('broadcast "' + message + '" to ' + i + ' ports');
    }

    this.handlePortConnect = function (port){
      if (port.sender.tab.url.match(vPause.VK_REGEXP)) {

        // if all tabs with vk players are closed
        // or if players never played - set lastPlayer to the last open vk tab
        // todo what if port is an iframe?
        if (!lastPlayerState || lastPlayerState == 'idle') {
          lastPlayer = port;
          lastPlayerState = 'idle';
        }
      }
      port.onMessage.addListener(vPause.handleMessages);
      port.onDisconnect.addListener(vPause.handlePortDisconnect);
      vPause.ports.push(port);
    }

    this.handlePortDisconnect = function (port) {
      var index = vPause.ports.indexOf(port);
      var disconnected = vPause.ports.splice(index);
      console.log('PORT DISCONNECTED: ', port);
      console.log('disconnected port: ', disconnected);
      if (disconnected === lastPlayer) {
        lastPlayerState = undefined;
        vPause.findLastVkTab();
      }
    }

    this.findLastVkTab = function (){

      vPause.ports.forEach(function(port){

      })
    }

    this.tellPlayer = function (fn, args, tabId) {
      if (!lastPlayer) {
        vPause.pollForActivePlayer();
      }
      else if (fn && lastPlayer || tabId) {

        args = args   || '';
        tabId = tabId || lastPlayer.sender.tab.id;

        try {
          if (args) {
            args = JSON.stringify(args);
          }
          var js = 'vPause?vPause.' + fn + '(' + args + '):console.log("no vPause")';
          chrome.tabs.update(tabId, {url: 'javascript:console.log(' + js + ');' + js });

        } catch (e) {
          console.log('oops, didn\'t');
          vPause.goIdle('from tellPlayer');
        }
      }
      else {
        console.error('tellPlayer failed. No lastPlayer? args:', arguments)
      }
    }

    // Poll all tabs for a vk player
    // The response from the tabs will trigger playerState fn
    this.pollForActivePlayer = function (callback) {
      vPause.broadcastMessage('sendState', callback);
      noResponse = window.setTimeout(function () {
        playerState(null);
      }, dblClickTimeout + 50);
    }

    this.utils = {
      isFn: function (fn) {
        return typeof(v) == "function"
      },

      htmlDecode: function (input) {
        var e = window.document.createElement('a');
        e.innerHTML = input;
        if (e.querySelector('*')) {
          e.innerHTML = e.textContent;
        }
        return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
      }
    }
  }

  return new exports();

})();



function buttonClicked(tab) {
  console.log('buttonClicked');
  if (singleClickPending) {
    // Cancel single click
    clearTimeout(singleClickPending);
    singleClickPending = null;

    // Run dblClickAction
    // todo remember fn and change only when settings updated
    var fn = getPref('dblClickAction');
    if (fn && fn !== undefined) {
      vPause.tellPlayer(fn); //todo handle if the action should use vPause.tellPlayer or call bg fn
    }
  } else {
    // Handle single click
    singleClickPending = setTimeout(function () {
      singleClickPending = null;

      if (!lastPlayer) {
        console.log('buttonClicked :: !lastPlayer');
//      vPause.pollForActivePlayer();

        vPause.ports.forEach(function(tabs){


          console.log('tabs: ', tabs);
          var tab = tabs.pop();
          if (tab) {
            vPause.tellPlayer('doPlay')
          }
          else {
            chrome.tabs.create({url: 'http://vk.com/audio'});
            // todo remember where the user goes
            // todo make option to choose waht page to open
          }
        });
      }
      else if (lastPlayerState == 'playing') {
        vPause.tellPlayer('doPause')
      }
      else if (lastPlayerState == 'paused') {
        vPause.tellPlayer('doPlay')
      }

    }, dblClickTimeout);
  }
}


/**
 * The fn to track player state
 *
 * Called when players reply to 'vPause.pollForActivePlayer'
 * message == null when no tabs replied
 * */
function playerState(message, port) {

  console.log('playerState args:',arguments);
  if (message === null) {
    vPause.goIdle('from playerState null');
  } else {
    clearTimeout(pendingAction);
    clearTimeout(noResponse);

    // collect all pages with vk player
    var players = [];
    message.port = port;
    players.push(message);
    pendingAction = setTimeout(function () {
      var nowPlaying = 0;
      players.forEach(function (message, k, l) {
        // pick the playing player
        if (message.info === 'playing') {
          nowPlaying++;
          lastPlayer = message.port; // ??? unnecessary/harmful
          vPause.tellPlayer('doPause');
        }
      });
      if (!nowPlaying) {
        if (lastPlayer) {
          vPause.tellPlayer('doPlay');
        }
      }
      //reset for next click
      players = [];
    }, 20);
  }
}

function startedPlaying(message, port) {
  lastPlayer = port;
  Button.setIcon('pause');
  vPause.unIdle();
  if (message.info) {
    Button.setTitle(vPause.utils.htmlDecode(message.info[5] + ' - ' + message.info[6]) + ' (' + vPause.utils.htmlDecode(message.info[4]) + ')');
  }
}

function playProgress(message, port) {
  Button.setBadge(message);
}

function loadProgress(message, port) {
  Button.setBadge(message);
}

function playerStopped(message, port) {
  if (port === lastPlayer) {
    vPause.unIdle();
    lastPlayer = port;
    Button.setIcon('play');
  }
}

function hotkey(message, port) {
  var msg = '';
  if (message.info && message.info.indexOf('hotkey-') === 0) {
    msg = message.info.substring(7);
  } else {
    msg = message.info;
  }

  if (msg == 'focusPlayerTab') {
    focusPlayerTab()
  } else {
    vPause.tellPlayer(msg);
  }
}


function getPref(pref) {
  var val = localStorage[pref];
  if (typeof val === 'undefined') {
    val = defaults[pref];
  }
  return val;
}

function setPref(name, val) {
  localStorage.setItem('name', val);
  vPause.tellPlayer('settingsChanged');
}

function setPrefs(opts) {
  for (var option in opts) {
    if (localStorage[option] === undefined) {
      setPref(option, opts[option]);
    }
  }
}

function setHotkeys(message, port, callback) {

  var keys = getHotkeysList();
  if (callback) {
    callback(keys);
  }
  else {
    vPause.tellPlayer('setHotkeys', keys, port.sender.tab.id);
  }
}

function getHotkeysList(message, port, callback) {

  var keys = {};
  for (var pref in localStorage) {
    if (pref.indexOf('hotkey-') === 0) {
      window.defaults[pref] = localStorage[pref];
    }
  }

  for (var pref in defaults) {
    if (pref.indexOf('hotkey-') === 0) {
      keys[pref] = window.defaults[pref];
    }
  }

  return keys
}

function updatehotkeys(message, port) {
  vPause.broadcastMessage({
    type: 'hotkeys',
    info: message.info
  });
}

function focusTab(tabId){
  chrome.tabs.update(tabId, {selected: true});
}

function focusPlayerTab() {
  lastPlayer ? focusTab( lastPlayer.sender.tab.id ) : console.log('can\'t focus player tab');
}

function iconChange(message, port) {
  var icon = message.info;
  var restore = true;
  if (icon === 'play' || icon === 'pause') {
    restore = false;
  }
  Button.setIcon(icon, restore);
}

var Button = (function () {

  var exports = function () {
    var self = this;
    this.button = chrome.browserAction;
    this.icons = {
      idle:       'img/btn_idle.png',
      play:       'img/btn_play.png',
      play_dis:   'img/btn_play_disabled.png',
      pause:      'img/btn_pause.png',
      prevTrack:  'img/btn_prev.png',
      nextTrack:  'img/btn_next.png',
      repeat:     'img/btn_repeat.png',
      repeat_dis: 'img/btn_repeat_disabled.png',
      vol_0:      'img/btn_vol_0.png',
      vol_1:      'img/btn_vol_1.png',
      vol_2:      'img/btn_vol_2.png',
      vol_3:      'img/btn_vol_3.png',
      vol_4:      'img/btn_vol_4.png',
      added:      'img/btn_plus.png'
    };

    this.setBadge = function (message) {
      var waitingTxt = ' ... ';
      var txt = '';
      // if (getPref('showTime') !== 'true' || waitBeforeIconUpdate) return;
      // Process loading events
      if (message && message.type == 'loadProgress') {

        var info = message.info;
        var songDur = info.dur || 0;
        var bTotal = info.bTotal || 0;

        if (!songDur || !bTotal) return;

        var bLoaded = info.bLoaded || 0;
        var curSec = timer[0] || 0;
        var bitrate = (bTotal / songDur).toFixed();
        var totalSecLoaded = Math.max((bLoaded / bitrate ).toFixed(), 0);
        var more = totalSecLoaded - curSec;

        /* If less than three more seconds are loaded or the player
         * is paused show how many seconds of the track are loaded
         * */

        //console.log(message);
        if (more < 3 /*|| Button.icon == icons.play*/) { // todo make a player state object to track Button.icon

          var secondsLoaded = Math.max(((bLoaded - bitrate * curSec) / bitrate ).toFixed(), 0);
          if (secondsLoaded > 60) {
            secondsLoaded < 65 ? txt = 'ok' : txt = '';
          }
          else if (secondsLoaded > 0) {
            txt = "+" + secondsLoaded + "s";
          }
          else {
            txt = waitingTxt;
          }
          this.button.setBadgeText({text: txt});
        }

      } else if (message && message.type && message.type == 'playProgress') {

        // Then it's a playProgress event

        txt = message.info.timeLeft;

        // don't update if the time is same as last
        if (timer[0] !== message.info.cur) { //todo check if ~showTimeLeft setting is true
          this.button.setBadgeText({text: txt});
        }
        timer.unshift(message.info.cur);
        timer.length = 3;
      }
      else if (typeof message == 'string') {

        this.button.setBadgeText({text: message});

      }
    };

    this.setIcon = function (icon, andRestore) {
      console.log('changeIcon: ', icon);

      if(icon == 'play'){
        lastPlayerState = 'paused';
      }
      else if (icon == 'paused') {
        lastPlayerState ='playing';
      }
      else if (icon == 'idle'){
        lastPlayerState = undefined;
      }

      this.button.setIcon({path: self.icons[icon]});
      // hide badge when changing icons and restore after a while
      this.button.setBadgeText({text: ''});
      if (waitBeforeIconUpdate) {
        window.clearTimeout(waitBeforeIconUpdate);
        waitBeforeIconUpdate = null;
      }
      if (andRestore) {
        waitBeforeIconUpdate = setTimeout(function () {
          vPause.tellPlayer('updateIcon');
        }, 1500);
      }
    };

    this.setTitle = function (title) {
      this.button.setTitle({title: title})
    };

    this.button.setBadgeBackgroundColor({color: [0, 0, 0, 255]});
    this.setTitle(getPref('btnTitle')); // todo set title to 'click to open your audio at vk.com'
  };

  return new exports();

})();

vPause.init();