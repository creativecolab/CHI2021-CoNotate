// This is the sidebar component code
import React from 'react';
import ReactDOM from 'react-dom';
import AuthenticatedSidebar from './components/authenticated/Main';
import UnAuthenticatedSidebar from './components/unAuthenticated/Main';
import chromePort from './helpers/chromePort';
import googleAPI from './helpers/googleAPIContent';

// Connect to the background script and start the plugin
// After getting the data from the connection close the listener
chromePort.onMessage.addListener(
    function handleConnection(msg) {
        if (msg.type === "connection" && msg.data.frame === "parent") {
            if (msg.data.state && msg.data.state.chromeIdentity) {
                googleAPI.setToken(msg.data.state.chromeIdentity);
                ReactDOM.render(
                    <AuthenticatedSidebar state={msg.data.state} />,
                    document.getElementById('root')
                )
            } else
                ReactDOM.render(
                    <UnAuthenticatedSidebar />,
                    document.getElementById('root')
                )
            
            // Make sure we stop listening once we recieve the connection
            chromePort.onMessage.removeListener(handleConnection);
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
