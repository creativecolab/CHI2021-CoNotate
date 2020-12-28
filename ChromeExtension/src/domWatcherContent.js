import chromePort from './helpers/chromePort';
import googleAPI from './helpers/googleAPIContent';
import { observeDOM } from './helpers/utility';

// We want this blocked top level async behavior
(async () => {
    // Connect to the background script and get the documentId and chromeIdentity
    const documentId = await (new Promise((success) => {
        // After getting the data from the connection close the listener
        chromePort.onMessage.addListener(
            function handleConnection(msg) {
                if (msg.type === "connection" && msg.data.frame === "dociframe") {
                    googleAPI.setToken(msg.data.chromeIdentity);
                    chromePort.onMessage.removeListener(handleConnection);

                    success(msg.data.documentId);
                    return;
                }
            }
        );
        
        // Connect to the background script
        chromePort.postMessage({
            type: "connection",
            data: {
                url: document.location.href,
                timeStamp: Date.now()
            }
        });
    }));

    // Post connection code
    const updateGoogleDocContent = async () => 
        chromePort.postMessage({
            type: "processDoc",
            data: {
                document: await googleAPI.executeAppScript(documentId),
                timeStamp: Date.now()
            }
        });

    const updateGoogleDocTitle = () => 
        chromePort.postMessage({
            type: "state",
            data: {
                current: {
                    documentId: documentId,
                    title: document.getElementById("docs-title-input-label-inner").textContent
                }
            }
        });

    // Send the intial document and title in case it has been updated outside the app
    updateGoogleDocContent();
    updateGoogleDocTitle();

    let timer = null;
    let cancelTimer = null;

    // Debounce function for updating suggestions
    const typeDebouncer = () => {
        if (cancelTimer) cancelTimer();
        timer = setTimeout(updateGoogleDocContent, 5000);
        cancelTimer = () => clearTimeout(timer);
    }

    // Observe the document for updates
    observeDOM(document.getElementById("docs-editor"), typeDebouncer);

    // Observe the title for updates
    observeDOM(document.getElementById("docs-title-input-label-inner"), updateGoogleDocTitle);

    // Choose the Fit option and toggle off the header by default
    // Simulate a user click
    const click = (element) => {
        const simulateMouseEvent = (element, eventName, coordX, coordY) =>
            element.dispatchEvent(new MouseEvent(eventName,
                { view: window, bubbles: true, cancelable: true, clientX: coordX, clientY: coordY, button: 0 }
            ));

        const elementBounds = element.getBoundingClientRect();
        const coordX = elementBounds.left + (elementBounds.right - elementBounds.left) / 2;
        const coordY = elementBounds.top + (elementBounds.bottom - elementBounds.top) / 2;
    
        simulateMouseEvent(element, "mousedown", coordX, coordY);
        simulateMouseEvent(element, "mouseup", coordX, coordY);
        simulateMouseEvent(element, "click", coordX, coordY);
    }
    
    const filterHtmlCollection = (collection, filter) => {
        let tempArr = [];
        for (let i = 0, j = collection.length; i < j; i++) {
            if (filter(collection[i])) tempArr.push(collection[i]);
        }
        return tempArr;
    }

    // Simulate a user click then confirms it was clicked
    const executeCommand = (clickElement, checkElement, checkFunction, callback) => {
        if (!clickElement) return;
        click(clickElement);

        if (checkElement && checkFunction(checkElement)) callback();
    };

    // This is probably not an ideal way to do it, but I can't find another way to compact this
    // Toggle open the zoom menu
    await (new Promise(async (success) => {
        // Temporary variable is to make 
        let temp, loadInterval = setInterval(
            () => executeCommand(
                document.getElementById("zoomSelect"),
                (temp = filterHtmlCollection(
                    document.getElementsByClassName("goog-menu goog-menu-vertical goog-menu-noicon goog-menu-noaccel"),
                    (ele) => ele.getAttribute("role") === "listbox")
                ).length >= 1 ? temp[0] : null,
                (ele) => ele && ele.style.display !== "none",
                () => { success(); clearInterval(loadInterval); }
            ), 100
        );
    }));

    // Select the fit option
    await (new Promise(async (success) => {
        let temp, loadInterval = setInterval(
            () => executeCommand(
                (temp = filterHtmlCollection(
                    document.getElementsByClassName("goog-menu goog-menu-vertical goog-menu-noicon goog-menu-noaccel"),
                    (ele) => ele.getAttribute("role") === "listbox")
                ).length >= 1 ? temp[0].children[0] : null,
                temp[0],
                (ele) => ele && ele.style.display === "none",
                () => { success(); clearInterval(loadInterval); }
            ), 100
        );
    }));

    // Toggle off the header
    await (new Promise(async (success) => {
        if (document.getElementById("docs-header").style.display !== "none") success();
        let loadInterval = setInterval(
            () => executeCommand(
                document.getElementById("viewModeButton"),
                document.getElementById("docs-header"),
                (ele) => ele && ele.style.display !== "none",
                () => { success(); clearInterval(loadInterval); }
            ), 100
        );
    }));
})();