/*
* vPauseDefaultOptions is declared in default-options.js
* */


addEventListener('DOMContentLoaded', function(){
    // prefsLocation

    var prefsLocation;
    if(window.widget && window.widget.preferences ) {
        prefsLocation = widget.preferences
    } else {
        prefsLocation = window.localStorage
    }

    // glue for multiple values ( checkbox, select-multiple )
    var glue    = '\n';

    // get the FORM elements
    var formElements = document.querySelectorAll( 'input,select' );

    // list of FORM elements
    var skip            = hash( 'hidden,submit,image,reset,button' );
    var multipleValues  = hash( 'checkbox,select-multiple' );
    var checkable       = hash( 'checkbox,radio' );

    // string to hash
    function hash( str, glue ){
        var obj = {};
        var tmp = str.split(glue||',');

        while( tmp.length ) {
            obj[ tmp.pop() ] = true;
        }

        return obj;
    }


    // walk the elements and apply a callback method to them
    function walkElements( callback ){
        var obj = [];
        for( var i=0,element=null; element=formElements[i++]; ){
            // skip the element if it has no name or is of a type with no useful value
            var type = element.type.toLowerCase();
            var name = element.name||'';
            if( skip[type]===true || name=='') continue;

            var tmp = callback( element, name, type );
            if( tmp!=null )
                obj.push( tmp );
        }
        return obj;
    }


    // listener for element changes
    function changedElement( e ){
        var element = e.currentTarget||e;
        var type    = element.type.toLowerCase();
        var name    = element.name||'';

        var value   = multipleValues[type]!==true ? element.value : walkElements(
            function( e, n, t ){
                if( n==name && e.options ){
                    var tmp = [];
                    for( var j=0,option=null; option=e.options[j++]; ){
                        if( option.selected ){
                            tmp.push( option.value );
                        }
                    }
                    return tmp.join( glue );
                }
                else if( n==name && checkable[t]===true && e.checked ){
                    return e.value;
                }
            }
        ).join( glue );

        console.log('change: ', name, value);
        // set value
        prefsLocation.setItem( name, value );
    }


    function setPrefs (defaults) {
        if (!defaults) return ;

        for (var option in defaults) {
            //var el = $(option);
            //console.log('input ' + option, el);
            if (prefsLocation[option] === undefined) {
                prefsLocation[option] = defaults[option];
            }
        }

        // walk and set the elements accordingly to the prefsLocation
        walkElements(
            function( element, name, type ){
                var value       = prefsLocation[name]!==undefined?prefsLocation.getItem( name ):element.value;
                var valueHash   = hash( value, glue );

                if( element.selectedOptions ){
                    // 'select' element
                    for( var j=0,option=null; option=element.options[j++]; ){
                        option.selected = valueHash[option.value]===true;
                    }
                }
                else if( checkable[type]===true ){
                    // 'checkable' element
                    element.checked = valueHash[element.value]===true;
                }
                else {
                    // any other kind of element
                    element.value = value;
                }

                // set the widget.preferences to the value of the element if it was undefined
                // YOU MAY NOT WANT TO DO THIS
                if( prefsLocation[name]==undefined ){
                    changedElement( element );
                }

                // listen to changes
                element.addEventListener( 'input', changedElement, true );
            }
        );
    }

    function $(id) {
        return window.document.getElementById(id);
    }

    function getPref (pref) {
        var val = prefsLocation[pref];
        if (typeof val === 'undefined'){
            val = vPauseDefaultOptions[pref];
        }
        console.log('getPref:'+ pref + ": " + val);
        return val;
    }

    function mes(mes){
   		opera.extension.postMessage(mes);
   	}

    function listenSetHotkeys( ){

        var inputs = window.document.querySelectorAll('input[id ^="hotkey-"]');
        Array.prototype.forEach.call(inputs, function (el){
            el.addEventListener('keydown', function(e) {

                var kc = vPauseShortcut.KeyCode;
                var key = kc.translate_event(e);
                var shcut = kc.hot_key(key);

                if(shcut == 'Tab' || shcut == 'Shift+Tab') return;

                e.preventDefault();
                var pressed = [], val;
                if (key.code != 16 && key.code != 17 && key.code != 18 ) { // not Ctrl, Alt, Shift
                    pressed.push(e);

                    if (shcut === "Delete" || shcut === "Backspace" ) {
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
                var kc = vPauseShortcut.KeyCode;
                var key = kc.translate_event(e);
                var shcut = kc.hot_key(key);
                if(shcut == 'Tab' || shcut == 'Shift+Tab') return;
                e.preventDefault();
            })
        });
    }

    function saveHotkeys(e){
        if (e.target.disabled) return;

        var oldHotkeys = {};
        for(var el in prefsLocation){
            if (el.indexOf('hotkey-') === 0){
                oldHotkeys[el.substring(7)] = prefsLocation[el];
            }
        }
        // Remove old hotkeys
        for (var k in oldHotkeys) {
            window.vPauseShortcut.remove(oldHotkeys[k])
        }
        var inputs = window.document.querySelectorAll('input[id ^="hotkey-"]');
        Array.prototype.forEach.call(inputs, function (el){
            changedElement(el);
        });
        setHotkeys();
        mes({type: 'updatehotkeys', info: oldHotkeys});
        $('save-hotkeys').disabled = true;
    }

    function getHotkeysList(){
        var ks = {};
        for(var el in prefsLocation){
           if (el.indexOf('hotkey-') === 0){
               ks[el.substring(7)] = prefsLocation[el];
           }
        }
        return ks
    }


    function setHotkeys (){
        var keys = getHotkeysList();
        console.log('settingHotkeys', JSON.stringify(keys));
        for ( var key in keys ) {
            if (key && keys[key]) {
                (function(key){
                    // vPauseShortcut is defined in external file
                    window.vPauseShortcut.add(keys[key], function(e) {
                        mes({
                            type: 'hotkey',
                            info:  key
                        });
                        //console.log(key)
                    },{
                        'type': (key == 'hotkey-vup' || key == 'hotkey-vdown') ? 'keypress' : 'keydown',
                        'disable_in_input': true,
                        'propagate': true
                    });
                })(key);
            }
        }
    }

    // set the textContent of an element
    function setText( id, txt ){
        var e = document.getElementById(id);
        if( e ){
            e.textContent = txt;
        }
    }

    function localize() {
        var els = document.querySelectorAll('[data-i18n]');
        var dic = window.locale;

        // Walk through elements
        for (var i in els) {
            var el = els[i];
            if ( !(el instanceof HTMLElement) ) { continue }

            // @data-i18n should be in this format [attrname]stringID;[attrname]stringID
            // If [attrname] is not present innerHTML will be localized
            var propsToLze = el.dataset.i18n.split(';');
            for (var prop in propsToLze) {
                if (!propsToLze.hasOwnProperty(prop)) { continue }

                prop = propsToLze[prop].replace(/\s/g,'');
                if (prop.indexOf('[') === 0){
                    var hash = prop.match(/\[(.*)\](.*)/);
                    var attr = hash[1];
                    var val = '';
                    if (dic[hash[2]]) val = dic[hash[2]];
                    el[attr] = val;
                } else {
                    el.innerHTML = dic[prop] || '';
                    if (!dic[prop]) {
                        console.log('vPause :: No such value in locale '+ locale.locale +': ' + prop )
                    }
                }
            }
        }
    }

    function init() {
        console.log(JSON.stringify(getHotkeysList()));
        setPrefs(vPauseDefaultOptions);
        setHotkeys();
        localize();
        // populate the title, name, author, ...
        setText( 'widget-title', widget.name );
        setText( 'widget-name', widget.name );

        listenSetHotkeys();

        $('save-hotkeys').addEventListener('click', saveHotkeys, false);
        document.body.classList.add('ready');
    }

    init();


}, false);

