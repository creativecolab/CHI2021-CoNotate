import React from 'react';
import chromePort from '../../../helpers/chromePort';
import { GOOGLE_DOC_LINK } from './../../../settings';

const DocumentEditor = (props) => {
    const setCurrentDocument = (payload) => props.dispatch({ type: 'setCurrentDocument', payload });
    
    return (
        <div id = "content-body" class = "editor padded">
            <div id = "content-body-nav">
                <div onClick={() => setCurrentDocument(null)}>&#9001; Go Back</div>
                <button id = "content-body-nav-end" onClick={() => {
                    chromePort.postMessage({ type: "firebase" });
                    alert('Thank you for participating, you may now uninstall the chrome extension');
                }}>End Study</button>
            </div>
            <iframe id = "content-body-editor" src={`${GOOGLE_DOC_LINK}/${props.currDocument.documentId}/edit`} frameBorder="0" />
        </div>
    )
}

export default DocumentEditor;