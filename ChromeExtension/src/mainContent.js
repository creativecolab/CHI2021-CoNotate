/* global chrome */
/* eslint-disable no-undef */

import chromePort from './helpers/chromePort';
import { observeDOM } from './helpers/utility';
import '@webcomponents/custom-elements';
import mainContent from './mainContent.html';

// Preperation for our scroll events
let stopScroll = false;

// Create our plugin template from an import
const suggestionContainerTemplate = document.createElement('template');
suggestionContainerTemplate.innerHTML = mainContent;

// Define the script for our template
window.customElements.define(
    'suggestion-container',
    class SuggestionContainer extends HTMLElement {
        constructor() {
            super();
            
            this.next = this.next.bind(this);
            this.previous = this.previous.bind(this);
            this.suggestionsWidth = 0;

            // Use our suggestion template
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(suggestionContainerTemplate.content.cloneNode(true));

            this.nextBtn = this.shadowRoot.querySelector('[next]');
            this.previousBtn = this.shadowRoot.querySelector('[previous]');
            this.container = this.shadowRoot.querySelector('div');
        }

        next(value) {
            if (value < 0) return;
            
            // The 120 is to account for the two arrow signs
            if (typeof value === 'object') value = this.clientWidth - 120;

            const widthDifference = -1 * (this.suggestionsWidth - this.clientWidth + 8);
            if (widthDifference > 0) return;

            let newLeft;
            this.container.style.left = `
                ${widthDifference > (newLeft = parseFloat(this.container.style.left) - parseFloat(value))
                    ? widthDifference
                    : newLeft}px
            `;
            this.checkBtn();
        }

        previous(value) {
            if (value < 0) return;

            // The 120 is to account for the two arrow signs
            if (typeof value === 'object') value = this.clientWidth - 120;
            
            let newLeft;
            this.container.style.left = `
                ${(newLeft = parseFloat(this.container.style.left) + parseFloat(value)) > 0 
                ? 0 
                : newLeft}px
            `;
            this.checkBtn();
        }

        checkBtn() {
            const containerShiftLeft = -1 * parseFloat(this.container.style.left);

            // We don't need to check for positive or negative as our previous and next functions already handle that
            if (containerShiftLeft === 0) this.previousBtn.hidden = true;
            else this.previousBtn.hidden = false;

            // The +8 is to account for the margin on the last one we added (kinda weird but more effective)
            if (this.suggestionsWidth - containerShiftLeft >= this.clientWidth) this.nextBtn.hidden = false;
            else this.nextBtn.hidden = true;
        }

        createDOMNode(text, cssClass, onClick = null) {
            const element = document.createElement("div");
            for (let i = 0; i < cssClass.length; i++) {
                element.classList.add(cssClass[i]);
            }

            if (onClick) element.onclick = onClick;
            const elementText = document.createTextNode(text);
            element.append(elementText);
            this.container.append(element);

            return element;
        }

        connectedCallback() {
            this.nextBtn.addEventListener('click', this.next);
            this.previousBtn.addEventListener('click', this.previous);

            this.clientWidth = document.documentElement.clientWidth;

            chrome.runtime.onMessage.addListener((msg) => {
                if (msg.type === "processDoc") {
                    // Reset the width of the suggestions
                    let totalSuggestionWidth = 0;
                    console.log(msg);

                    // Clear the previous suggestions if they are there
                    while (this.container.firstChild) {
                        this.container.removeChild(this.container.lastChild);
                    }
                    if (msg.data.suggestionsCache.length === 0 || (msg.data.suggestionsCache.length < this.length && this.emptyMessage !== "There are no valid suggestions")) {
                        this.createDOMNode(this.emptyMessage, ["extension-text"]);
                    } else {
                        const queryStart = msg.data.autoComplete.join('');
                        for (let i = 0; i < msg.data.autoComplete.length - 1; i++) {
                            const filteredData = msg.data.autoComplete[i];
                            totalSuggestionWidth += (this.createDOMNode(
                                filteredData,
                                ["extension-suggestion"], 
                                () => { window.location.href = `https://www.google.com/search?q=${filteredData}` }
                                // The 8 is the margin width
                            )).offsetWidth + 8;
                        }

                        const breaker = msg.data.autoComplete[msg.data.autoComplete.length - 1];
                        totalSuggestionWidth += (this.createDOMNode(
                            breaker,
                            ["extension-suggestion", "breaker"], 
                            () => { window.location.href = `https://www.google.com/search?q=${breaker}` }
                            // The 24 is the margin width for the breaker
                        )).offsetWidth + 24;

                        for (let j = msg.data.suggestionsCache.length - 1; j >= 0; --j) {
                            const filteredData = msg.data.suggestionsCache[j].replaceAll('%20', ' ');
                            totalSuggestionWidth += (this.createDOMNode(
                                filteredData,
                                ["extension-suggestion"], 
                                () => { window.location.href = `https://www.google.com/search?q=${queryStart} ${filteredData}` }
                                // The 8 is the margin width
                            )).offsetWidth + 8;
                        }
                        this.suggestionsWidth = totalSuggestionWidth;
                    }

                    // Prep the suggestion container
                    this.checkBtn();
                }
            });

            // Prevent default scrolling behavior when hovered over the top menu
            this.scrollEvent = (e) => {
                if (stopScroll) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.wheelDeltaY < 0) this.next(100);
                    else this.previous(100);
                }
            };

            this.resizeEvent = () => {
                const previousClientWidth = this.clientWidth;
                this.clientWidth = document.documentElement.clientWidth;

                // While this may seem weird, we call the call the previous function to make sure we adapt to the range
                if (parseFloat(this.container.style.left) !== 0) this.previous(this.clientWidth - previousClientWidth);
                this.checkBtn();
            };

            window.addEventListener("resize", this.resizeEvent);
            window.addEventListener('wheel', this.scrollEvent, { passive: false });
        }

        disconnectedCallback() {
            this.nextBtn.removeEventListener('click', this.next);
            this.previousBtn.removeEventListener('click', this.previous);
            window.removeEventListener("resize", this.resizeEvent);
            window.removeEventListener('wheel', this.scrollEvent, { passive: false });
        }

        get emptyMessage() {
            return this.getAttribute('emptyMessage');
        }

        set emptyMessage(value) {
            this.setAttribute('emptyMessage', value);
        }

        get clientWidth() {
            return this.getAttribute('clientWidth');
        }

        set clientWidth(value) {
            this.setAttribute('clientWidth', value);
        }

        get length() {
            return this.getAttribute('length');
        }

        set length(value) {
            this.setAttribute('length', value);
        }

        static get observedAttributes() {
            return ['clientWidth', 'emptyMessage', 'length'];
        }
    }
);

