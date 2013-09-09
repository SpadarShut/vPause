var lastPlayer, lastPlayerState, singleClickPending, pendingAction, waitBeforeIconUpdate, trackTicker = [0, 0, 0];
var dblClickTimeout = 300;
var defaults = {
  btnTitle:               'vPause',
  dblClickAction:         'nextTrack',
  showBadge:                false,
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
  STATE_PAUSED : 2,

  state: 0,

  setState: function(state) {
    Player.state = state;
  },

  getState: function (state) {
    Player.state = state;
  }
}

var vPause = (function(){
  var exports = function(){

    // vPause props:

    this.init = function () {
      vPause.goIdle();
      setPrefs(defaults);
      chrome.runtime.onConnect.addListener(vPause.handlePortConnect);
      chrome.runtime.onMessage.addListener(vPause.handleMessages);
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

    this.handleMessages = function (message, port, callback) {
      if (message.type != 'playProgress') console.log(message.type, port.sender && port.sender.tab.url);
      var fn = window[message.type];
      //console.log(message.type + ' is ', fn), arguments;
      if (fn) {
        //fn.apply(this, arguments);
        fn(message, port, callback);
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
      if(!port) {
        console.warn('WTF? port is ', port)
      }
      if (port.sender.tab.url.match(vPause.VK_REGEXP)) {

        // if all tabs with vk players are closed
        // or if players never played - set lastPlayer to the last open vk tab
        if (!lastPlayerState || lastPlayerState == 'idle') {
          vPause.setLastPlayer(port);
          vPause.setLastPlayerState('idle');
          Button.setIcon('play');
        }
      }
      port.onMessage.addListener(vPause.handleMessages);
      port.onDisconnect.addListener(vPause.handlePortDisconnect);
      vPause.ports.push(port);
    }

    this.handlePortDisconnect = function (port) {
      var index = vPause.ports.indexOf(port);
      var disconnected = vPause.ports.splice(index)[0];
      console.log('PORT DISCONNECTED: ', port);
      console.log('disconnected port: ', disconnected, port.sender.url);
      console.log('lastPlayer is: ', lastPlayer);

      if (disconnected === lastPlayer) {
        vPause.setLastPlayer(null);
        vPause.setLastPlayerState(null);
        vPause.findNewLastPlayer();
      }
      delete disconnected;
    }

    this.setLastPlayer = function (port) {
//      debugger;
      console.log('and the LAST PLAYER is... ', port);
      lastPlayer = port;
    }

    this.setLastPlayerState = function (state) {
      console.log('setLastPlayerState :: ', state);
      lastPlayerState = state;

      var icon = 'idle';
      if (state == 'playing') {
        icon = 'pause'
      }
      else if (state == 'paused' || state == 'idle') {
        icon = 'play'
      }

      Button.setIcon(icon);
      Button.setBadge('');
    }

    this.getLastPlayer = function (port) {
      return lastPlayer;
    }

    this.getLastPlayerState = function (state) {
      return lastPlayerState
    }


    this.findNewLastPlayer = function (){
      // todo find last vk tab, set lastPlayer, reset button
      var lastPort = null, playerState = null, activeTab;

      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        //if (tabs[0].url.match(vPause.VK_REGEXP)){
          activeTab = tabs[0];
        //}
      })

      for (var port in vPause.ports) {
        if(port.sender.tab.url.match(vPause.VK_REGEXP)){

          lastPort = port; // todo pick the las

          if (port.sender.tab === activeTab) {
            lastPort = activeTab;
            break;
          }

          playerState = 'idle'
        }
      }

      vPause.setLastPlayer(lastPort);
      vPause.setLastPlayerState(playerState);
      Button.setBadge('');
      Button.setTitle('vPause')
    }

    this.tellPlayer = function (fn, args, tabId) {

      if (fn && lastPlayer || tabId) {

        args = args   || '';
        tabId = tabId || lastPlayer.sender.tab.id;
/*
        try {*/
          if (args) {
            args = JSON.stringify(args);
          }
          var js = 'vPause?vPause.' + fn + '(' + args + '):console.log("'+ fn +'")';
          chrome.tabs.update(tabId, {url: 'javascript:' + js });
          console.log('told player: ', js, 'to ' + lastPlayer.sender.tab.url);
/*
        } catch (e) {
          console.log('oops, didn\'t');
          vPause.goIdle('from tellPlayer');
        }*/
      }
      else {
        console.error('tellPlayer failed. No lastPlayer? args:', arguments)
      }
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

      if (!lastPlayerState) {

        // todo check if there are open vk tabs

        // open new tab
        chrome.tabs.create({url: 'http://vk.com/'}, function(newTab){
          //todo wait until the tab loads and starts playing
/*          var newTabId = newTab.id;
          chrome.tabs.onUpdated.addListener(function(id, change, tab, newTabId){
            if (change.status == 'complete') {
              if( id == newTab.id) {
                vPause.tellPlayer('togglePlay')
              }

            }
          })
          console.log(tab);*/
        });

        // todo remember where the user goes
        // todo make option to choose what page to open
      }
      else {
        vPause.tellPlayer('togglePlay')
      }
    }, dblClickTimeout);
  }
}

function startedPlaying(message, port) {
  vPause.setLastPlayer(port);
  vPause.setLastPlayerState('playing');
  Button.setIcon('pause');
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
    vPause.setLastPlayer(port); // ? needed ???
    vPause.setLastPlayerState('paused'); // ? needed ???
    Button.setIcon('play');
  }
}

function hotkey(message, port) {
  console.log('oh, hotkey! args: ', arguments);
  //debugger;
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
  lastPlayer ? focusTab( lastPlayer.sender.tab.id ) : console.error('can\'t focus player tab');
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
       if (getPref('showBadge') !== 'true' || waitBeforeIconUpdate) return;
      // Process loading events
      if (message && message.type == 'loadProgress') {

        var info = message.info;
        var songDur = info.dur || 0;
        var bTotal = info.bTotal || 0;

        if (!songDur || !bTotal) return;

        var bLoaded = info.bLoaded || 0;
        var curSec = trackTicker[0] || 0;
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
        if (trackTicker[0] !== message.info.cur) { //todo check if ~showBadgeLeft setting is true
          this.button.setBadgeText({text: txt});
        }
        trackTicker.unshift(message.info.cur);
        trackTicker.length = 3;
      }
      else if (typeof message == 'string') {

        this.button.setBadgeText({text: message});

      }
    };

    this.setIcon = function (icon, andRestore) {
      console.log('changeIcon: ', icon);

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

function iconChange(message, port) {
  var icon = message.info;
  var restore = true;

  if (icon === 'play' || icon === 'pause' || icon === 'idle') {
    restore = false;
  }
  if (icon == 'play'){
    vPause.setLastPlayerState('paused'); // ???
    vPause.setLastPlayer(port);
  }
  else if (icon == 'paused') {
    vPause.setLastPlayerState('playing'); // ???
    vPause.setLastPlayer(port);
  }
  else if (icon == 'idle'){
    console.warn('iconChane :: icon is IDLE. WTF?')
    vPause.setLastPlayerState(null);
    vPause.setLastPlayer(null);
  }
  Button.setIcon(icon, restore);
}

vPause.init();