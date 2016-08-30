(function(){
    var waitBeforeIconUpdate,
        latestEvent = "idle",
        players = [],
        ports = {},
        utils = {};

    chrome.runtime.onConnect.addListener(handlePortConnect);

    function handlePortConnect(port) {
        if( port.name == "vpause-contentscript" && port.sender.url.match(/^https?:\/\/(vk.com|vkontakte.ru)/) ) {
            port._vpausePortID = port.sender.tab.windowId + "-" + port.sender.tab.id;
            ports[port._vpausePortID] = port;

            port.onMessage.addListener(handleMessage);
            port.onDisconnect.addListener(maybePrunePlayers);
        }
    }

    function handleMessage (msg, port) {
        console.log(msg);

        switch ( msg.event ) {
            case 'play' :
                handlePlayMessage(msg.song);
                maybeAddPlayer(port._vpausePortID);
            break;
            case 'pause' :
                handlePauseMessage(msg.song);
            break;
            case 'volume' :
                handleVolumeMessage(msg.volume);
            break;
            case 'progress' :
                handleProgressMessage(msg.song[5], msg.progressData, msg.reversed);
            break;
            default : break;
        }
    }

    function maybePrunePlayers(port) {
        players = players.filter(function(item){
            return item !== port._vpausePortID
        });
    }

    function maybeAddPlayer(portID) {
        if( players.length > 0 ) {
            if( players[0] !== portID ) {
                players.unshift(portID);
            }
        } else {
            players.unshift(portID);
        }
    }

    function handlePlayMessage(song) {
        Button.setIcon('play');
        Button.setTitle(formatSongTitle(song));

        latestEvent = 'play';
    }

    function handlePauseMessage () {
        Button.setIcon('pause');

        latestEvent = 'pause';
    }

    function handleVolumeMessage(volume) {
        var icon = 'vol_';

        if( volume > 0.7 ) {
            icon += '4'
        } else if( volume >= 0.4 ) {
            icon += '3'
        } else if( volume >= 0.14 ) {
            icon += '2'
        } else if( volume > 0 ) {
            icon += '1'
        } else {
            icon += '0'
        }

        Button.setIcon(icon, true);
    }

    function handleProgressMessage(total, percent, reversed) {
        Button.setBadgeText(utils.tick(total, percent, reversed));
    }

    function formatSongTitle(song) {
        return song[4] + " - " + song[3];
    }

    var Button = (function () {
        var exports = function () {
            var self = this;

            this.button = chrome.browserAction;
            this.icons = {
                idle:       'img/btn_idle.png',
                play:       'img/btn_play.png',
                play_dis:   'img/btn_play_disabled.png',
                pause:      'img/btn_pause.png',
                prevTrack:  'img/btn_prev.png',
                nextTrack:  'img/btn_next.png',
                repeat:     'img/btn_repeat.png',
                repeat_dis: 'img/btn_repeat_disabled.png',
                vol_0:      'img/btn_vol_0.png',
                vol_1:      'img/btn_vol_1.png',
                vol_2:      'img/btn_vol_2.png',
                vol_3:      'img/btn_vol_3.png',
                vol_4:      'img/btn_vol_4.png',
                added:      'img/btn_plus.png'
            };

            this.setIcon = function (icon, andRestore) {
                this.button.setIcon({
                    path: self.icons[icon]
                });

                if ( waitBeforeIconUpdate ) {
                    clearTimeout(waitBeforeIconUpdate);

                    waitBeforeIconUpdate = null;
                }

                if ( andRestore ) {
                    waitBeforeIconUpdate = setTimeout(function () {
                        self.button.setIcon({
                            path: self.icons[latestEvent]
                        });
                    }, 1500);
                }
            };

            this.setBadgeText = function (text) {
                this.button.setBadgeText({ text: text });
            };

            this.setTitle = function (title) {
                this.button.setTitle({ title: title })
            };
        };

        return new exports();
    })();

    Button.setIcon('idle');
    Button.setBadgeText('...');
    Button.button.onClicked.addListener(buttonClicked);

    function buttonClicked(){
        ports[players[0]].postMessage({
            origin: 'vpause-button-event',
            event: 'click'
        });
    }

    utils.formatTime = typeof window.formatTime === 'function' ? window.formatTime : function (t, forceHours) {
        var res, sec, min;

        t = Math.max(t, 0);
        sec = Math.floor(t % 60);
        res = (sec < 10) ? '0'+sec : sec;
        t = Math.floor(t / 60);
        min = t % 60;
        res = min+':'+res;
        t = Math.floor(t / 60);

        if (t > 0 || forceHours) {
            if (min < 10) res = '0' + res;
            res = t+':'+res;
        }

        return res;
    };

    utils.tick = function(duration, progress, reverse){
        return reverse == 1 ? "-" + utils.formatTime(Math.round(duration - progress * duration)) : utils.formatTime(Math.round(progress * duration));
    }
})();
