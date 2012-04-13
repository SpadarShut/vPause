window.addEventListener("load", function() {
    var players = [];
    var lastPlayer = null;
    var btnClickAction;
    var pendingAction;
    var defaultTitle = "Play/Pause Vkontakte";
    var iconDefault  = "play_btn_18.png";
    var iconPause    = 'pause_btn_18.png';

    var button = opera.contexts.toolbar.createItem({
        disabled: false,
        title: defaultTitle,
        icon: iconDefault,
        onclick: buttonClicked
    });
    opera.contexts.toolbar.addItem(button);

	opera.extension.onmessage = function(event){
//		window.console.log('ONMESSAGE: '+ event.data);
        if (typeof event.data == "string" && event.data.indexOf('hotkey_') === 0) {
            tellPlayer( event.data.substring(7));
        }
        else if (typeof event.data == 'object'){
            switch(event.data.type){
                case 'startedPlaying':
                    handleStartedPlaying(event);
                    break;
                case 'justPaused':
                    handlePause(event);
                    break;
                case 'stopped':
                    handleStop(event);
                    break;
            }
        }
        else {
            switch(event.data){
                case 'paused':
                case 'playing':
                    handlePolling(event);
                    break;
            }
        }
	};

    function buttonClicked (){
        if (btnClickAction){
            window.clearTimeout(btnClickAction);
            btnClickAction = null;
            handleDblClick();
        }
        else {
            btnClickAction = window.setTimeout(function(){
                btnClickAction = null;
                poll();
            }, 350)
        }
    }

    function handleDblClick () {
        tellPlayer('next')
    }

	function handlePolling(event) {
        players.push(event);
        window.clearTimeout(pendingAction);
        // Wait for all pages to respond
        pendingAction = setTimeout(function(){
            var nowPlaying = 0;
            players.forEach(function(event,k,l){
                if(event.data == 'playing'){
                    nowPlaying++;
                    lastPlayer = event.source; // ??? unnecessary/harmful
                    event.source.postMessage("pauseIt");
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

	function poll(){
		opera.extension.broadcastMessage('wassup?');
	}

    function handleStartedPlaying(event){
        lastPlayer = event.source;
        changeIcon(iconPause);
        if (event.data.info) {
            changeTitle(event.data.info[5] + ' - ' + event.data.info[6] )
        }
    }
    
    function handlePause (event){
        if (event.source == lastPlayer){
            lastPlayer = event.source;
            changeIcon( iconDefault );
            //changeTitle(defaultTitle)
        }
    }

    function handleStop(event) {
        changeTitle(defaultTitle)
    }
    
    function tellPlayer( msg ){
        if (msg && lastPlayer) {
            lastPlayer.postMessage( msg );
        }
    }

    function changeTitle(title) {
        button.title = title;
    }
    function changeIcon(icon) {
        button.icon = icon;
    }

	function enableButton() {
	/*return;
		var tab = opera.extension.tabs.getFocused();
		if (tab) {
			button.disabled = false;
		} else {
			button.disabled = true;
		}*/
		button.disabled = true;
	}
//opera.extension.onconnect = enableButton;
}, false);
