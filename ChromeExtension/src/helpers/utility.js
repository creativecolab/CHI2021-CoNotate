const observeDOM = (() => {
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    
    return (obj, callback) => {
        if (!obj || obj.nodeType !== 1) return;
    
        if (MutationObserver){
            // define a new observer
            const obs = new MutationObserver((mutations) => callback(mutations));
            obs.observe( obj, { childList:true, subtree:true });
        } else if (window.addEventListener) {
            obj.addEventListener('DOMNodeInserted', callback, false);
            obj.addEventListener('DOMNodeRemoved', callback, false);
        }
    }
})();

export {
    observeDOM
};