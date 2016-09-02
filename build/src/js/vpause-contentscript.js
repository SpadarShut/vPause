(function(window){
    if (window.self !== window.top) return; // ignore iframes

    var port;

    port = chrome.runtime.connect({ name: "vpause-contentscript" });
    port.onMessage.addListener(notifyInjectedScripts);

    window.addEventListener('message', handleInjectedMessages, false);

    injectScript('js/shortcut.js', function(){
        injectScript('js/vpause-injected-hotkeys.js', function(){
            if ((window.location.host === 'vkontakte.ru' || window.location.host === 'vk.com')) {
                injectScript('js/vpause-injected-listeners.js');
            }
        });
    });

    function handleInjectedMessages (e) {
        if ( isValidInjectedMessage(e) ) {
            port.postMessage(e.data);
        }
    }

    function isValidInjectedMessage(e) {
        return e.data && e.data.origin && e.data.origin == 'vpause-injected-listeners' || e.data && e.data.origin && e.data.origin == 'vpause-injected-hotkeys'
    }

    function notifyInjectedScripts(msg){
        window.postMessage(msg, window.location.href );
    }

    function injectScript(script, callback) {
        var s = document.createElement('script');

        s.src = chrome.extension.getURL(script);
        s.onload = function () {
            this.parentNode.removeChild(this);
            callback && callback();
        };

        (document.head || document.documentElement).appendChild(s);
    }
})(window);
