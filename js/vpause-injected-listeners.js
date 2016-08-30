(function(window){
    vPause = window.vPause || {};

    var player = typeof getAudioPlayer === 'function' ? getAudioPlayer() : null;

    if( ! player ) return;

    //maybe todo: utilise the AudioPlayer function to search for events
    var events = {
        'play': 'start',
        'pause': 'pause',
        'progress': 'progress',
        'volume': 'volume',
        'buffered': 'buffered'
    };

    listenForPlayerEvents();
    listenForExtensionMessages();
    initvPauseMethods();

    function listenForPlayerEvents() {
        player.on(player, events.play, handlePlay);
        player.on(player, events.pause, handlePause);
        player.on(player, events.progress, handleProgress);
        player.on(player, events.volume, handleVolumeChange);
        player.on(player, events.buffered, handleBufferedData);
    }

    function listenForExtensionMessages() {
        window.addEventListener('message', function (e) {
            //console.log('event from a button', e);

            // if (e.data && e.data.origin && e.data.origin == 'vpause-contentscript-message') {
            //     console.log('injected :: vpause-contentscript-message event: ', e.data.info);
            //     vPause.handleBgMessaging(e.data.info)
            // }
        }, false);
    }

    function initvPauseMethods() {
        vPause.togglePlay = function(){
            if( player.isPlaying() ) {
                player.pause();

                vPause.mes({
                    type: 'iconChange',
                    info: 'pause'
                })
            } else {
                player.play();

                vPause.mes({
                    type: 'iconChange',
                    info: 'play'
                })
            }
        };

        vPause.toggleRepeat = function () {
            player.toggleRepeatCurrentAudio();

            vPause.mes({
                type: 'iconChange',
                info: player._repeatCurrent ? 'repeat' : 'repeat_dis'
            })
        };

        vPause.prevTrack = function () {
            player.playPrev();

            vPause.mes({
                type: 'iconChange',
                info: 'prevTrack'
            })
        };

        vPause.nextTrack = function () {
            player.playNext();

            vPause.mes({
                type: 'iconChange',
                info: 'nextTrack'
            })
        };

        vPause.updateIcon = function () {
            if( player.isPlaying() ) {
                vPause.mes({
                    type: 'iconChange',
                    info: 'play'
                })
            } else {
                vPause.mes({
                    type: 'iconChange',
                    info: 'pause'
                })
            }
        };

    }

    function handlePlay(song) {
        console.log('handling play');
        //console.log(song);
    }

    function handlePause(song) {
        console.log('handling pause');
        //console.log(song);
    }

    function handleProgress(song, eventData) {
        //console.log('progress event', eventData);
    }

    function handleVolumeChange(song, eventData) {
        //console.log('volume event', d);
    }

    function handleBufferedData(song, eventData) {
        console.log(song);
        console.log('buffered event', eventData);
    }
})(window);