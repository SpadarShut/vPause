/*
* vPauseDefaultOptions is declared in default-options.js
* */

function setPrefs (defaults) {
    if (defaults) {
        for (var option in defaults) {
            var el = $(option);
            console.log(el);
            if (el) {
                el.value = getPref(defaults[option])
            }
        }
    }
}

function $(id) {
    return window.document.getElementById(id);
}

function getPref (pref) {
    var val = widget.preferences[pref];
    if (typeof val === 'undefined'){
        val = vPauseDefaultOptions[pref];
    }
    console.log('getPref:'+ pref + ": " + val);
    return val;
}

function setPref (name, val) {
    widget.preferences[name] = val;
    tellPlayer('settingsChanged');
}

function savePrefs() {

}

function init() {
    setPrefs(vPauseDefaultOptions);
}

init();