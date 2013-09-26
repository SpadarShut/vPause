
(function() {
  var modifiers = ['ctrl','alt','shift'], KEY_MAP = {
  }, shifted_symbols = {
    58: 59,
    43: 61,
    60: 44,
    95: 45,
    62: 46,
    63: 47,
    96: 192,
    124: 92,
    39: 222,
    34: 222,
    33: 49,
    64: 50,
    35: 51,
    36: 52,
    37: 53,
    94: 54,
    38: 55,
    42: 56,
    40: 57,
    41: 58,
    123: 91,
    125: 93
  };
  function isLower(ascii) {
    return ascii >= 97 && ascii <= 122;
  }
  ;
  function capitalize(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();
  }
  ;
  var is_gecko = window.navigator.userAgent.indexOf('Gecko') != -1, is_ie = window.navigator.userAgent.indexOf('MSIE') != -1, is_windows = window.navigator.platform.indexOf('Win') != -1, is_opera = window.opera && window.opera.version() < 9.5, is_konqueror = window.navigator.vendor && window.navigator.vendor.indexOf('KDE') != -1, is_icab = window.navigator.vendor && window.navigator.vendor.indexOf('iCab') != -1;
  var GECKO_IE_KEYMAP = {
    186: 59,
    187: 61,
    188: 44,
    109: 95,
    107: 61,
    189: 95,
    190: 62,
    191: 47,
    192: 126,
    219: 91,
    220: 92,
    221: 93
  };
  var OPERA_KEYMAP = {
  };
  if (is_opera && is_windows) {
    KEY_MAP = OPERA_KEYMAP;
  } else if (is_opera || is_konqueror || is_icab) {
    var unshift = [33,64,35,36,37,94,38,42,40,41,58,43,60,95,62,63,124,34];
    KEY_MAP = OPERA_KEYMAP;
    for (var i = 0; i < unshift.length; ++i) {
      KEY_MAP[unshift[i]] = shifted_symbols[unshift[i]];
    }
  } else {
    KEY_MAP = GECKO_IE_KEYMAP;
  }
  if (is_konqueror) {
    KEY_MAP[0] = 45;
    KEY_MAP[127] = 46;
    KEY_MAP[45] = 95;
  }
  var key_names = {
    32: 'SPACE',
    13: 'ENTER',
    9: 'TAB',
    8: 'BACKSPACE',
    16: 'SHIFT',
    17: 'CTRL',
    18: 'ALT',
    20: 'CAPS_LOCK',
    144: 'NUM_LOCK',
    145: 'SCROLL_LOCK',
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
    33: 'PAGE_UP',
    34: 'PAGE_DOWN',
    36: 'HOME',
    35: 'END',
    45: 'INSERT',
    46: 'DELETE',
    27: 'ESCAPE',
    19: 'PAUSE',
    222: "'"
  };
  function fn_name(code) {
    if (code >= 112 && code <= 123) return 'F' + (code - 111);
    return false;
  }
  ;
  function num_name(code) {
    if (code >= 96 && code < 106) return 'Num' + (code - 96);
    switch (code) {
      case 106:
        return 'Num*';
      case 111:
        return 'Num/';
      case 110:
        return 'Num.';
      default:
        return false;
    }
  }
  ;
  var current_keys = {
    codes: {
    },
    ctrl: false,
    alt: false,
    shift: false
  };
  function update_current_modifiers(key) {
    current_keys.ctrl = key.ctrl;
    current_keys.alt = key.alt;
    current_keys.shift = key.shift;
  }
  ;
  function same_modifiers(key1, key2) {
    return key1.ctrl === key2.ctrl && key1.alt === key2.alt && key1.shift === key2.shift;
  }
  ;
  if (typeof window.KeyCode != "undefined") {
    var _KeyCode = window.KeyCode;
  }
  var KeyCode = window.KeyCode = {
    no_conflict: function() {
      window.KeyCode = _KeyCode;
      return KeyCode;
    },
    fkey: function(num) {
      return 111 + num;
    },
    numkey: function(num) {
      switch (num) {
        case '*':
          return 106;
        case '/':
          return 111;
        case '.':
          return 110;
        default:
          return 96 + num;
      }
    },
    key: function(str) {
      var c = str.charCodeAt(0);
      if (isLower(c)) return c - 32;
      return shifted_symbols[c] || c;
    },
    key_equals: function(key1, key2) {
      return key1.code == key2.code && same_modifiers(key1, key2);
    },
    translate_key_code: function(code) {
      return KEY_MAP[code] || code;
    },
    translate_event: function(e) {
      e = e || window.event;
      var code = e.which || e.keyCode;
      return {
        code: KeyCode.translate_key_code(code),
        shift: e.shiftKey,
        alt: e.altKey,
        ctrl: e.ctrlKey
      };
    },
    key_down: function(e) {
      var key = KeyCode.translate_event(e);
      current_keys.codes[key.code] = key.code;
      update_current_modifiers(key);
    },
    key_up: function(e) {
      var key = KeyCode.translate_event(e);
      delete current_keys.codes[key.code];
      update_current_modifiers(key);
    },
    is_down: function(key) {
      var code = key.code;
      if (code == KeyCode.CTRL) return current_keys.ctrl;
      if (code == KeyCode.ALT) return current_keys.alt;
      if (code == KeyCode.SHIFT) return current_keys.shift;
      return current_keys.codes[code] !== undefined && same_modifiers(key, current_keys);
    },
    hot_key: function(key) {
      var pieces = [];
      for (var i = 0; i < modifiers.length; ++i) {
        var modifier = modifiers[i];
        if (key[modifier] && modifier.toUpperCase() != key_names[key.code]) {
          pieces.push(capitalize(modifier));
        }
      }
      var c = key.code;
      var key_name = key_names[c] || fn_name(c) || num_name(c) || String.fromCharCode(c);
      pieces.push(capitalize(key_name));
      return pieces.join('+');
    }
  };
  for (var code in key_names) {
    KeyCode[key_names[code]] = code;
  }
})();

window.vPause = window.vPause || {};
window.vPause.Shortcut = {
  'all_shortcuts': {
  },
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
    if (ele.addEventListener) ele.addEventListener(opt['type'], func, false); else if (ele.attachEvent) ele.attachEvent('on' + opt['type'], func); else ele['on' + opt['type']] = func;
  },
  'remove': function(shortcut_combination) {
    shortcut_combination = shortcut_combination.toLowerCase();
    var binding = this.all_shortcuts[shortcut_combination];
    delete this.all_shortcuts[shortcut_combination];
    if (!binding) return;
    var type = binding['event'];
    var ele = binding['target'];
    var callback = binding['callback'];
    if (ele.detachEvent) ele.detachEvent('on' + type, callback); else if (ele.removeEventListener) ele.removeEventListener(type, callback, false); else ele['on' + type] = false;
  },
  'KeyCode': window.KeyCode.no_conflict()
};
