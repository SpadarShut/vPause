(function(window, document){
    var vPause = {};

    vPause.saveButton = document.getElementById('save-hotkeys');
    vPause.KeyCode = window.KeyCode.no_conflict();

    localize();
    getSavedSettings();
    listenForChanges();

    function getSavedSettings() {
        var port = chrome.runtime.connect({ name: "vpause-options" });

        port.postMessage({ event: 'gimmeSavedSettingsPlz' });
        port.onMessage.addListener(function(msg){
            var items = msg.keys;

            if( Object.keys(items).length > 0 ) {
                for( var setting in items ) {
                    if( items.hasOwnProperty(setting) ) {
                        var maybeInput = document.getElementById(setting);

                        if( maybeInput ) {
                            maybeInput.value = items[setting];
                        }
                    }
                }
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
            });
        });

        vPause.saveButton.addEventListener('click', function(){
            $hotkeyInputs.forEach(function(input){
                settings[input.id] = input.value;
            });

            saveSettings(settings);

            vPause.saveButton.disabled = true;
        });
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

                    //console.log(prop, msg);
                    if (val === undefined) {
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

                    vPause.saveButton.removeAttribute('disabled');

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
})(window, document);