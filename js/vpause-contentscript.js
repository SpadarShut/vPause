/*
 *
 * hijacked vk player posts messages
 * This file listens for posted meaasges  catches events
 *
 * inject a_shortcut.js into pages
 * inject hijacking on vk pages
 *
 *
 * */

var port = null;
var reconnect;

function handleBgMessaging(message, sender, callback) { // message, extId? , callback?
    //console.log(arguments);
    console.log('got from bg: ' , arguments);
    if (typeof message === 'string') {
        switch (message) {
            case 'hotkeys':
                updateHotkeys(message);
                break;
            default:
                mesPage({
                    type: message,
                    callback: callback
                })
        }
    } else if (typeof message === 'object') {
        console.log('contentscript :: message is object o_O');

    }
}

function mes(msg, callback) {
    if (port) {
        port.postMessage(msg, callback);
    }
    else {
        chrome.runtime.sendMessage(msg, callback);
    }
}

function mesPage(mes) {
    console.log('contentscript :: mes to injected:', mes);
/*    var evt = document.createEvent("CustomEvent");
    evt.initEvent("vpause-contentscript-message", true, true, mes);
    evt.detail = JSON.stringify(mes); // todo tbd
    document.dispatchEvent(evt);*/
  window.postMessage({origin: 'vpause-contentscript-message', info: mes}, document.location.href);
}


function handlePlayerEvents(e){
  // Listening answers from injected script (vpause-player-hijack.js)
  window.addEventListener('message', function (e) {
    if ( e.data.origin == 'vpause-player-message'){

      if(e.data.info.type !== 'playProgress'){
        console.log('contentscript :: got message from page: ', e.data.info);
      }
      mes(e.data.info);
    }
  }, false);
}


function injectScript(script, callback) {
    // Used to inject scripts into the page so that they have access
    // to all page variables

    var s = document.createElement('script');
    s.src = chrome.extension.getURL(script);
    s.onload = function () {
        this.parentNode.removeChild(this);
        callback && callback();
    };
    (document.head || document.documentElement).appendChild(s);
}

function connectToBg (){
    try {
        clearTimeout(reconnect);
//        console.log('trying to reconnect to BG');
        port = chrome.runtime.connect({name: "vpause"});

        port.onMessage.addListener(function(a,b,c){
            handleBgMessaging(a,b,c)
        });
        console.log('connected to BG');
    }
    catch (e) {
        reconnect = setTimeout(function(){
            console.log('reconnecting to bg');
            connectToBg();
        }, 100)
    }
}

function init() {

    if (window.self !== window.top) return; // ignore iframes

    handlePlayerEvents();
    connectToBg();

    injectScript('js/shortcut.js', function(){
        injectScript('js/vpause-injected-hotkeys.js', function(){
            if ((window.location.host === 'vkontakte.ru' || window.location.host === 'vk.com') && window.self === window.top) {
                injectScript('js/vpause-player-hijack.js');
            }
            mes({type: 'setHotkeys'});
        });
    });
}

init();
