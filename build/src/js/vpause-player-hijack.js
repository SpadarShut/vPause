/*al script so that it could get access
 * to the audioPlayer object. It sends postMessage messages, which vpause-contentscript listens for
 * and then resends to the background script.
 * This script is executed in the context of a vk.com page as a usu
 *
 * */
window.vPause = window.vPause || {};
vPause.hijackTimer = undefined;
vPause.volStep = 2;
// todo get options list and listen for their changes


vPause.addCallListener = function (func, callbacks) {
  var name = func.name;
  return function () {
    var args = [].slice.call(arguments);
    var result, error;
    var props = {
      args: args,
      self: this,
      name: name
    };
    callbacks.before && callbacks.before(props);
    try {
      result = func.apply(this, arguments);
      props.result = result;
      props.status = 'success';
      callbacks.success && callbacks.success(props);
    } catch (e) {
      props.error = e;
      props.status = 'error';
      callbacks.error && callbacks.error(props);
    }
    callbacks.after && callbacks.after(props);
    return result;
  };
};

vPause.hijackPlayer = function () {
  var plr = window.audioPlayer;

  if (plr && !plr.isHijacked) {
    plr.setIcon = vPause.addCallListener(plr.setIcon, {
      success: function (props) {
        //debugger;
        var icon = props.args[0];
        //console.log('change icon to: ' + icon);

        if (icon === 'pauseicon') {
          vPause.mes({
            type: 'playerStopped',
            info: plr.lastSong
          });
        } else if (icon === 'playicon') {
          vPause.mes({
            type: 'startedPlaying',
            info: plr.lastSong
          });
        }
      },
      error: function (props) {
        //console.log('error in setIcon: ', props);
      }
    });
    plr.stop = vPause.addCallListener(plr.stop, {
      success: function (props) {
        vPause.mes({
          type: 'playerStopped'
        });
      },
      error: function (props) {
        //console.log('error in stop: ', props);
      }
    });

    plr.onPlayProgress = vPause.addCallListener(plr.onPlayProgress, {
      success: function (props) {
        var cur = props.args[0];
        var len = props.args[1];
        if (Math.abs(len - plr.duration) > 1 || isNaN(len)) len = plr.duration;
        cur = Math.round(cur);
        len = Math.round(len);
        var timeLeft = '-' + plr.formatTime(len - cur);
        vPause.mes({
          type: 'playProgress',
          info: {
            timeLeft: timeLeft,
            dur: len,
            cur: cur
          }
        });
      },
      error: function (props){
        //console.error('error in playprogress', props);
        // debugger;
      }
    });
    //uncomment when player state can be tracked in background script
    plr.onLoadProgress = vPause.addCallListener(plr.onLoadProgress, {
     success: function(props) {
       var bLoaded = props.args[0];
       var bTotal = props.args[1];
       vPause.mes({
       type: 'loadProgress',
       info: {
         bLoaded: props.args[0],
         bTotal: props.args[1],
         dur: plr.duration
       }
       });
     }
   });

    plr.isHijacked = true;

    if (plr.player && !plr.player.paused()) {
      vPause.mes({
        type: 'startedPlaying',
        info: plr.lastSong
      });
    }
    clearInterval(vPause.hijackTimer);
  }
};

vPause.doPause = function () {
  var plr = window.audioPlayer;
  if (plr && plr.player) {
    plr.pauseTrack();
  }
};

vPause.doPlay = function () {
  var plr = window.audioPlayer;
  if (plr && plr.player) {
    plr.playTrack();
  } else {
  }
};

vPause.togglePlay = function () {
  var plr = window.audioPlayer;
  if (plr && plr.player) {
    plr.operate();
  }
  else {
    //headPlayPause();

    //function headPlayPause(event) {
    var aid = currentAudioId();
    if (!window.audioPadShown && !aid) Pads.show('mus');
    if (!aid) {
      aid = ls.get('audio_id');
      if (aid) {
        //window.padPlClicked = true;
      }
    }
    if (aid) {
      playAudioNew(aid);
    } else {
      var plist = padAudioPlaylist();
      if (plist && plist.start) {
        playAudioNew(plist.start); //playAudioNew(plist.start);
        Pads.hide('mus'); // my
      } else {
        addClass(ge('head_play_btn'), 'playing');
        window.onPlaylistLoaded = function() {
          var plist = padAudioPlaylist();
          if (plist && plist.start) {
            Pads.hide(); // my
            playAudioNew(plist.start);
          }
        }
      }
    }

    //Pads.hide(); // my
    //alert();
    //  if (event) cancelEvent(event);
    //}
  }
};

