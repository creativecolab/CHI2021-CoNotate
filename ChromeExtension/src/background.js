/* eslint-disable no-undef */
import nlpAPI from "./helpers/nlpAPI";
import firebase from "./helpers/firebase";
import googleAPI from './helpers/googleAPIBackground';
import { PLUGIN_MODE, PLUGIN_TYPE } from './settings';

// Immediate invokation since we want top-level async
(async () => {
    let mainWindow = await new Promise((success) => chrome.windows.getCurrent({}, success));

    // Break out of it is a popout window to prevent infinite loop
    if (mainWindow.type !== "normal") return;

    let maxWindowWidth, pluginWindow;
    // Functions to resize our windows
    const resizePlugin = (pluginWidth) => 
        new Promise((success) => chrome.windows.update(pluginWindow.id, {
            width: pluginWidth,
            left: maxWindowWidth - pluginWidth,
            height: mainWindow.height,
            state: "normal"
        }, success));

    const resizeMain = (mainWidth) => 
        new Promise((success) => chrome.windows.update(mainWindow.id, {
            width: mainWidth,
            state: "normal"
        }, success));

    // We do not want to delay the background script as we already have the necessary data to start running
    (async () => {
        // Since we do not have a native way to get the screen size, we will assume that the current window size is full screen
        maxWindowWidth = mainWindow.width;

        // Create the plugin window
        pluginWindow = await new Promise((success) => chrome.windows.create({ url: "index.html", type: "popup" }, success));

        // Make each of the windows half the screen
        pluginWindow = await resizePlugin(parseInt(maxWindowWidth / 2));

        // The + 22 is for some weird gap discrepancy that chrome has *perhaps it is the scroll wheel
        mainWindow = await resizeMain(parseInt(maxWindowWidth / 2) + 22);

        // Start the listeners to make the windows resizable
        // The async blocks the listener during its processing, but it should be fine in this case
        let shouldUpdate = true;
        chrome.windows.onBoundsChanged.addListener(async (focusedWindow) => {
            if (shouldUpdate = !shouldUpdate) return;

            // The + 22 is for some weird gap discrepancy that chrome has *perhaps it is the scroll wheel
            if (focusedWindow.id === mainWindow.id) {
                mainWindow = focusedWindow;
                await resizePlugin(maxWindowWidth - mainWindow.width + 22);
            } else {
                pluginWindow = focusedWindow;
                await resizeMain(maxWindowWidth - pluginWindow.width + 22);
            }
        });
    })();
    
    // Start the processing part of the background script
    let suggestionsCache = [], scrapeSerp = '', autoComplete = ['', []], notesSerp = '', toggleOpen = true, lastUpdated = 0;

    let state = {
        PLUGIN_MODE,
        PLUGIN_TYPE,
        chromeIdentity: null,
        current: null,
        file: {},
        history: [],
    };

    // JS Proxy validator to filter out irrelevant information out of our logs
    // For now filters out a weird edge case that happens but we can pre-process data later
    let stateHistoryProxy;
    const validator =  {
        set: function(target, property, value) {
            if (value && value.url && value.url.includes("chrome-extension://")) return false;
            target[property] = value;
            
            return true;
        }
    }

    // Load previous state in case extension is reloaded
    chrome.storage.local.get(['state'], (data) => {
        if (Object.keys(data).length !== 0) state = data.state;

        // Set up our validator
        stateHistoryProxy = new Proxy(state.history, validator);
    });

    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Communication between the background scripts and injected content scripts
    chrome.runtime.onConnect.addListener(
        (port) => {
            // Post data to the main window (suggestion bar)
            const postData = (type, data = null) => {
                chrome.tabs.getAllInWindow(
                    mainWindow.id,
                    async (tabs) => {
                        for (let j = tabs.length - 1; j >= 0; --j) {
                            chrome.tabs.sendMessage(tabs[j].id, {
                                type,
                                data
                            }, { frameId: 0 });
                        }
                    }
                );
            };

            const processIdentity = (token) => {
                if (chrome.runtime.lastError) {
                    state.chromeIdentity = null;
                    return;
                }

                if (!state.chromeIdentity)
                    port.postMessage({
                        type: "authentication"
                    });
                
                state.chromeIdentity = token;
            };

            const processExperimentalChange = async () => {
                const responseObj = {};
                if (scrapeSerp.length > 0 && notesSerp.length > 0) {
                    let response, suggestions = [];
                    try {
                        response = await nlpAPI.generateSuggestions_retry(autoComplete[0], autoComplete[1].join(", "), notesSerp, scrapeSerp, 3);
                    } catch (e) {
                        throw Error;
                    }

                    const keys = Object.keys(response);
                    for (let j = keys.length - 1; j >= 0; --j) {
                        if (PLUGIN_TYPE.includes(keys[j])) {
                            const entity = response[keys[j]];
                            suggestions = [...suggestions, ...entity];
                            responseObj[keys[j]] = entity;
                        }
                    }

                    suggestions = shuffle(suggestions).map((suggestion) => `${autoComplete[0]} ${suggestion}`);
                    suggestionsCache = suggestions;
                }

                postData(
                    "processDoc",
                    suggestionsCache
                );

                return responseObj;
            };

            port.onMessage.addListener(async (msg) => {
                switch(msg.type) {
                    case 'connection': {
                        // Send whatever information each type of frame / window needs
                        if (port.sender.frameId !== 0) {
                            if (port.sender.url.includes('https://docs.google.com/document/d/') && port.sender.url.includes('edit')) {
                                const { chromeIdentity, current } = state;
                                
                                port.postMessage({
                                    type: "connection",
                                    data: {
                                        frame: "dociframe",
                                        chromeIdentity: chromeIdentity,
                                        documentId: current.documentId
                                    }
                                });
                            } else
                                port.postMessage({
                                    type: "connection"
                                });
                        } else {
                            chrome.identity.getAuthToken({ interactive: false }, processIdentity);
                            const {
                                current,
                                file,
                                chromeIdentity
                            } = state;
                            
                            port.postMessage({ 
                                type: "connection",
                                data: {
                                    frame: "parent",
                                    state: {
                                        current,
                                        file,
                                        chromeIdentity,
                                        isMain: port.sender.tab.windowId === mainWindow.id,
                                        toggleOpen,
                                        PLUGIN_MODE,
                                        PLUGIN_TYPE
                                    }
                                }
                            });

                            // If is a google search update our autoComplete and suggestions accordingly
                            if (msg.data.url.includes("https://www.google.com/search")) {
                                // Set our scraped serp
                                scrapeSerp = msg.data.scrapeSerp.replace(/[^\w\s]/gi, '');

                                // Get autocomplete suggestions
                                const queryStart = (msg.data.url.indexOf("&q=") === -1 ? msg.data.url.indexOf("?q=") : msg.data.url.indexOf("&q=")) + 3;
                                const queryEnd = msg.data.url.indexOf('&', queryStart) === -1 ? msg.data.url.length : msg.data.url.indexOf('&', queryStart);

                                // Set query first in case of failed fetches
                                autoComplete = [msg.data.url.substring(queryStart, queryEnd).replace(/[+\s]/gi, ' ').trim()];

                                try {
                                    const response = await googleAPI.autoComplete_retry(msg.data.url.substring(queryStart, queryEnd), 5);

                                    let tempArr = [];
                                    for (let reponseSuggestions = response[1], i = 0, j = reponseSuggestions.length; i < j; i++) {
                                        const trimmedResponseSuggestions = reponseSuggestions[i].trim();
                                        if (trimmedResponseSuggestions !== autoComplete[0])
                                            tempArr.push(trimmedResponseSuggestions.replace(/<[^>]*>/g, ''))
                                    }

                                    autoComplete[1] = tempArr;
                                } catch(e) { }

                                switch(PLUGIN_MODE) {
                                    case 'control':
                                        suggestionsCache = autoComplete[1].slice(0, 6);

                                        postData(
                                            "processDoc",
                                            suggestionsCache
                                        );

                                        // Logging
                                        stateHistoryProxy.push({
                                            type: 'searchChange',
                                            url: msg.data.url,
                                            timeStamp: msg.data.timeStamp,
                                            autoComplete,
                                            suggestions: suggestionsCache,
                                            peopleAlsoAsk: msg.data.peopleAlsoAsk,
                                            relatedSearches: msg.data.relatedSearches,
                                            peopleAlsoSearch: msg.data.peopleAlsoSearch
                                        });
                                        break;
                                    case 'experimental_notes':
                                        try {
                                            let responseObj = await processExperimentalChange();

                                            // Logging
                                            stateHistoryProxy.push({
                                                type: 'searchChange',
                                                url: msg.data.url,
                                                timeStamp: msg.data.timeStamp,
                                                autoComplete,
                                                suggestions: suggestionsCache, 
                                                ...responseObj,
                                                peopleAlsoAsk: msg.data.peopleAlsoAsk,
                                                relatedSearches: msg.data.relatedSearches,
                                                peopleAlsoSearch: msg.data.peopleAlsoSearch
                                            });
                                        } catch(e) {
                                            console.log("NLP API failure")
                                        }
                                        break;
                                }                     
                            } else {
                                postData(
                                    "processDoc",
                                    suggestionsCache
                                );

                                stateHistoryProxy.push({
                                    type: 'websiteChange',
                                    url: msg.data.url,
                                    timeStamp: msg.data.timeStamp,
                                    autoComplete,
                                    suggestions: suggestionsCache
                                });
                            }         

                            chrome.storage.local.set({ 'state': state });
                        }
                        break;
                    }
                    case 'authentication': {
                        chrome.identity.getAuthToken({
                            interactive: true
                        }, processIdentity);
                        break;
                    }
                    case 'state': {
                        if (msg.data) {
                            const data = { ...msg.data }
                            state = {
                                ...state,
                                ...data
                            };
                        }
                        chrome.storage.local.set({ 'state': state });
                        break;
                    }
                    case 'firebase': {
                        const stateText = JSON.stringify(state);
                        const hiddenElement = document.createElement('a');
                        hiddenElement.href = `data:text;charset=utf-8,${stateText}`;
                        hiddenElement.target = '_blank';
                        hiddenElement.download = `studylogs-${Date.now()}`;
                        hiddenElement.click();

                        const firebaseRef = firebase.database().ref().child('userData').push();

                        for (let i = 1; i <= 3; i++) {
                            try {
                                await firebaseRef.set({ ...state });
                            } catch(e) {
                                if (i === 3) console.log("firebase not working");
                            }
                        }
                        break;
                    }
                    case 'processDoc': {
                        const currTime = Date.now();
                        const timeDifference = currTime - lastUpdated;
                        lastUpdated = currTime;
                        notesSerp = msg.data.document.replace(/[^\w\s]/gi, '');
                        if (timeDifference < 5000) break;

                        switch(PLUGIN_MODE) {
                            case 'experimental_notes': {
                                try {
                                    let responseObj = await processExperimentalChange();

                                    // Logging
                                    stateHistoryProxy.push({
                                        type: 'noteChange',
                                        timeStamp: msg.data.timeStamp,
                                        suggestions: suggestionsCache,
                                        scrapeSerp,
                                        notesSerp,
                                        ...responseObj,
                                    });
                                } catch(e) {
                                    console.log("NLP API failure")
                                }
                                break;
                            }
                            case 'control':
                                // Logging
                                stateHistoryProxy.push({
                                    type: 'noteChange',
                                    timeStamp: msg.data.timeStamp,
                                    suggestions: suggestionsCache,
                                    scrapeSerp,
                                    notesSerp
                                });
                                break;
                        }
                        break;
                    }
                    case 'toggleResize':
                        toggleOpen = !toggleOpen;
                        if (toggleOpen) {
                            mainWindow = await resizeMain(parseInt(maxWindowWidth / 2));
                        } else {
                            mainWindow = await resizeMain(parseInt(9 * maxWindowWidth / 10));
                        }
                        break;
                    case 'updatePeopleAlsoAsk': {
                        // Logging
                        // Loop backwards since it is more likely to be closer to the recent events
                        for (let j = state.history.length - 1; j > 0; --j) {
                            if (state.history[j].timeStamp === msg.data.timeStamp) {
                                state.history[j].peopleAlsoAsk = msg.data.peopleAlsoAsk;
                                break;
                            }
                        }
                        break;
                    }
                }
            });
        }
    );
})();

