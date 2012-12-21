    window.addEventListener('DOMContentLoaded', function(event) {
    'use strict';

    var volStep = 2;
    var plr = window.audioPlayer;
    var prefsLocation = widget.preferences;
    var hijackTimer;
    var showTimeLeft = 1;

    function handleMessaging (event) {
        if (typeof event.data === 'string') {
            switch (event.data) {
                case 'wassup?'    : sendState();
                    break;
                case 'checkPlayer': checkPlayer();
                    break;
                case 'pauseIt'    : doPause();
                    break;
                case 'playIt'     : doPlay();
                    break;
                case 'prev'       : prevTrack();
                    break;
                case 'next'       : nextTrack();
                    break;
                case 'tglplay'    : togglePlay();
                    break;
                case 'rpt':
                case 'tglloop'    : toggleLoop();
                    break;
                case 'vup'        : volUp();
                    break;
                case 'vdown'      : volDown();
                    break;
                case 'updateIcon' : updateIcon();
                    break;
                case 'focus'      : focusTab();
                    break;
                case 'addSong'    : addSong();
                    break;
                case 'dlPlaylist' : dlPlaylist();
                    break;
            }
        }
        else if (typeof event.data === 'object') {
            switch (event.data.type) {
                case 'hotkeys'    : updateHotkeys(event);
                    break;
            }
        }
    }

    function dlPlaylist() {

    }

    function generatem3u (playlist) {
        
    }

    function checkPlayer(){
        var plr = window.audioPlayer;
        mes({
            type: 'playerOpen',
            info: !!(plr && plr.player && plr.id)
        });
    }

    function sendState() {
        var plr = window.audioPlayer;
        if (plr && plr.player  && plr.id) {
			mes({
                type: 'playerState',
                info: plr.player.paused() ? 'paused' : 'playing'
            });
        }
    }

    function doPause(){
        var plr = window.audioPlayer;
        if (plr && plr.player){
            plr.pauseTrack();
        }
    }

    function doPlay(){
        var plr = window.audioPlayer;
        if (plr && plr.player){
            plr.playTrack();
        }
    }

    function togglePlay(){
        var plr = window.audioPlayer;
        if (plr && plr.player){
            if(plr.player.paused()){
                plr.playTrack();
            } else {
                plr.pauseTrack();
            }
        }
    }

    function toggleLoop(){
        var plr = window.audioPlayer;
        plr && plr.toggleRepeat();
        mes({type: 'icon', info: plr.repeat ? 'repeat': 'repeat_dis'});
    }

    function prevTrack(){
        var plr = window.audioPlayer;
        plr && plr.prevTrack();
        mes({type: 'icon', info: 'prev'});
    }

    function nextTrack(){
        var plr = window.audioPlayer;
        plr && plr.nextTrack();
        mes({type: 'icon', info: 'next'});
    }

    function focusTab(){
        // dirty hack to help focus the tab
        document.title += '\u00a0\u00a0\u00a0';
        mes({type:"readyToBeFocused"})
    }

    function addSong() {
        var plr = window.audioPlayer;
        plr && plr.addCurrentTrack();
        mes({type: 'icon', info: 'added'});
    }

    function volDown(){
        setVol(-volStep);
    }

    function volUp(){
        setVol(volStep);
    }

    function setVol(delta) {
        var plr = window.audioPlayer, icon = 'vol_', curVol = window.parseInt(window.getCookie('audio_vol'));

        // plr.volClick(e, 'ac')
        if ( !plr ){ return }
		var volLine = window.ge('audio_vol_line'+plr.id) || window.ge('ac_vol') || window.ge('pd_vol');
		if (false && volLine) {
			var slider = window.ge('audio_vol_slider'+plr.id);

			if(volLine.id === "gp_vol_line") {
				slider = window.ge('gp_vol_slider');
			}
			// Simulate click on volume control
			var volSliderLeft = window.parseInt(slider.style.left);
			var newPxOffset = Math.round(plr.volW / 100 * (volSliderLeft / (plr.volW * 100) + delta)) + volSliderLeft + 3;
			var clickX = window.getXY(volLine)[0] + window.pageXOffset + newPxOffset;

			var mdown = window.document.createEvent("MouseEvents");
			mdown.initMouseEvent("mousedown", true, true, window,
				0, 0, 0, clickX, 0, false, false, false, false, 0, null);

			var mup = window.document.createEvent("MouseEvents");
			mup.initMouseEvent("mouseup", true, true, window,
				0, 0, 0, clickX, 0, false, false, false, false, 0, null);

			volLine.dispatchEvent(mdown);
			volLine.dispatchEvent(mup);

		} else {

            var newVol = curVol + delta > 100 ? 100 : (curVol + delta < 0 ? 0 : curVol + delta);
            window.console.log(newVol);
            plr.player.setVolume(newVol / 100);

		}

        if ( newVol == 0 ) { icon += '0'}
        else if ( newVol <= 33 ) {icon += '1' }
        else if ( newVol <= 66 ) {icon += '2' }
        else if ( newVol <= 90 ) {icon += '3' }
        else { icon += '4' }
        mes({type: 'icon', info: icon});
        window.setCookie('audio_vol', newVol, 365);
    }


    function getHotkeysList(){
        var ks = {};
        for(var el in prefsLocation){
           if (el.indexOf('hotkey-') === 0){
               ks[el] = prefsLocation[el];
           }
        }
        return ks
    }

    function updateHotkeys (e) {
        //remove old hotkeys
        console.log('removingHotkeys', JSON.stringify(e.data.info));
        if (e.data && e.data.info) {
            // info is old hotkeys object
            for (var k in e.data.info) {
                window.vPauseShortcut.remove(e.data.info[k])
            }
        }
        setHotkeys();
    }

    function setHotkeys (){
        var keys = getHotkeysList();
        // console.log('settingHotkeys', JSON.stringify(keys));
        for ( var key in keys ) {
            if (key && keys[key]) {
                (function(key){
                    // vPauseShortcut is defined in external file
                    window.vPauseShortcut.add(keys[key], function(e) {
                        mes({
                            type: 'hotkey',
                            info:  key
                        });
                        //console.log(key)
                    },{
                        'type': 'keydown',
                        'disable_in_input': true,
                        'propagate': true
                    });
                })(key);
            }
        }
    }

    function hijackPlayer (){
        var plr = window.audioPlayer;
        if (plr && !plr.isHijacked){
            // hook icon changes - basically, distilled player events
            plr.setIcon = Function.vPauseAddCallListener( plr.setIcon, {
                success: function(props){
                    var icon = props.args[0];
					if(icon === 'pauseicon'){
                        mes({type: 'justPaused', info: plr.lastSong});
                    }
                    else if(icon === 'playicon'){
                        mes({type: 'startedPlaying', info: plr.lastSong});
                    }
                }
            });

            // hook player stop
            plr.stop = Function.vPauseAddCallListener( plr.stop, {
                success: function(props) {
                    mes({type: 'stopped'});
                }
            });

            plr.onPlayProgress = Function.vPauseAddCallListener( plr.onPlayProgress, {
                success: function(props) {
                    var cur = props.args[0];
                    var len = props.args[1];
                    if (Math.abs(len-plr.duration)>1 || isNaN(len)) len = plr.duration;
                    cur = Math.round(cur);
                    len = Math.round(len);

                    var t = showTimeLeft ? len - cur : cur;
                    var res = plr.formatTime(t);
                    if (showTimeLeft) {res = "-" + res}

                    mes({
                        type: 'playProgress',
                        info: {
                            leftFRM: res,
                            dur: len,
                            cur: cur

                        }
                    })
                }
            });

            // hook player stop
            plr.onLoadProgress = Function.vPauseAddCallListener( plr.onLoadProgress, {
                success: function(props) {
                    mes({type : 'onLoadProgress',
                         info : {
                             bLoaded:  props.args[0],
                             bTotal: props.args[1],
                             dur: plr.duration
                         }
                    });
                }
            });

            plr.isHijacked = true;
            if(plr.player && !plr.player.paused()){
                // if it's first run and play already fired:
				mes({type: 'startedPlaying', info: plr.lastSong});
            }
            window.clearInterval(hijackTimer);
        }
    }

    function updateIcon () {
        var plr = window.audioPlayer;
        var icon = 'play';

        if (plr && plr.id && plr.player && !plr.player.paused()){
            icon = 'pause';
        }

        mes({ type: 'icon', info: icon });
    }

	function mes(mes){
		opera.extension.postMessage(mes);
	}

    /*
    function getPref (pref) {
      mes({type: 'getPref', info : pref})
    }

    */

    function initVK () {
        hijackTimer = window.setInterval(hijackPlayer, 1000);

        Function.vPauseAddCallListener = function(func, callbacks) {
            var successNumber = 0,
                errorNumber = 0,
                name = func.name;

            return function() {
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
                    props.successNumber = ++successNumber;
                    props.result = result;
                    props.status = 'success';
                    callbacks.success && callbacks.success(props);
                } catch (e) {
                    props.errorNumber = ++errorNumber;
                    props.error = e;
                    props.status = 'error';
                    callbacks.error && callbacks.error(props);
                }
                callbacks.after && callbacks.after(props);

                return result;
            };
        };

        //
        window.addEventListener('focus', function(){
            if (document.title) {
                document.title.replace('\u00a0\u00a0\u00a0','');
            }
        }, false);

/*        if (getPref('vPauseMoveCloseBtn') === 'true') {
            window.document.body.classList.add('vPauseMoveCloseBtn');
        }*/
    }

    function init(){

        // Execute this when a message is received from the background script.
        opera.extension.onmessage = handleMessaging;

        setHotkeys();
        if(window.self === window.top && (window.location.host === 'vkontakte.ru' || window.location.host === 'vk.com')){
            initVK();
        }
    }

    init();

}, false);
