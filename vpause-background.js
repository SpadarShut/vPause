window.addEventListener("load", function() {
    var players = [];
    var lastPlayer, btnClickAction, pendingAction, noResponse, monitorClose, restoreIcon;
    var dblClickTimeout = 300;
    var defaultTitle = "vPause";
    var icons = {
        play:       'btn_play.png',
        play_dis:   'btn_play_disabled.png',
        pause:      'btn_pause.png',
        prev:       'btn_prev.png',
        next:       'btn_next.png',
        repeat:     'btn_repeat.png',
        repeat_dis: 'btn_repeat_disabled.png',
        vol_0:      'btn_vol_0.png',
        vol_1:      'btn_vol_1.png',
        vol_2:      'btn_vol_2.png',
        vol_3:      'btn_vol_3.png',
        vol_4:      'btn_vol_4.png'
    };

    var button = opera.contexts.toolbar.createItem({
        disabled:   true,
        title:      defaultTitle,
        icon:       icons.play,
        onclick:    buttonClicked,
        badge: {
            display: "block",
            textContent: "",
            color: "#fff",
            backgroundColor: "rgba(0,0,0,.3)"
        }
    });

    opera.contexts.toolbar.addItem(button);

	opera.extension.onmessage = function(event){
		//console.log('ONMESSAGE: '+ event.data);
/*        if (typeof event.data == "string" && event.data.indexOf('hotkey_') === 0) {
            tellPlayer( event.data.substring(7));
        }
        else */
        if (typeof event.data == 'object'){
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
                    handleHotkey(event);
                    break;
                case 'playerState':
                    handlePolling(event);
                    break;
                case 'icon':
                    changeIcon(event.data.info);
                    break;
            }
        }
	};

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
            }, dblClickTimeout)
        }
    }

    function buttonDblClicked () {
        tellPlayer('next')
    }

    function poll(){
        opera.extension.broadcastMessage('wassup?');
        noResponse = window.setTimeout(function(){
            handlePolling(null)
        }, dblClickTimeout + 50)
    }

	function handlePolling(event) {
        console.log('handlePolling e.data: ' + !event ? event : event.data);/**/
        if (event === null) {
            goIdle();
        }
        else {
            window.clearTimeout(pendingAction);

            players.push(event);

            // Wait for all pages to respond
            pendingAction = setTimeout(function(){
                var nowPlaying = 0;
                players.forEach(function(event,k,l){
                    if(event.data == 'playing'){
                        nowPlaying++;
                        lastPlayer = event.source; // ??? unnecessary/harmful
                        event.source.postMessage('pauseIt');
                    }
                });
                if(!nowPlaying) {
                    if(lastPlayer){
                        lastPlayer.postMessage('playIt');
                    }
                }
                players = []; //reset for next click
            }, 20)
        }
    }

    function handleStartedPlaying(event) {
        lastPlayer = event.source;
        changeIcon(icons.pause);
        unIdle();
        if (event.data.info) {
            changeTitle(event.data.info[5] + ' - ' + event.data.info[6]  + ' (' + event.data.info[4] +')' )
        }
    }

    function handlePlayProgress(event) {
        button.badge.textContent = event.data.info;

        // Need to monitor when a page is closed while playing to turn off the button.
        window.clearTimeout(monitorClose);
        monitorClose = window.setTimeout(function(){
            goIdle();
        }, 1500);
    }
    
    function handlePause (event){
        window.clearTimeout(monitorClose);
        if (event.source == lastPlayer){
            unIdle();
            lastPlayer = event.source;
            changeIcon( icons.play );
        }
    }

    function handleStop(event) {
        window.clearTimeout(monitorClose);
        goIdle();
    }

    function handleHotkey (event) {

        tellPlayer (event.data.info);
    }

    function tellPlayer( msg ) {
        if (msg && lastPlayer) {
            lastPlayer.postMessage( msg );
        }
    }

    function changeTitle(title) {
        button.title = title;
    }

    function changeIcon(icon, andRestore) {
        window.clearTimeout(restoreIcon);

        button.icon = icon;
        if (andRestore) {
            restoreIcon = window.setTimeout(function(){
                tellPlayer('gimmeIcon')
            }, 1000)
        }
    }

    function goIdle () {
        console.log('Gone idle');

        changeIcon(icons.play);
        changeTitle(defaultTitle);
        button.badge.textContent = '';
        button.badge.display = 'none';
//        opera.contexts.toolbar.addItem(button);

        button.disabled = true;
    }

    function unIdle () {
        console.log('Unidled btn');
        button.badge.display = 'block';
        button.disabled = false;

  //      opera.contexts.toolbar.removeItem(button);
        window.clearTimeout(noResponse);
        noResponse = null;
    }

//opera.extension.onconnect = enableButton;
}, false);
