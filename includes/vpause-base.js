window.addEventListener('DOMContentLoaded', function(event) {
    //'use strict';
    /**
     * http://www.openjs.com/scripts/events/keyboard_shortcuts/
     * Version : 2.01.B
     * By Binny V A
     * License : BSD
     */
    var shortcut = {
        'all_shortcuts':{},//All the shortcuts are stored in this array
        'add': function(shortcut_combination,callback,opt) {
            //Provide a set of default options
            var default_options = {
                'type':'keydown',
                'propagate':false,
                'disable_in_input':false,
                'target':document,
                'keycode':false
            }
            if(!opt) opt = default_options;
            else {
                for(var dfo in default_options) {
                    if(typeof opt[dfo] == 'undefined') opt[dfo] = default_options[dfo];
                }
            }

            var ele = opt.target;
            if(typeof opt.target == 'string') ele = document.getElementById(opt.target);
            var ths = this;
            shortcut_combination = shortcut_combination.toLowerCase();

            //The function to be called at keypress
            var func = function(e) {
                e = e || window.event;

                if(opt['disable_in_input']) { //Don't enable shortcut keys in Input, Textarea fields
                    var element;
                    if(e.target) element=e.target;
                    else if(e.srcElement) element=e.srcElement;
                    if(element.nodeType==3) element=element.parentNode;

                    if(element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') return;
                }

                //Find Which key is pressed
                if (e.keyCode) code = e.keyCode;
                else if (e.which) code = e.which;
                var character = String.fromCharCode(code).toLowerCase();

                if(code == 188) character=","; //If the user presses , when the type is onkeydown
                if(code == 190) character="."; //If the user presses , when the type is onkeydown

                var keys = shortcut_combination.split("+");
                //Key Pressed - counts the number of valid keypresses - if it is same as the number of keys, the shortcut function is invoked
                var kp = 0;

                //Work around for stupid Shift key bug created by using lowercase - as a result the shift+num combination was broken
                var shift_nums = {
                    "`":"~",
                    "1":"!",
                    "2":"@",
                    "3":"#",
                    "4":"$",
                    "5":"%",
                    "6":"^",
                    "7":"&",
                    "8":"*",
                    "9":"(",
                    "0":")",
                    "-":"_",
                    "=":"+",
                    ";":":",
                    "'":"\"",
                    ",":"<",
                    ".":">",
                    "/":"?",
                    "\\":"|"
                }
                //Special Keys - and their codes
                var special_keys = {
                    'esc':27,
                    'escape':27,
                    'tab':9,
                    'space':32,
                    'return':13,
                    'enter':13,
                    'backspace':8,

                    'scrolllock':145,
                    'scroll_lock':145,
                    'scroll':145,
                    'capslock':20,
                    'caps_lock':20,
                    'caps':20,
                    'numlock':144,
                    'num_lock':144,
                    'num':144,

                    'pause':19,
                    'break':19,

                    'insert':45,
                    'home':36,
                    'delete':46,
                    'end':35,

                    'pageup':33,
                    'page_up':33,
                    'pu':33,

                    'pagedown':34,
                    'page_down':34,
                    'pd':34,

                    'left':37,
                    'up':38,
                    'right':39,
                    'down':40,

                    'f1':112,
                    'f2':113,
                    'f3':114,
                    'f4':115,
                    'f5':116,
                    'f6':117,
                    'f7':118,
                    'f8':119,
                    'f9':120,
                    'f10':121,
                    'f11':122,
                    'f12':123
                }

                var modifiers = {
                    shift: { wanted:false, pressed:false},
                    ctrl : { wanted:false, pressed:false},
                    alt  : { wanted:false, pressed:false},
                    meta : { wanted:false, pressed:false}	//Meta is Mac specific
                };

                if(e.ctrlKey)	modifiers.ctrl.pressed = true;
                if(e.shiftKey)	modifiers.shift.pressed = true;
                if(e.altKey)	modifiers.alt.pressed = true;
                if(e.metaKey)   modifiers.meta.pressed = true;

                for(var i=0; k=keys[i],i<keys.length; i++) {
                    //Modifiers
                    if(k == 'ctrl' || k == 'control') {
                        kp++;
                        modifiers.ctrl.wanted = true;

                    } else if(k == 'shift') {
                        kp++;
                        modifiers.shift.wanted = true;

                    } else if(k == 'alt') {
                        kp++;
                        modifiers.alt.wanted = true;
                    } else if(k == 'meta') {
                        kp++;
                        modifiers.meta.wanted = true;
                    } else if(k.length > 1) { //If it is a special key
                        if(special_keys[k] == code) kp++;

                    } else if(opt['keycode']) {
                        if(opt['keycode'] == code) kp++;

                    } else { //The special keys did not match
                        if(character == k) kp++;
                        else {
                            if(shift_nums[character] && e.shiftKey) { //Stupid Shift key bug created by using lowercase
                                character = shift_nums[character];
                                if(character == k) kp++;
                            }
                        }
                    }
                }

                if(kp == keys.length &&
                    modifiers.ctrl.pressed == modifiers.ctrl.wanted &&
                    modifiers.shift.pressed == modifiers.shift.wanted &&
                    modifiers.alt.pressed == modifiers.alt.wanted &&
                    modifiers.meta.pressed == modifiers.meta.wanted) {
                    callback(e);

                    if(!opt['propagate']) { //Stop the event
                        //e.cancelBubble is supported by IE - this will kill the bubbling process.
                        e.cancelBubble = true;
                        e.returnValue = false;

                        //e.stopPropagation works in Firefox.
                        if (e.stopPropagation) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                        return false;
                    }
                }
            }
            this.all_shortcuts[shortcut_combination] = {
                'callback':func,
                'target':ele,
                'event': opt['type']
            };
            //Attach the function with the event
            if(ele.addEventListener) ele.addEventListener(opt['type'], func, false);
            else if(ele.attachEvent) ele.attachEvent('on'+opt['type'], func);
            else ele['on'+opt['type']] = func;
        },

        //Remove the shortcut - just specify the shortcut and I will remove the binding
        'remove':function(shortcut_combination) {
            shortcut_combination = shortcut_combination.toLowerCase();
            var binding = this.all_shortcuts[shortcut_combination];
            delete(this.all_shortcuts[shortcut_combination])
            if(!binding) return;
            var type = binding['event'];
            var ele = binding['target'];
            var callback = binding['callback'];

            if(ele.detachEvent) ele.detachEvent('on'+type, callback);
            else if(ele.removeEventListener) ele.removeEventListener(type, callback, false);
            else ele['on'+type] = false;
        }
    };
    var volStep = 5;
    var disableInInputs = true;
    var plr = window.audioPlayer;
    var hijackTimer;
    var showTimeLeft = 1;

    var hotkeys = {
        tglplay:  "Ctrl+Alt+p",
        prev:     "Ctrl+Shift+left",
        next:     "Ctrl+Shift+right",
        vup:      "Ctrl+Shift+up",
        vdown:    "Ctrl+Shift+down",
        tglloop:  "Ctrl+Alt+r"
    };

    function handleMessaging (event) {
        switch (event.data) {
            case 'wassup?'   : sendState();
                break;
            case 'checkPlayer': checkPlayer();
                break;
            case 'pauseIt'   : doPause();
                break;
            case 'playIt'    : doPlay();
                break;
            case 'prev'      : prevTrack();
                break;
            case 'next'      : nextTrack();
                break;
            case 'tglplay'   : togglePlay();
                break;
            case 'tglloop'   : toggleLoop();
                break;
            case 'vup'       : volUp();
                break;
            case 'vdown'     : volDown();
                break;
            case 'updateIcon': updateIcon();
                break;
        }
    }

    function checkPlayer(){
        var plr = window.audioPlayer;
        mes({
            type: 'playerOpen',
            info: !!(plr && plr.player)
        });
    }

    function sendState() {
        var plr = window.audioPlayer;
        if (plr && plr.player  && plr.player.id ){
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

    function volDown(){
        setVol(-volStep);
    }

    function volUp() {
        setVol(volStep);
    }

    function setVol(delta) {
        var plr = window.audioPlayer;
        if ( !plr ){ return }
		var volLine = window.ge('audio_volume_line'+plr.id) || window.ge('gp_vol_line');
		if (volLine) {
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

            var curVol = window.parseInt(window.getCookie('audio_vol'));
            var icon = 'vol_';

            if ( curVol == 0 ) { icon += '0'}
            else if ( curVol <= 33 ) {icon += '1' }
            else if ( curVol <= 66 ) {icon += '2' }
            else if ( curVol <= 90 ) {icon += '3' }
            else { icon += '4' }
            mes({type: 'icon', info: icon});

		} else {
			window.console.log('cant change vol');
/*
			var curVol = window.getCookie('audio_vol');
			var newVol = curVol + delta > 100 ? 100 : (curVol + delta < 0 ? 0 : curVol + delta);
			window.console.log(newVol);
			plr.player.setVolume(newVol);
			window.setCookie('audio_vol', newVol, 365);
*/
		}
    }

    function setHotkeys (keys){
        var type = 'keyup';
        for ( var key in keys ) {
            if (key && keys[key]) {
                (function(key){
                    shortcut.add(keys[key], function(e) {
                        mes({
                            type: 'hotkey',
                            info: key
                        });
                    },{
                        'type': type,
                        'disable_in_input': disableInInputs,
                        'propagate':true
                    });
                })(key);
            }

        }
    }

    function hijackPlayer (){
        var plr = window.audioPlayer;
        if (plr && !plr.isHijacked){
            // hook icon changes - basically distilled player events
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
                        info: res
                    })
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

/*    function getPref (pref) {
        mes({type: 'getPref', info : pref})
    }*/

    function initVK () {
        hijackTimer = window.setInterval(hijackPlayer, 1000);

        // Execute this when a message is received from the background script.
        opera.extension.onmessage = handleMessaging;

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
/*        if (getPref('vPauseMoveCloseBtn') === 'true') {
            window.document.body.classList.add('vPauseMoveCloseBtn');
        }*/
    }

    function init(){
        setHotkeys(hotkeys);
        if(window.self === window.top && (window.location.host === 'vkontakte.ru' || window.location.host === 'vk.com')){
            initVK();
        }
    }

    init();

}, false);
