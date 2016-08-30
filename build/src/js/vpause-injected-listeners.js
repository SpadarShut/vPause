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
        'buffered': 'buffered'
    };

    listenForContentScriptMessages();
    listenForPlayerEvents();
    initTriggerMethods();

    function listenForContentScriptMessages() {
        window.addEventListener('message', function (e) {
            if (e.data && e.data.origin && e.data.origin == 'vpause-background-script') {
                console.log('injected :: message from background script', e.data);
            }

            if (e.data && e.data.origin && e.data.origin == 'vpause-button-event') {
                console.log('injected :: message from background script (button)', e.data);

                vPause.addToMyMusic();
            }
        }, false);
    }

    function listenForPlayerEvents() {
        player.on(player, events.play, handlePlay);
        player.on(player, events.pause, handlePause);
        player.on(player, events.progress, handleProgress);
        player.on(player, events.volume, handleVolumeChange);
        player.on(player, events.buffered, handleBufferedData);
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
        };

        vPause.nextTrack = function () {
            player.playNext();
        };

        vPause.setVolume = function(volume){
            player.setVolume(volume);
        };

        vPause.addToMyMusic = function(){
            var $currentAudioRow = document.querySelectorAll('.audio_row[data-is-current="1"]');

            console.log($currentAudioRow);
        };

        vPause.toggleRepeat = function(){
            player.toggleRepeatCurrentAudio();
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

    function handleBufferedData(song, eventData) {
        notifyContentScript({
            event: "buffer",
            song: song,
            buffered: eventData
        });
    }

    function notifyContentScript (msg) {
        msg.origin = 'vpause-injected-listeners-message';

        window.postMessage(msg, window.location.href );
    }
})(window);