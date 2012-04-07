window.addEventListener("load", function() {
    var players = [];
    var lastTrack = null;
    var pendingAction;
	var playbackTracker;

    var button = opera.contexts.toolbar.createItem({
        disabled: false,
        title: "Play/Pausse Vkontakte",
        icon: "play_btn_18.png", // The icon (18x18) to use for the button.
        onclick: function() {
            poll()
        }
    });
    opera.contexts.toolbar.addItem(button);
	//trackPlayback();

	opera.extension.onmessage = function(event){
		//window.console.log('ONMESSAGE: '+ event.data);
        switch(event.data){
            case 'paused':
            case 'playing':
                handlePolling(event);
				break;
            case 'justPaused':
                handlePause(event);
				break;
            case 'startedPlaying':
                handleStartedPlaying(event);
				break;
        }

	};
    
	function handlePolling(event) {
        players.push(event);
        window.clearTimeout(pendingAction);
        pendingAction = setTimeout(function(){
            var nowPlaying = 0;
            players.forEach(function(event,k,l){
                if(event.data == 'playing'){
                    nowPlaying++;
                    event.source.postMessage("pauseIt");
                }
            });
            if(!nowPlaying) {
                if(lastTrack){
                    lastTrack.postMessage('playIt');
                }
            }
            players = [];//reset for next click
        }, 20)
    }

	function poll(){
		opera.extension.broadcastMessage('wassup?');
	}

    function handlePause (event){
		if(event.source == lastTrack){
			lastTrack = event.source;
			button.icon = 'play_btn_18.png'
		}
    }

    function handleStartedPlaying(event){
		button.icon = 'pause_btn_18.png';
		lastTrack = event.source;
    }

	// The fn is needed to change button icon back to default one
	// when a tab with currently playing player instance is closed.
	// Called every 1000ms when music is playing.
	/*function trackPlayback(){ return
		window.clearInterval(playbackTracker);
		playbackTracker = window.setInterval(function(){
			button.icon = 'play_btn_18.png'
		},1100);
		button.icon = 'pause_btn_18.png';
	}*/

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
	
	// Enable the button when a tab is ready.
	/*opera.extension.onconnect = enableButton;*/
/*	opera.extension.tabs.onfocus = enableButton;
	opera.extension.tabs.onblur = enableButton;*/

}, false);