// Immediate invokation since we want top-level async
(async () => {
    // Containers we want to scrape (and maybe delete)
    const peopleAskContainer = document.getElementsByClassName("JolIg mfMhoc")[0] ? document.getElementsByClassName("JolIg mfMhoc")[0].parentNode : null;
    const peopleSearchContainer = document.getElementsByClassName("lgJJud")[0];
    const searchRelatedContainer = document.getElementsByClassName("A07Bwc")[0];
    const queries = document.getElementsByClassName("g").length > 0 ? document.getElementsByClassName("g") : null;

    // Connect to the background script
    let [pluginMode, pluginLength, pluginToggleState] = await (new Promise((success) => {
        // Start the listener for the background script before we scrape the divs and connect
        // After getting the data from the connection close the listener
        chromePort.onMessage.addListener(
            function handleConnection(msg) {
                if (msg.type === "connection" && msg.data.frame === "parent" && msg.data.state.isMain) {
                    // Remove google additional information if experimental
                    if (msg.data.state.PLUGIN_MODE === "experimental_notes") {
                        const removeDivs = (divs) => {
                            for (let j = divs.length - 1; j >= 0; --j) {
                                if (divs[j]) divs[j].parentNode.removeChild(divs[j]);
                            }
                        }

                        removeDivs([peopleAskContainer, peopleSearchContainer, searchRelatedContainer]);
                    }

                    // Make sure we stop listening once we recieve the connection
                    chromePort.onMessage.removeListener(handleConnection);

                    // Return our data
                    success([msg.data.state.PLUGIN_MODE, msg.data.state.PLUGIN_TYPE.length * 3, msg.data.state.toggleOpen]);
                    return;
                }
            }
        );
        
        // Functions to help us scrape the divs
        const checkContainer = (container, children, callback) => {
            container.forEach(
                container => children.forEach(
                    child => 
                        [container.getElementsByClassName(child)].forEach(
                            child => 
                                [...child].forEach(
                                    child => callback(child)
                                )
                        )
                )
            );
        }

        const timeStamp = Date.now();
        const scrapeDivs = (divs) => {
            const scrapeObj = {};
            const keys = Object.keys(divs);
            for (let j = keys.length - 1; j >= 0; --j) {
                let [container, children, watch] = divs[keys[j]];

                if (container) {
                    if (container.length) container = [...container];
                    else container = [container];

                    if (watch) {
                        const textArr = [];
                        checkContainer(container, children, (ele) => textArr.push({ text: ele.innerText, open: false }));
                        scrapeObj[keys[j]] = textArr;
                        
                        // Listener for when the div changes
                        // We can prevent sending a bunch of data with a debouncer and this data is not urgent
                        let timer = null, cancelTimer = null;
                        container.forEach(subContainer => observeDOM(subContainer, () => {
                            if (cancelTimer) cancelTimer();
                            timer = setTimeout(() => {
                                const textArr = [];
                                checkContainer(container, children, (ele) => {
                                    const text = ele.innerText;
                                    textArr.push({
                                        text,
                                        open: text.indexOf("\n") !== -1 ? true : false
                                    })
                                });
            
                                chromePort.postMessage({
                                    type: "updatePeopleAlsoAsk",
                                    data: {
                                        timeStamp: timeStamp,
                                        peopleAlsoAsk: textArr
                                    }
                                });
                            }, 500);
                            cancelTimer = () => clearTimeout(timer);
                        }));
                    } else {
                        const textArr = [];
                        checkContainer(container, children, (ele) => textArr.push(ele.innerText));
                        scrapeObj[keys[j]] = textArr;
                    }
                } else 
                    scrapeObj[keys[j]] = []
            }

            return scrapeObj;
        }

        // Scrape the divs to send to the background script
        let scrapeObj;
        if (document.location.href.includes('https://www.google.com/search')) {
            scrapeObj = scrapeDivs({
                scrapeSerp: [queries, ["LC20lb", "st"], false],
                peopleAlsoAsk: [peopleAskContainer, ["related-question-pair"], true],
                peopleAlsoSearch: [peopleSearchContainer, ["f3LoEf", "iKt1P"], false],
                relatedSearches: [searchRelatedContainer, ["s75CSd"], false]
            });

            scrapeObj['scrapeSerp'] = scrapeObj['scrapeSerp'].filter(x => x !== '').join();
        }

        // Connect to the background script
        chromePort.postMessage({
            type: "connection",
            data: {
                url: document.location.href,
                timeStamp,
                ...scrapeObj
            }
        });
    }));

    // Post connection code
    // Create the plugin topbar
    const pluginHeader = document.createElement("suggestion-container");
    pluginHeader.id = "extension-header";
    pluginHeader.emptyMessage = pluginMode === "experimental_notes" ? "Please add to your notes to get more suggestions" : "There are no valid suggestions";
    pluginHeader.length = pluginLength;
    pluginHeader.onmouseover = () => { stopScroll = true };
    pluginHeader.onmouseout = () => { stopScroll = false };
    document.getElementsByTagName('html')[0].append(pluginHeader);
    document.getElementsByTagName('body')[0].style.transform = "translateY(40px)";
    
    // Create the toggle button
    const pluginToggle = document.createElement("div");
    pluginToggle.id = "extension-toggle";
    pluginToggle.onclick = () => {
        pluginToggleState = !pluginToggleState;
        pluginToggle.innerHTML = `${pluginToggleState ? '>' : '<'}`
        chromePort.postMessage({
            type: "toggleResize"
        });
    };
    pluginToggle.innerHTML = `${pluginToggleState ? '>' : '<'}`
    document.getElementsByTagName('html')[0].append(pluginToggle);
})();