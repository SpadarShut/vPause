(function(){
    var latestEvent = "idle",
        players = [],
        ports = {},
        utils = {},
        settings = {},
        defaults = {
            'dblClickAction': 'focusPlayerTab',
            'badgeOpacity': 100,
            'badgeColor': [0, 0, 0],
            'showBadge': false,
            'useHotkeys': true,
            'hotkeysExcludedFrom': [],
            'hotkey-togglePlay': 'Shift+End',
            'hotkey-prevTrack': 'Ctrl+Shift+Left',
            'hotkey-nextTrack': 'Ctrl+Shift+Right',
            'hotkey-volUp': 'Ctrl+Shift+Up',
            'hotkey-volDown': 'Ctrl+Shift+Down',
            'hotkey-addSong': 'D',
            'hotkey-focusPlayerTab': 'T',
            'hotkey-toggleRepeat': 'R',
            'hotkey-toggleMute': 'M',
            'hotkey-seekForward': 'Ctrl+Alt+Shift+Right',
            'hotkey-seekBack': 'Ctrl+Alt+Shift+Left',
            'hotkey-toggleShuffle': 'S'
        },
        knowsWhatWeDidLastSummer = false;

    chrome.storage.sync.get(null, function(items) {
        settings = Object.keys(items).length > 0
            ? mergeSettings(items, defaults)
            : mergeSettings(window.localStorage, defaults);

        chrome.storage.sync.set(settings);

        chrome.runtime.onConnect.addListener(function (port) {
            if( port.name == "vpause-contentscript" ) {
                if( port.sender.url.match(/^https?:\/\/(vk.com|vkontakte.ru)/) ) {
                    port._vpausePortID = port.sender.tab.windowId + "-" + port.sender.tab.id;
                    ports[port._vpausePortID] = port;

                    port.onDisconnect.addListener(handlePortDisconnect);
                }

                port.onMessage.addListener(handleMessage);
            } else if( port.name == "vpause-options" ) {
                port.onMessage.addListener(function(msg, port) {
                    if( 'gimmeSavedSettingsPlz' === msg.event ) {
                        port.postMessage({
                            origin: 'vpause-background-event',
                            keys: settings
                        });
                    } else if( msg.origin == 'vpause-options' ) {
                        sendActionToListeners(msg.action);
                    }
                });
            }
        });

        chrome.storage.onChanged.addListener(function(changes) {
            //todo: use the changes variable instead - shortcode.add function needs some "ol'-school fix-it"
            chrome.storage.sync.get(null, function(items) {
                var hotkeysToUpdate = {};

                for (var key in items) {
                    if( items.hasOwnProperty(key) ) {
                        var storageChange = items[key];

                        settings[key] = storageChange;

                        if( key.indexOf('hotkey-') !== -1 ) {
                            hotkeysToUpdate[key] = storageChange;
                        }
                    }
                }

                if( Object.keys(hotkeysToUpdate).length > 0 ) {
                    kindlyUpdateHotkeys(hotkeysToUpdate);
                }

                if( ! settings.useHotkeys ) {
                    kindlyUpdateHotkeys({});
                }

                if( settings.hotkeysExcludedFrom.length > 0 ) {
                    excludeHotkeysFrom(settings.hotkeysExcludedFrom);
                }

                maybeHideBadge();
                updateBadgeColor();
            });
        });

        initBrowserAction();
        handleCommands();
    });

    function kindlyUpdateHotkeys(hotkeys) {
        chrome.tabs.query({ currentWindow: true }, function(tabs) {
            tabs.forEach(function(tab){
                chrome.tabs.sendMessage(tab.id, {
                    origin: 'vpause-background-event',
                    action: 'updateKeys',
                    keys: hotkeys
                });
            });
        });
    }

    function excludeHotkeysFrom(sites) {
        chrome.tabs.query({ currentWindow: true }, function(tabs) {
            tabs.forEach(function(tab){
                sites.forEach(function(site){
                    if( tab.url.indexOf(site) !== -1 ) {
                        chrome.tabs.sendMessage(tab.id, {
                            origin: 'vpause-background-event',
                            action: 'updateKeys',
                            keys: {}
                        });
                    }
                });
            });
        });
    }

    function maybeHideBadge() {
        if( settings.showBadge ) {
            button.setBadgeText('...');

            setTimeout(function(){
                if( 'idle' === latestEvent ) {
                    button.setBadgeText('');
                }
            }, 1500)
        } else {
            button.setBadgeText('');
        }
    }

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
            case 'mute' :
                handleMuteMessage();
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
            case 'shuffle' :
                handleShuffleMessage(msg.reversed);
            break;
            case 'seek' :
                handleSeekMessage(msg.forward);
            break;
            case 'repeat' :
                handleRepeatMessage(msg.reversed);
            break;
            case 'connection' :
                handleConnectionMessage(msg.song);
            break;
            case 'sendHotkeys' :
                sendHotkeys(port);
            break;
            case 'hotkey' :
                sendActionToListeners(msg.action);
            break;
            default : break;
        }
    }

    function handleCommands () {
        chrome.commands.onCommand.addListener(function(command) {
            sendActionToListeners(command);
        });
    }

    function sendHotkeys(port) {
        port.postMessage({
            origin: 'vpause-background-event',
            action: 'addKeys',
            keys: pruneHotkeys(settings)
        });
    }

    function pruneHotkeys(settings) {
        var hotkeys = {};

        for( var option in settings ) {
            if( settings.hasOwnProperty(option) && option.indexOf('hotkey-') !== -1 ) {
                hotkeys[option] = settings[option];
            }
        }

        return hotkeys;
    }

    function mergeSettings(saved, defaults) {
        var settings = {},
            settingsKeys;

        for( var option in saved ) {
            if( saved.hasOwnProperty(option) ) {
                settings[option] = saved[option];
            }
        }

        settingsKeys = Object.keys(settings);

        for( var defaultOption in defaults ) {
            if( defaults.hasOwnProperty(defaultOption) ) {
                if( settingsKeys.indexOf(defaultOption) === -1 ) {
                    settings[defaultOption] = defaults[defaultOption];
                }
            }
        }

        return settings;
    }

    function sendActionToListeners(action) {
        if( 'focusPlayerTab' === action ) {
            handleFocusMessage();
        } else if( players.length > 0 ) {
            ports[players[0]].postMessage({
                origin: 'vpause-background-event',
                event: 'hotkey',
                action: action
            });
        }
    }

    function handlePortDisconnect(port){
        delete ports[port._vpausePortID];

        var portKeys = getVpausePorts(),
            icon = 'idle',
            title = chrome.i18n.getMessage("openVK");

        players = players.filter(function(item){
            return item !== port._vpausePortID
        });

        if( players.length > 0 ) {
            icon = latestEvent;
            title = 'vPause';
        } else if( portKeys.length > 0 ) {
            icon = 'play';
            title = 'vPause';
        }

        button.setIcon(icon);
        button.setTitle(title);
        button.setBadgeText('');
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
        button.setIcon('pause');
        button.setTitle(formatSongTitle(song));

        latestEvent = 'pause';
    }

    function handlePauseMessage (song) {
        button.setIcon('play');
        button.setTitle(formatSongTitle(song));

        latestEvent = 'play';
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

    function handleMuteMessage() {
        button.setIcon('vol_0');
    }

    function handleNextSongMessage() {
        button.setIcon('nextTrack', true);
        button.setBadgeText('');
    }

    function handlePrevSongMessage() {
        button.setIcon('prevTrack', true);
        button.setBadgeText('');
    }

    function handleSongAddedMessage() {
        button.setIcon('added', true);
    }

    function handleSongRemovedMessage() {
        button.setIcon('removed', true);
    }

    function handleProgressMessage(total, percent, reversed) {
        button.setBadgeText(utils.tick(total, percent, reversed));
    }

    function handleFocusMessage(){
        var tabId = 0,
            portKeys = getVpausePorts();

        if( players.length > 0 ) {
            tabId = Number(players[0].split('-')[1])
        } else if ( portKeys.length > 0 ) {
            tabId = Number(portKeys[portKeys.length - 1].split('-')[1])
        }

        if( tabId > 0 ) {
            focusTab(tabId);

            button.setIcon('tab', true);
        }
    }

    function handleConnectionMessage(song) {
        var portKeys = getVpausePorts();

        if( song.length > 0 ) {
            knowsWhatWeDidLastSummer = true;
        }

        if( players[0] && latestEvent !== 'pause' ) {
            button.setIcon('play');
            button.setTitle(formatSongTitle(song));
        } else if( portKeys.length > 0 && song.length > 0 && players.length == 0 ) {
            button.setIcon('play');
            button.setTitle(formatSongTitle(song));
        }
    }

    function handleShuffleMessage(reverse) {
        reverse = reverse || false;

        if( ! reverse ) {
            button.setIcon('shuffle_dis', true);
        } else {
            button.setIcon('shuffle', true);
        }
    }

    function handleSeekMessage(forward) {
        forward = forward || false;

        if( ! forward ) {
            button.setIcon('seekBack', true);
        } else {
            button.setIcon('seekForward', true);
        }
    }

    function handleRepeatMessage(reverse) {
        reverse = reverse || false;

        if( ! reverse ) {
            button.setIcon('repeat_dis', true);
        } else {
            button.setIcon('repeat', true);
        }
    }

    function focusTab(id) {
        chrome.tabs.update(id, { selected: true });
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
            if ( ! settings.showBadge ) {
                this.thing.setBadgeText({ text: "" });

                return;
            }

            this.thing.setBadgeText({ text: text });
        },
        setTitle: function (title) {
            this.thing.setTitle({ title: title })
        },
        calculateColor: function(rgb, opacity){
            var colorArr = [];

            rgb.forEach(function(color){
                colorArr.push(color);
            });

            colorArr.push(opacity);

            return colorArr;
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
            seekForward: 'img/btn_repeat.png',
            seekBack: 'img/btn_repeat_disabled.png',
            shuffle: 'img/btn_shuffle.png',
            shuffle_dis: 'img/btn_shuffle_disabled.png',
            vol_0: 'img/btn_vol_0.png',
            vol_1: 'img/btn_vol_1.png',
            vol_2: 'img/btn_vol_2.png',
            vol_3: 'img/btn_vol_3.png',
            vol_4: 'img/btn_vol_4.png',
            tab: 'img/btn_tab.png',
            added: 'img/btn_add.png',
            removed: 'img/btn_remove.png'
        }
    };

    function initBrowserAction(){
        updateBadgeColor();

        button.setIcon(latestEvent);
        button.setTitle(chrome.i18n.getMessage("openVK"));
        button.setBadgeText('');

        button.thing.onClicked.addListener(function(){
            if ( button.singleClickPending ) {
                clearTimeout(button.singleClickPending);
                button.singleClickPending = null;

                if( players.length > 0 ) {
                    handleDoubleClickWithPlayer();
                } else {
                    guessWhatTheUserWants();
                }
            } else {
                button.singleClickPending = setTimeout(function () {
                    button.singleClickPending = null;

                    if( players.length > 0 ) {
                        handleSingleClickWithPlayer();
                    } else {
                        guessWhatTheUserWants();
                    }
                }, button.dblClickTimeout);
            }
        });
    }

    function updateBadgeColor() {
        button.thing.setBadgeBackgroundColor({
            color: button.calculateColor(settings.badgeColor, settings.badgeOpacity)
        });
    }

    function handleSingleClickWithPlayer() {
        ports[players[0]].postMessage({
            origin: 'vpause-button-event',
            event: 'single-click',
            action: 'togglePlay'
        });
    }

    function handleDoubleClickWithPlayer() {
        if( 'focusPlayerTab' === settings.dblClickAction ) {
            handleFocusMessage();
        } else {
            ports[players[0]].postMessage({
                origin: 'vpause-button-event',
                event: 'double-click',
                action: settings.dblClickAction
            });
        }
    }

    function guessWhatTheUserWants() {
        var portsIDs = getVpausePorts();

        if( portsIDs.length === 0 ) {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if( 'chrome://startpage/' === tabs[0].url || 'chrome://newtab/' === tabs[0].url ) {
                    chrome.tabs.update({ url: 'https://vk.com/' });
                } else {
                    chrome.tabs.create({ url: 'https://vk.com/' });
                }
            });

            button.setTitle('vPause');
        } else {
            var lastVkTab = portsIDs[portsIDs.length - 1]; //may not be the last but I don't care much in this case

            if( ! knowsWhatWeDidLastSummer ) {
                focusTab(Number(lastVkTab.split('-')[1]));
            }

            ports[lastVkTab].postMessage({
                origin: 'vpause-button-event',
                event: 'single-click',
                action: 'startTheParty'
            });
        }
    }

    function getVpausePorts() {
        return Object.keys(ports);
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
