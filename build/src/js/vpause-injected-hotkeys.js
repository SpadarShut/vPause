(function(window){
    var vPause = {};

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
        'KeyCode': window.KeyCode.no_conflict()
    };

    notifyContentScript({
        event: "sendHotkeys"
    });

    window.addEventListener('message', function (e) {
        if (e.data && e.data.origin && e.data.origin == 'vpause-background-event') {
            switch( e.data.action ) {
                case 'addKeys' :
                    addHotKeys(e.data.keys);
                break;
                case 'updateKeys' :
                    updateHotKeys(e.data.keys);
                break;
            }
        }
    }, false);

    function addHotKeys(keys) {
        for( var key in keys ) {
            if( keys.hasOwnProperty(key) ) {
                (function(key){
                    if( "" !== keys[key] ) {
                        vPause.shortcut.add(
                            keys[key],
                            function () {
                                notifyContentScript({
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

        console.log('shortcuts now are', vPause.shortcut.all_shortcuts);
    }

    function removeHotKeys() {
        vPause.shortcut.all_shortcuts = {};
    }

    function notifyContentScript(msg) {
        msg.origin = 'vpause-injected-hotkeys';

        window.postMessage(msg, window.location.href );
    }
})(window);