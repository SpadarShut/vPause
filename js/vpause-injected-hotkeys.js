vPause = window.vPause || {};

vPause.mes = function  (msg) {
    /*var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("vpause-player-message", true, false, msg);
    document.dispatchEvent(evt);
*/
  window.postMessage(
      {
        origin: 'vpause-player-message',
        info: msg
      },
      document.location.href );
};

vPause.handleBgMessaging = function  (message) {

    vPause[message.type]()

/*        switch (message.type) {
            case 'hotkeys':
                vPause.updateHotkeys(event);
                break;
        }*/
};

/*
vPause.sendState = function () {
  var plr = window.audioPlayer;
  if (plr && plr.player && plr.id) {
    vPause.mes({
      type: 'playerState',
      info: plr.player.paused() ? 'paused' : 'playing'
    });
  }
};*/

/*
vPause.playerState = function  () { // todo tbd?
    var plr = window.audioPlayer;
    vPause.mes({
        type: 'playerOpen',
        info: !!(plr && plr.player && plr.id)
    })
};*/

vPause.updateHotkeys = function(message) {
    console.log('removingHotkeys', JSON.stringify(message.info));
    try {
        message = JSON.stringify(message);
        if ( message.toString() == '[object Object]') {
            // info is old hotkeys object
            for (var k in message.info) {
                // todo make with postmessage:
                window.vPause.Shortcut.remove(message.info[k]);
            }
            vPause.setHotkeys();
        }
    }
    catch(e){ }
};

vPause.setHotkeys = function (keys) {

    if (!keys) {
        console.log('no keys!');
        debugger;
    }
    for (var key in keys) {
        if (key && keys[key]) {
            (function (key) {
                //console.log('injected : setHotkeys : vPause.Shortcut is: ', vPause.Shortcut);
                //if( !vPause.Shortcut) return;
                window.vPause.Shortcut.add(
                    keys[key],
                    function (e) {
                        vPause.mes({ type: 'hotkey', info: key });
                    }, {
                        'type': 'keydown',
                        'disable_in_input': true,
                        'propagate': true
                    }
                );
            })(key);
        }
    }
};


window.addEventListener('message', function (e) {
  if (e.origin !== window) return; // ???
//  debugger;
  if (e.data && e.data.origin && e.data.origin == 'vpause-contentscript-message') {
      console.log('injected :: vpause-contentscript-message event: ', e.data.info);
      vPause.handleBgMessaging(e.data.info)
  }
}, false);