// Prevent autosuggestions from appearing
const processNetworkTraffic = (request) => {
    chrome.tabs.executeScript(request.tabId, {
        code : `
        observeDOM = (() => {
            const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
            
            return (obj, callback) => {
                if (!obj || obj.nodeType !== 1) return;
            
                if (MutationObserver){
                    // define a new observer
                    const obs = new MutationObserver((mutations) => callback(mutations));
                    obs.observe( obj, { attributes : true, attributeFilter : ['style'] });
                }
            }
        })();

        observeDOM(document.getElementsByClassName("UUbT9")[0], () => {
            if (document.getElementsByClassName("A8SBwf")[0].classList.contains("emcav")) {
                document.getElementsByClassName("A8SBwf")[0].classList.remove("emcav");
            }
            document.getElementsByClassName("UUbT9")[0].style.display = 'none';
        });
        `
    })
}

// Block autocomplete suggestions
chrome.webRequest.onBeforeRequest.addListener(
    (request) => {
        processNetworkTraffic(request);
        return { cancel: true };
    },
    {
        urls: [
            "*://www.google.com/complete/search*",
            "*://www.bing.com/AS/Suggestions*"
        ]
    },
    ["blocking"]
);

// Remove Iframe headers for google docs
chrome.webRequest.onHeadersReceived.addListener(
    (request) => {
        const headers = request.responseHeaders;
        for (let i = headers.length-1; i>=0; --i) {
            let header = headers[i].name.toLowerCase();
            if (header === 'x-frame-options' || header === 'frame-options') headers.splice(i, 1);
        }
        return { responseHeaders: headers };
    },
    {
        urls: [ '*://*/*' ],
        types: [ 'sub_frame', 'main_frame' ]
    },
    ['blocking', 'responseHeaders']
);