vPause.toggleRepeat = function () {
  var plr = window.audioPlayer;
  plr && plr.toggleRepeat();
  vPause.mes({
    type: 'iconChange',
    info: plr.repeat ? 'repeat' : 'repeat_dis'
  })
};

vPause.prevTrack = function () {
  var plr = window.audioPlayer;
  plr && plr.prevTrack();
  vPause.mes({
    type: 'iconChange',
    info: 'prevTrack'
  })
};

vPause.nextTrack = function () {
  var plr = window.audioPlayer;
  plr && plr.nextTrack();
  vPause.mes({
    type: 'iconChange',
    info: 'nextTrack'
  })
};

vPause.addSong = function () {
  var plr = window.audioPlayer;
  plr && plr.addCurrentTrack();
  vPause.mes({
    type: 'iconChange',
    info: 'added'
  })
};

vPause.volDown = function () {
  vPause.setVol(-vPause.volStep);
};

vPause.volUp = function () {
  vPause.setVol(vPause.volStep);
};

vPause.setVol = function (delta) {
  var plr = window.audioPlayer, icon = 'vol_', curVol = window.parseInt(window.getCookie('audio_vol'));
  if (!plr) {
    return;
  }
  var volLine = window.ge('audio_vol_line' + plr.id) || window.ge('ac_vol') || window.ge('pd_vol');
  if (false && volLine) {
    var slider = window.ge('audio_vol_slider' + plr.id);
    if (volLine.id === "gp_vol_line") {
      slider = window.ge('gp_vol_slider');
    }

    // Simulate click on volume control
    // todo check if it is still necassary in O15+
    var volSliderLeft = window.parseInt(slider.style.left);
    var newPxOffset = Math.round(plr.volW / 100 * (volSliderLeft / (plr.volW * 100) + delta)) + volSliderLeft + 3;
    var clickX = window.getXY(volLine)[0] + window.pageXOffset + newPxOffset;
    var mdown = window.document.createEvent("MouseEvents");
    mdown.initMouseEvent("mousedown", true, true, window, 0, 0, 0, clickX, 0, false, false, false, false, 0, null);
    var mup = window.document.createEvent("MouseEvents");
    mup.initMouseEvent("mouseup", true, true, window, 0, 0, 0, clickX, 0, false, false, false, false, 0, null);
    volLine.dispatchEvent(mdown);
    volLine.dispatchEvent(mup);

  } else {

    var newVol = curVol + delta > 100 ? 100 : (curVol + delta < 0 ? 0 : curVol + delta);
    //window.console.log(newVol);
    plr.player.setVolume(newVol / 100);
  }
  if (newVol == 0) {
    icon += '0'
  }
  else if (newVol <= 33) {
    icon += '1'
  }
  else if (newVol <= 66) {
    icon += '2'
  }
  else if (newVol <= 90) {
    icon += '3'
  }
  else {
    icon += '4'
  }
  vPause.mes({type: 'iconChange', info: icon});
  window.setCookie('audio_vol', newVol, 365);
};

vPause.updateIcon = function () {
  var plr = window.audioPlayer;
  var icon = 'play';
  if (plr && plr.id && plr.player && !plr.player.paused()) {
    icon = 'pause';
  }
  else if (plr && plr.id && plr.player && plr.player.paused()) {
    icon = 'play';
  }
  vPause.mes({
    type: 'iconChange',
    info: icon
  })
};


vPause.initVK = function () {
  // Listen for events from the hijacked player
  vPause.hijackTimer = setInterval(vPause.hijackPlayer, 1000)
};


vPause.initVK();
