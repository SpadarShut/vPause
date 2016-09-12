(function(window, document){
    var vPause = {};

    vPause.KeyCode = window.KeyCode.no_conflict();

    vPause.shortcut = {
        all_shortcuts: {},
        'add': function(shortcut_combination, callback, opt) {
            var default_options = {
                'type': 'keydown',
                'propagate': false,
                'disable_in_input': false,
                'target': document,
                'keycode': false
            };

            if (!opt) opt = default_options; else {
                for (var dfo in default_options) {
                    if (typeof opt[dfo] == 'undefined') opt[dfo] = default_options[dfo];
                }
            }

            var ele = opt.target;

            if (typeof opt.target == 'string') ele = document.getElementById(opt.target);

            var ths = this;

            shortcut_combination = shortcut_combination.toLowerCase();

            var func = function(e) {
                e = e || window.event;

                if (opt['disable_in_input']) {
                    var element;

                    if (e.target) element = e.target; else if (e.srcElement) element = e.srcElement;
                    if (element.nodeType == 3) element = element.parentNode;
                    if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA' || element.contentEditable == 'true') return;
                }

                var key = ths.KeyCode.hot_key(ths.KeyCode.translate_event(e));

                if (key.toLowerCase() === shortcut_combination) {
                    callback(e);

                    if (!opt['propagate']) {
                        e.cancelBubble = true;
                        e.returnValue = false;

                        if (e.stopPropagation) {
                            e.stopPropagation();
                            e.preventDefault();
                        }

                        return false;
                    }
                }
            };

            this.all_shortcuts[shortcut_combination] = {
                'callback': func,
                'target': ele,
                'event': opt['type']
            };

            ele.addEventListener(opt['type'], func, false);
        },
        'remove': function(shortcut_combination) {
            shortcut_combination = shortcut_combination.toLowerCase();

            var binding = this.all_shortcuts[shortcut_combination];

            delete this.all_shortcuts[shortcut_combination];

            if ( !binding ) return;

            var type = binding['event'];
            var ele = binding['target'];
            var callback = binding['callback'];

            ele.removeEventListener(type, callback, false);
        },
        'KeyCode': vPause.KeyCode
    };
    vPause.elements = {
        saveButton: document.getElementById('save-hotkeys'),
        hotkeysSettings: document.getElementById('hotkeysSettings'),
        badgeSettings: document.getElementById('badgeSettings'),
        hotkeysExcludedFrom: document.getElementById('hotkeysExcludedFrom')
    };

    vPause.badgeSettings = document.getElementById('badgeSettings');
    vPause.hexToRgb = function(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    vPause.rgbToHex = function(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    vPause.waitForFinalEvent = (function () {
        var timers = {};
        return function (callback, ms, uniqueId) {
            if (!uniqueId) {
                uniqueId = "Don't call this twice without a uniqueId";
            }
            if (timers[uniqueId]) {
                clearTimeout(timers[uniqueId]);
            }
            timers[uniqueId] = setTimeout(callback, ms);
        };
    })();

    var port = chrome.runtime.connect({ name: "vpause-options" });

    localize();
    getSavedSettings();
    listenForChanges();

    function getSavedSettings() {
        port.postMessage({ event: 'gimmeSavedSettingsPlz' });
        port.onMessage.addListener(function(msg){
            var items = msg.keys;

            if( Object.keys(items).length > 0 ) {
                var hotkeys = {};

                for( var setting in items ) {
                    if( items.hasOwnProperty(setting) ) {
                        if( setting.indexOf('hotkey-') !== -1 ) {
                            hotkeys[setting] = items[setting];
                        }

                        var maybeInput = document.getElementById(setting);

                        if( maybeInput ) {
                            if( maybeInput.type.toLowerCase() === 'checkbox' ) {
                                maybeInput.checked = items[setting];

                                maybeHideSettings(maybeInput, vPause.elements[maybeInput.dataset.toggles]);

                            } else if( maybeInput.type.toLowerCase() === 'color' ) {
                                maybeInput.value = vPause.rgbToHex(items[setting][0], items[setting][1], items[setting][2]);
                            } else if( maybeInput.nodeName.toLowerCase() === 'textarea' ) {
                                maybeInput.value = items[setting].join('\n');
                            } else {
                                maybeInput.value = items[setting];
                            }
                        }
                    }
                }

                addHotKeys(hotkeys);
            }
        });
    }

    function listenForChanges() {
        var $inputs = Array.from(document.querySelectorAll('input, select')),
            $hotkeyInputs = $inputs.filter(function(input){
                return input.id.indexOf('hotkey-') !== -1
            }),
            settings = {};

        listenSetHotkeys($hotkeyInputs);

        $inputs.forEach(function(input){
            input.addEventListener('change', function(e){
                if( e.target.tagName === 'SELECT' ) {
                    settings[e.target.id] = e.target.value;

                    saveSettings(settings);
                }

                if( e.target.type.toLowerCase() === 'checkbox' ) {
                    settings[e.target.id] = e.target.checked;

                    maybeHideSettings(e.target, vPause.elements[e.target.dataset.toggles]);

                    saveSettings(settings);
                }

                if( e.target.type.toLowerCase() === 'color' ) {
                    settings[input.id] = getBadgeColor(vPause.hexToRgb(e.target.value));

                    saveSettings(settings);
                }
            });

            if( input.type.toLowerCase() === 'range' ) {
                input.addEventListener('input', function(e){
                    vPause.waitForFinalEvent(function(){
                        settings[input.id] = Number(input.value);

                        saveSettings(settings);
                    }, 50, 'range-timer');
                });
            }
        });

        vPause.elements.hotkeysExcludedFrom.addEventListener('input', function(e){
            vPause.waitForFinalEvent(function(){
                var value = e.target.value;

                if( value ) {
                    var exclusionArray = value.split('\n');

                    settings[e.target.id] = exclusionArray.filter(function(site){
                        return site !== "";
                    });

                    vPause.elements.saveButton.disabled = false;
                } else {
                    vPause.elements.saveButton.disabled = true;
                }
            }, 500, 'hotkeys-exclusion-timer');
        });

        vPause.elements.saveButton.addEventListener('click', function(){
            $hotkeyInputs.forEach(function(input){
                settings[input.id] = input.value;
            });

            saveSettings(settings);

            var hotkeys = {};

            for( var setting in settings ) {
                if( settings.hasOwnProperty(setting) ) {
                    if( setting.indexOf('hotkey-') !== -1 ) {
                        hotkeys[setting] = settings[setting];
                    }
                }
            }

            updateHotKeys(hotkeys);

            vPause.elements.saveButton.disabled = true;
        });
    }

    function maybeHideSettings(checkbox, block) {
        if( checkbox.checked ) {
            block.style.display = 'block';
        } else {
            block.style.display = 'none';
        }
    }

    function getBadgeColor(hex) {
        return [hex.r, hex.g, hex.b];
    }

    function saveSettings(settings){
        chrome.storage.sync.set(settings);
    }

    function localize() {
        var els = document.querySelectorAll('[data-i18n]');

        for (var i in els) {
            var el = els[i];
            if (!(el instanceof HTMLElement)) {
                continue;
            }
            var propsToLze = el.dataset.i18n.split(';');
            for (var prop in propsToLze) {
                if (!propsToLze.hasOwnProperty(prop)) {
                    continue;
                }
                prop = propsToLze[prop].replace(/\s/g, '');

                // parse els with localized attributes
                if (prop.indexOf('[') === 0) {

                    var hash = prop.match(/\[(.*)\](.*)/);
                    var attr = hash[1];
                    var val = chrome.i18n.getMessage(hash[2]);

                    if (val !== undefined) {
                        el[attr] = val;
                    }
                    else {
                        console.log('vPause :: No such value in locale: ' + hash[2]);
                    }

                } else {
                    // parse translations for innerHTML
                    var msg = chrome.i18n.getMessage(prop);
                    //console.log(prop, msg);
                    if (msg !== undefined){
                        el.innerHTML = msg;
                    }
                    else {
                        console.log('vPause :: No such value in locale: ' + hash[2]);
                    }
                }
            }
        }
    }

    function listenSetHotkeys(inputs) {
        inputs.forEach(function(el){
            el.addEventListener('keydown', function(e) {
                var kc = vPause.KeyCode;
                var key = kc.translate_event(e);
                var shcut = kc.hot_key(key);

                if (shcut == 'Tab' || shcut == 'Shift+Tab') return;

                e.preventDefault();

                var pressed = [],
                    val;

                if (key.code != 16 && key.code != 17 && key.code != 18) {
                    pressed.push(e);

                    if (shcut === "Delete" || shcut === "Backspace") {
                        val = '';
                    } else {
                        val = shcut;
                    }

                    el.value = val;

                    vPause.elements.saveButton.removeAttribute('disabled');

                    return false;
                }
            }, false);
            el.addEventListener('keypress', function(e) {
                var kc = vPause.KeyCode;
                var key = kc.translate_event(e);
                var shcut = kc.hot_key(key);

                if (shcut == 'Tab' || shcut == 'Shift+Tab') return;

                e.preventDefault();
            });
        });
    }

    function addHotKeys(keys) {
        for( var key in keys ) {
            if( keys.hasOwnProperty(key) ) {
                (function(key){
                    if( "" !== keys[key] ) {
                        vPause.shortcut.add(
                            keys[key],
                            function () {
                                notifyBgScript({
                                    event: 'hotkey',
                                    action: key.slice(7)
                                });
                            }, {
                                'type': 'keydown',
                                'disable_in_input': true,
                                'propagate': true
                            }
                        );
                    }
                })(key);
            }
        }
    }

    function updateHotKeys(keys) {
        removeHotKeys();
        addHotKeys(keys);
    }

    function removeHotKeys() {
        var keys = vPause.shortcut.all_shortcuts;

        for( var key in keys ) {
            if( keys.hasOwnProperty(key) ) {
                (function(key){
                    vPause.shortcut.remove(key);
                })(key);
            }
        }
    }

    function notifyBgScript(msg) {
        msg.origin = 'vpause-options';

        port.postMessage(msg);
    }
})(window, document);