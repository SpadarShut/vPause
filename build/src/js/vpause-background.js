(function(){
    var latestEvent = "idle",
        players = [],
        ports = {},
        utils = {};

    chrome.runtime.onConnect.addListener(function (port) {
        if( port.name == "vpause-contentscript" ) {
            if( port.sender.url.match(/^https?:\/\/(vk.com|vkontakte.ru)/) ) {
                port._vpausePortID = port.sender.tab.windowId + "-" + port.sender.tab.id;
                ports[port._vpausePortID] = port;

                port.onDisconnect.addListener(maybePrunePlayers);
            }

            port.onMessage.addListener(handleMessage);
        }
    });

    function handleMessage (msg, port) {
        switch ( msg.event ) {
            case 'play' :
                handlePlayMessage(msg.song);
                maybeAddPlayerID(port._vpausePortID);
            break;
            case 'pause' :
                handlePauseMessage(msg.song);
            break;
            case 'volume' :
                handleVolumeMessage(msg.volume);
            break;
            case 'nextSong' :
                handleNextSongMessage();
            break;
            case 'prevSong' :
                handlePrevSongMessage();
            break;
            case 'songAdded' :
                handleSongAddedMessage();
            break;
            case 'songRemoved' :
                handleSongRemovedMessage();
            break;
            case 'progress' :
                handleProgressMessage(msg.song[5], msg.progressData, msg.reversed);
            break;
            case 'focus' :
                handleFocusMessage();
            break;
            case 'sendHotkeys' :
                sendHotkeys(port);
            break;
            case 'hotkey' :
                sendHotkeyToListeners(msg.action);
            break;
            default : break;
        }
    }

    function sendHotkeys(port) {
        port.postMessage({
            origin: 'vpause-background-event',
            action: 'addKeys',
            keys: getSavedHotkeys()
        });
    }

    function sendHotkeyToListeners(action) {
        if( 'focusPlayerTab' === action ) {
            handleFocusMessage();
        } else {
            if( players.length > 0 ) {
                ports[players[0]].postMessage({
                    origin: 'vpause-background-event',
                    event: 'hotkey',
                    action: action
                });
            } else {
                //handle hotkey behaviour for no-players situation
                console.log('handling action', action);
            }
        }
    }

    function getSavedHotkeys() {
        return {
            'hotkey-togglePlay': 'Shift+End',
            'hotkey-prevTrack': 'Ctrl+Shift+Left',
            'hotkey-nextTrack': 'Ctrl+Shift+Right',
            'hotkey-volUp': 'Ctrl+Shift+Up',
            'hotkey-volDown': 'Ctrl+Shift+Down',
            'hotkey-addSong': 'D',
            'hotkey-focusPlayerTab': 'T',
            'hotkey-toggleRepeat': 'R',
            'hotkey-toggleMute': 'M',
            'hotkey-toggleShuffle': 'S'
        };
    }

    function maybePrunePlayers(port) {
        players = players.filter(function(item){
            return item !== port._vpausePortID
        });
    }

    function maybeAddPlayerID(portID) {
        if( players.length > 0 ) {
            if( players[0] !== portID ) {
                players.unshift(portID);
            }
        } else {
            players.unshift(portID);
        }
    }

    function handlePlayMessage(song) {
        button.setIcon('play');
        button.setTitle(formatSongTitle(song));
        button.setBadgeText('');

        latestEvent = 'play';
    }

    function handlePauseMessage () {
        button.setIcon('pause');

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

        button.setIcon(icon, true);
    }

    function handleNextSongMessage() {
        button.setIcon('nextTrack', true);
    }

    function handlePrevSongMessage() {
        button.setIcon('prevTrack', true);
    }

    function handleSongAddedMessage() {
        button.setIcon('added', true);
    }

    function handleSongRemovedMessage() {
        button.setIcon('added', true); //todo: add the remove icon
    }

    function handleProgressMessage(total, percent, reversed) {
        button.setBadgeText(utils.tick(total, percent, reversed));
    }

    function handleFocusMessage(){
        var tabId = 0;

        if( players.length > 0 ) {
            tabId = Number(players[0].split('-')[1])
        }

        if( tabId > 0 ) {
            chrome.tabs.update(tabId, { selected: true });
        } else {
            //todo: add a user setting on what to do when no players
            console.warn("Can't focus player tab");
        }

        button.setIcon('tab', true);
    }

    function formatSongTitle(song) {
        return utils.htmlDecode(song[4] + " - " + song[3] + " (" + utils.formatTime(song[5]) + ")");
    }

    var button = {
        singleClickPending: false,
        waitBeforeIconUpdate: false,
        dblClickTimeout: 300,
        thing: chrome.browserAction,
        setIcon: function(icon, andRestore){
            this.thing.setIcon({
                path: this.icons[icon]
            });

            if ( this.waitBeforeIconUpdate ) {
                window.clearTimeout(this.waitBeforeIconUpdate);
                this.waitBeforeIconUpdate = null;
            }

            if ( andRestore ) {
                this.waitBeforeIconUpdate = setTimeout(function () {
                    this.thing.setIcon({
                        path: this.icons[latestEvent]
                    });
                }.bind(this), 1500);
            }
        },
        setBadgeText: function (text) {
            this.thing.setBadgeText({ text: text });
        },
        setTitle: function (title) {
            this.thing.setTitle({ title: title })
        },
        icons: {
            idle: 'img/btn_idle.png',
            play: 'img/btn_play.png',
            play_dis: 'img/btn_play_disabled.png',
            pause: 'img/btn_pause.png',
            prevTrack: 'img/btn_prev.png',
            nextTrack: 'img/btn_next.png',
            repeat: 'img/btn_repeat.png',
            repeat_dis: 'img/btn_repeat_disabled.png',
            vol_0: 'img/btn_vol_0.png',
            vol_1: 'img/btn_vol_1.png',
            vol_2: 'img/btn_vol_2.png',
            vol_3: 'img/btn_vol_3.png',
            vol_4: 'img/btn_vol_4.png',
            tab: 'img/btn_tab.png',
            added: 'img/btn_plus.png'
        }
    };

    button.setIcon(latestEvent);
    button.setBadgeText('...');
    button.thing.setBadgeBackgroundColor({
        color: [0, 0, 0, 100]
    });
    button.thing.onClicked.addListener(function(){
        if ( button.singleClickPending ) {
            clearTimeout(button.singleClickPending);
            button.singleClickPending = null;

            if( players.length > 0 ) {
                handleDoubleClickWithPlayer();
            } else {
                handleDoubleClickWithNoPlayers();
            }
        } else {
            button.singleClickPending = setTimeout(function () {
                button.singleClickPending = null;

                if( players.length > 0 ) {
                    handleSingleClickWithPlayer();
                } else {
                    handleSingleClickWithNoPlayers();
                }
            }, button.dblClickTimeout);
        }
    });

    function handleSingleClickWithPlayer() {
        ports[players[0]].postMessage({
            origin: 'vpause-button-event',
            event: 'single-click',
            action: 'togglePlay'
        });
    }

    function handleDoubleClickWithPlayer() {
        ports[players[0]].postMessage({
            origin: 'vpause-button-event',
            event: 'double-click',
            action: 'nextTrack'
        });
    }

    function handleSingleClickWithNoPlayers() {
        console.warn("Single click with no players");
    }

    function handleDoubleClickWithNoPlayers() {
        console.warn("Double click with no players");
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
    };

    utils.htmlDecode = function (input) {
        var e = window.document.createElement('a');
        e.innerHTML = input;
        if (e.querySelector('*')) {
            e.innerHTML = e.textContent;
        }
        return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
    }
})();
