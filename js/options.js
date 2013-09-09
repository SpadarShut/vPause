
addEventListener('DOMContentLoaded', function() {
    var prefsLocation = window.localStorage;
    var glue = '\n';
    var formElements = document.querySelectorAll('input,select');
    var skip = hash('hidden,submit,image,reset,button');
    var multipleValues = hash('checkbox,select-multiple');
    var checkable = hash('checkbox,radio');

    function hash(str, glue) {
        var obj = {
        };
        var tmp = str.split(glue || ',');
        while (tmp.length) {
            obj[tmp.pop()] = true;
        }
        return obj;
    }

    function walkElements(callback) {
        var obj = [];
        for (var i = 0, element = null; element = formElements[i++]; ) {
            var type = element.type.toLowerCase();
            var name = element.name || '';
            if (skip[type] === true || name == '') continue;
            var tmp = callback(element, name, type);
            if (tmp != null) obj.push(tmp);
        }
        return obj;
    }

    function changedElement(e) {
        var element = e.currentTarget || e;
        var type = element.type.toLowerCase();
        var name = element.name || '';
        var value = multipleValues[type] !== true ? element.value : walkElements(function(e, n, t) {
            if (n == name && e.options) {
                var tmp = [];
                for (var j = 0, option = null; option = e.options[j++]; ) {
                    if (option.selected) {
                        tmp.push(option.value);
                    }
                }
                return tmp.join(glue);
            } else if (n == name && checkable[t] === true && e.checked) {
                return e.value;
            }
        }).join(glue);
        console.log('change: ', name, value);
        prefsLocation.setItem(name, value);
    }

    function setPrefs(defaults) {
        if (!defaults) return;
        for (var option in defaults) {
            if (prefsLocation[option] === undefined) {
                prefsLocation[option] = defaults[option];
            }
        }
        walkElements(function(element, name, type) {
            var value = prefsLocation[name] !== undefined ? prefsLocation.getItem(name) : element.value;
            var valueHash = hash(value, glue);
            if (element.selectedOptions) {
                for (var j = 0, option = null; option = element.options[j++]; ) {
                    option.selected = valueHash[option.value] === true;
                }
            } else if (checkable[type] === true) {
                element.checked = valueHash[element.value] === true;
            } else {
                element.value = value;
            }
            if (prefsLocation[name] == undefined) {
                changedElement(element);
            }
            element.addEventListener('input', changedElement, true);
        });
    }

    function $(id) {
        return window.document.getElementById(id);
    }

    function getPref(pref) {
        var val = prefsLocation[pref];
        if (typeof val === 'undefined') {
            val = chrome.extension.getBackgroundPage().defaults[pref];
        }
        console.log('getPref:' + pref + ": " + val);
        return val;
    }

    function mes(mes) {
        // todo
        //opera.extension.postMessage(mes);
        chrome.runtime.sendMessage(mes);
    }

    function listenSetHotkeys() {
        var inputs = window.document.querySelectorAll('input[id ^="hotkey-"]');
        Array.prototype.forEach.call(inputs, function(el) {
            el.addEventListener('keydown', function(e) {
                var kc = vPause.Shortcut.KeyCode;
                var key = kc.translate_event(e);
                var shcut = kc.hot_key(key);
                if (shcut == 'Tab' || shcut == 'Shift+Tab') return;
                e.preventDefault();
                var pressed = [], val;
                if (key.code != 16 && key.code != 17 && key.code != 18) {
                    pressed.push(e);
                    if (shcut === "Delete" || shcut === "Backspace") {
                        val = '';
                    } else {
                        val = shcut;
                    }
                    el.value = val;
                    $('save-hotkeys').removeAttribute('disabled');
                    return false;
                }
            }, false);
            el.addEventListener('keypress', function(e) {
                var kc = vPause.Shortcut.KeyCode;
                var key = kc.translate_event(e);
                var shcut = kc.hot_key(key);
                if (shcut == 'Tab' || shcut == 'Shift+Tab') return;
                e.preventDefault();
            });
        });
    }

    function saveHotkeys(e) {
        if (e.target.disabled) return;
        var oldHotkeys = {
        };
        for (var el in prefsLocation) {
            if (el.indexOf('hotkey-') === 0) {
                oldHotkeys[el.substring(7)] = prefsLocation[el];
            }
        }
        for (var k in oldHotkeys) {
            window.vPause.Shortcut.remove(oldHotkeys[k]);
        }
        var inputs = window.document.querySelectorAll('input[id ^="hotkey-"]');
        Array.prototype.forEach.call(inputs, function(el) {
            changedElement(el);
        });
        setHotkeys();
        mes({
            type: 'updatehotkeys',
            info: oldHotkeys
        });
        $('save-hotkeys').disabled = true;
    }

    function getHotkeysList() {
        var ks = { };
        for (var el in prefsLocation) {
            if (el.indexOf('hotkey-') === 0) {
                ks[el.substring(7)] = prefsLocation[el];
            }
        }
        return ks;
    }

    function setHotkeys() {
        var keys = getHotkeysList();
        console.log('settingHotkeys', JSON.stringify(keys));
        for (var key in keys) {
            if (key && keys[key]) {
                (function(key) {
                    window.vPause.Shortcut.add(keys[key], function(e) {
                        mes({
                            type: 'hotkey',
                            info: key
                        });
                    }, {
                        'type': (key == 'hotkey-volUp' || key == 'hotkey-volDown') ? 'keypress' : 'keydown',
                        'disable_in_input': true,
                        'propagate': true
                    });
                })(key);
            }
        }
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

          console.log(prop, msg);
          if (val === undefined) {
            el[attr] = val;
          }
          else {
            console.log('vPause :: No such value in locale: ' + hash[2]);
          }

        } else {
          // parse translations for innerHTML
          var msg = chrome.i18n.getMessage(prop);
          console.log(prop, msg);
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

    function init() {
        console.log(JSON.stringify(getHotkeysList()));
        console.log('defs', chrome.extension.getBackgroundPage().defaults);
        setPrefs(chrome.extension.getBackgroundPage().defaults);
        setHotkeys();
        localize();
        listenSetHotkeys();
        $('save-hotkeys').addEventListener('click', saveHotkeys, false);
        document.body.classList.add('ready');
    }

    init();
}, false);
