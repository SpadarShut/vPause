window.addEventListener("load", function() {
    'use strict';
    var prefsLocation = widget.preferences;
    var players = [];
    var lastPlayer, btnClickAction, pendingAction, noResponse, monitorClose, waitBeforeIconUpdate, monitorIntervalID, timer = [0,0,0];
    var dblClickTimeout = 300;
    var defaults = window.vPauseDefaultOptions;
    var icons = {
        play:       'img/btn_play.png',
        play_dis:   'img/btn_play_disabled.png',
        pause:      'img/btn_pause.png',
        prev:       'img/btn_prev.png',
        next:       'img/btn_next.png',
        repeat:     'img/btn_repeat.png',
        repeat_dis: 'img/btn_repeat_disabled.png',
        vol_0:      'img/btn_vol_0.png',
        vol_1:      'img/btn_vol_1.png',
        vol_2:      'img/btn_vol_2.png',
        vol_3:      'img/btn_vol_3.png',
        vol_4:      'img/btn_vol_4.png',
        added:      'img/btn_plus.png'
    };

    var button = opera.contexts.toolbar.createItem({
        disabled:   true,
        title:      getPref("btnTitle"),
        icon:       icons.play,
        onclick:    buttonClicked,
        badge: {
            display: "block",
            textContent: "",
            color: "#fff",
            backgroundColor: "rgba(0,0,0,.3)"
        }
    });


    function init () {
        setPrefs(defaults);
        opera.extension.onmessage = handleMessages;
    }

    function getPref (pref) {
        var val = prefsLocation[pref];
        if (typeof val === 'undefined'){
            val = defaults[pref];
        }
        return val;
    }

    function setPref (name, val) {
        prefsLocation[name] = val;
        tellPlayer('settingsChanged');
    }

    function setPrefs (opts) {
        for (var option in opts){
            // Write defaults to extension options storage if they're not there yet
            if (prefsLocation[option] === undefined) {
                setPref(option, opts[option]);
            }
        }
    }

    function handleMessages (event) {
        //console.log('ONMESSAGE: '+ JSON.stringify(event.data));
        if (typeof event.data === 'object'){
            switch(event.data.type){
                case 'startedPlaying':
                    handleStartedPlaying(event);
                    break;
                case 'playProgress':
                    handlePlayProgress(event);
                    break;
                case 'justPaused':
                    handlePause(event);
                    break;
                case 'stopped':
                    handleStop(event);
                    break;
                case 'hotkey':
                    console.log('ONMESSAGE: '+ JSON.stringify(event.data));
                    handleHotkey(event);
                    break;
                case 'updatehotkeys':
                    handleUpdateHotkeys(event);
                    break;
                case 'playerState':
                    handlePolling(event);
                    break;
                case 'icon':
                    handleIconChange(event);
                    break;
                case 'playerOpen':
                    handleCheckPlayer(event);
                    break;
                case 'readyToBeFocused':
                    focusPlayerTab(event);
                    break;
                case 'onLoadProgress':
                    handleLoadprogress(event);
                    break;
            }
        }
    }

    function handleUpdateHotkeys(e){
        //console.log('handleUpdateHotkeys');
        opera.extension.broadcastMessage({type: 'hotkeys', info: e.data.info});
    }

    function buttonClicked (){
        // Handle double click
        if (btnClickAction){
            window.clearTimeout(btnClickAction);
            btnClickAction = null;
            buttonDblClicked();
        }
        // Handle single click
        else {
            btnClickAction = window.setTimeout(function(){
                btnClickAction = null;
                poll();
            }, dblClickTimeout);
        }
    }

    function buttonDblClicked () {
        var fn = getPref('dblClickAction');
        switch (fn) {
            case 'next'    : tellPlayer('next');
                break;
            case 'prev'    : tellPlayer('prev');
                break;
            case 'rpt'     : tellPlayer('tglloop');
                break;
            case 'focus'   : tellPlayer('focus');
                break;
            case 'addSong' : tellPlayer('addSong');
                break;
        }
    }

    function poll(){
        opera.extension.broadcastMessage('wassup?');
        noResponse = window.setTimeout(function(){
            handlePolling(null);
        }, dblClickTimeout + 150);
    }

	function handlePolling(event) {
        //console.log('handlePolling e.data: ' + !event ? event : event.data);
        if (event === null) {
            goIdle('from handlepolling null');
        }
        else {
            window.clearTimeout(pendingAction);
            window.clearTimeout(noResponse);

            players.push(event);

            // Wait for all pages to respond
            pendingAction = setTimeout(function(){
                var nowPlaying = 0;
                players.forEach(function(event,k,l){
                    if(event.data.info === 'playing'){
                        nowPlaying++;
                        lastPlayer = event.source; // ??? unnecessary/harmful
                        tellPlayer('pauseIt');
                    }
                });
                if(!nowPlaying) {
                    if(lastPlayer){
                        tellPlayer('playIt');
                    }
                }
                players = []; //reset for next click
            }, 20);
        }
    }

    function handleStartedPlaying(event) {
        lastPlayer = event.source;
        changeIcon(icons.pause);
        unIdle();
        if (event.data.info) {
            changeTitle(htmlDecode (event.data.info[5] + ' - ' + event.data.info[6])  + ' (' + htmlDecode(event.data.info[4]) +')' );
        }
        startMonitorPlayer();
    }

    function handlePlayProgress(event) {
        setBadge ( event.data.info, event);
        window.clearTimeout(monitorClose);
    }

    function handleLoadprogress (event) {
        setBadge(null, event);
    }

    function setBadge(txt, event) {
        txt = null;
        var waitingTxt = ' ... ';

        if (getPref('showTime') !== 'true' || waitBeforeIconUpdate) return;

        if (event && event.data.type && event.data.type == 'onLoadProgress') {


            // todo fix incorrect loaded calculation after seeking

            /* If last three seconds player wasn't playing or was paused */
            if (timer[0] === timer[1] /* && timer[1] === timer[2] */ || button.icon == icons.play) {
                var i = event.data.info;
                var bTotal = i.bTotal;
                var bLoaded = i.bLoaded;
                var songDur = i.dur;

                if (!songDur || !bLoaded || !bTotal) return;

                var bitrate = (bTotal / songDur).toFixed();
                var secondsLoaded = Math.max(((bLoaded - bitrate * timer[0]) / bitrate ).toFixed(), 0);

                if (secondsLoaded > 60) {
                    secondsLoaded < 65 ? txt = 'ok': txt = '';
                }
                else if (secondsLoaded > 0) {
                    txt = "+"+ secondsLoaded + "s";
                }
                else {
                    txt = waitingTxt;
                }
                button.badge.textContent = txt;
            }

        } else {
            // Then it's playProgress event

            // if (getPref('showTime') === 'true' && !waitBeforeIconUpdate) {}
            txt = event.data.info.leftFRM;

            // don't update if the time is same as last
            if (timer[0] !== event.data.info.cur ) {
                button.badge.textContent = txt;
            }
            timer.unshift(event.data.info.cur);
            timer.length = 3;

            // either we never update the badge or we need to wait after icon change
/*            if (txt){
                txt = '';
                button.badge.textContent = txt;
            }*/
        }

     /*   if (txt !== undefined) {
            button.badge.textContent = txt;
        }*/
    }

    function handleCheckPlayer(event){
        if (event.data && event.data.info !== true) {
            goIdle('from checkPlayerIsClosed')
        }
    }

    function checkPlayer() {
        window.clearTimeout(monitorClose);
        monitorClose = window.setTimeout(function(){
            tellPlayer('checkPlayer');
        }, 1000);
    }

    function startMonitorPlayer () {
        stopMonitorPlayer ();
        monitorIntervalID = window.setInterval(checkPlayer, 1100);
    }

    function stopMonitorPlayer () {
        window.clearInterval(monitorIntervalID);
        //monitorIntervalID = null;
    }

    function handlePause(event) {
        //window.clearTimeout(monitorClose);
        if (event.source === lastPlayer){
            unIdle();
            lastPlayer = event.source;
            changeIcon( icons.play );
        }
    }

    function handleStop(event) {
        checkPlayer();
    }

    function handleHotkey (event) {
        var msg = '';
        if(event.data.info && event.data.info.indexOf('hotkey-') === 0) {
            msg = event.data.info.substring(7);
        } else {
            msg = event.data.info
        }
        tellPlayer (msg);
    }

    function focusPlayerTab (evt) {
        var tabs = opera.extension.tabs.getAll();
        // dirty hack to get the tab where the message came from
		// we've appended three spaces to the title and look for a tab with them
        for( var tab in tabs ) {
            window.console.log(tab);
            if (tabs[tab].title && /\u00a0\u00a0\u00a0$/.test(tabs[tab].title)){
                tabs[tab].focus();
            }
        }
    }

    function tellPlayer( msg ) {
        if (msg && lastPlayer) {
            try {
                lastPlayer.postMessage( msg );
            } catch (e){
                goIdle('from tellPlayer')
            }
        }
    }

    function changeTitle(title) {
        button.title = title;
    }

    function handleIconChange (event) {
        var icon = event.data.info;
        var restore = true;
        if (icon === 'play' || icon === 'pause') {
            restore = false;
        }
        changeIcon(icons[icon], restore);
    }

    function changeIcon(icon, andRestore) {
        button.icon = icon;
        button.badge.textContent = '';
        if (waitBeforeIconUpdate) {
            window.clearTimeout(waitBeforeIconUpdate);
            waitBeforeIconUpdate = null;
        }
        if (andRestore) {
            waitBeforeIconUpdate = window.setTimeout(function(){
                tellPlayer('updateIcon');
            }, 1500);
        }
    }

    function goIdle (from) {
        //console.log('Gone idle: '+ from);
        stopMonitorPlayer();
        changeIcon(icons.play);
        changeTitle(getPref('btnTitle'));
        button.badge.textContent = '';
        opera.contexts.toolbar.removeItem(button);
    }

    function unIdle () {
        button.badge.display = 'block';
        button.disabled = false;

        opera.contexts.toolbar.addItem(button);
        window.clearTimeout(noResponse);
        noResponse = null;
    }

    function htmlDecode(input){
        var e = window.document.createElement('div');
        e.innerHTML = input;
        if (e.querySelector('*')) {
            e.innerHTML = e.textContent
        }
        return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
    }

	// Run extension
	init();

}, false);
