(function(window){
    var player = typeof getAudioPlayer === 'function' ? getAudioPlayer() : null;

    if( ! player ) {
        console.warn('No VK player found on the page');

        return;
    }

    var vPause = {};

    //todo: maybe utilise the AudioPlayer function to search for events
    var events = {
        'play': 'start',
        'pause': 'pause',
        'progress': 'progress',
        'volume': 'volume',
        'buffered': 'buffered',
        'added': 'added',
        'removed': 'removed'
    };

    listenForContentScriptMessages();
    listenForPlayerEvents();
    initTriggerMethods();
    createSongShell();

    function listenForContentScriptMessages() {
        window.addEventListener('message', function (e) {
            if ( isVpauseEvent(e) ) {
                if( typeof vPause[e.data.action] === 'function' ) {
                    vPause[e.data.action].call();
                } else {
                    normaliseHotkeyEvents(e.data);
                }
            }
        }, false);
    }

    function isVpauseEvent(e) {
        return e.data && e.data.origin && e.data.origin == 'vpause-button-event' || e.data && e.data.origin && e.data.origin == 'vpause-background-event'
    }

    function listenForPlayerEvents() {
        player.on(player, events.play, handlePlay);
        player.on(player, events.pause, handlePause);
        player.on(player, events.progress, handleProgress);
        player.on(player, events.volume, handleVolumeChange);
        player.on(player, events.buffered, handleBufferedData);
        player.on(player, events.added, handleSongAdded);
        player.on(player, events.removed, handleSongRemoved);
    }

    function normaliseHotkeyEvents(data) {
        switch( data.action ) {
            case 'volUp' :
                vPause.makeItLouder();
            break;
            case 'volDown' :
                vPause.makeItQuieter();
            break;
        }
    }

    function createSongShell() {
        vPause.songShell = document.createElement("div");

        vPause.songShell.setAttribute('id', 'vPause_song_shell');
        vPause.songShell.setAttribute('style', 'display: none');

        document.body.appendChild(vPause.songShell);
    }

    function initTriggerMethods() {
        vPause.togglePlay = function(){
            if( player.isPlaying() ) {
                player.pause();
            } else {
                player.play();
            }
        };

        vPause.toggleRepeat = function () {
            player.toggleRepeatCurrentAudio();
        };

        vPause.prevTrack = function () {
            player.playPrev();

            notifyContentScript({
                event: "prevSong"
            });
        };

        vPause.nextTrack = function () {
            player.playNext();

            notifyContentScript({
                event: "nextSong"
            });
        };

        vPause.setVolume = function(volume){
            player.setVolume(volume);
        };

        vPause.addToMyMusic = function(){
            tweakSongShell(player.getCurrentAudio());

            //todo: trigger the click event in another way if this fails
            vPause.songShell.querySelector('#add').click();
        };

        vPause.toggleMute = function(){
            //[7:00:00 PM] Shut Pavel: гэта фіча можа і пачакаць
        };

        vPause.makeItLouder = function(){
            var volume = player.getVolume();

            volume += .1;

            if( volume > 1 ) {
                volume = 1;
            }

            player.setVolume(volume);
        };

        vPause.makeItQuieter = function() {
            var volume = player.getVolume();

            volume -= .1;

            if( volume < 0 ) {
                volume = 0;
            }

            player.setVolume(volume);
        };

        vPause.toggleShuffle = function(){
            var shuffled = false,
                event = "";

            if( shuffled ) {
                event = 'shuffle'
            } else {
                event = 'unshuffle'
            }

            notifyContentScript({
                event: event
            });
        };

        vPause.startTheParty = function(){
            console.log('starting the party');

            //if has playlist - start music

            //else - open playlist
        }
    }

    function handlePlay(song) {
        notifyContentScript({
            event: "play",
            song: song
        });
    }

    function handlePause(song) {
        notifyContentScript({
            event: "pause",
            song: song
        });
    }

    function handleProgress(song, eventData) {
        notifyContentScript({
            event: "progress",
            song: song,
            progressData: eventData,
            reversed: player.getDurationType()
        });
    }

    function handleVolumeChange(song, eventData) {
        notifyContentScript({
            event: "volume",
            song: song,
            volume: eventData
        });
    }

    function handleSongAdded() {
        notifyContentScript({
            event: "songAdded"
        });
    }

    function handleSongRemoved() {
        notifyContentScript({
            event: "songRemoved"
        });
    }

    function handleBufferedData(song, eventData) {
        notifyContentScript({
            event: "buffer",
            song: song,
            buffered: eventData
        });
    }

    function tweakSongShell(song) {
        vPause.songShell.innerHTML = "";
        vPause.songShell.innerHTML = "<div class='audio_row _audio_row' data-audio='" + JSON.stringify(song) + "' data-is-current='1'><div class='audio_act' id='add' onclick='return addAudio(this, event)'></div></div>";
    }

    function notifyContentScript (msg) {
        msg.origin = 'vpause-injected-listeners';

        window.postMessage(msg, window.location.href );
    }
})(window);