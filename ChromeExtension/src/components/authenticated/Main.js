import React from 'react';
import DocumentEditor from './editor/DocumentEditor';
import DocumentList from './main/DocumentList';
import chromePort from '../../helpers/chromePort';

const AuthenticatedSidebar = (props) => {
    let initialDocuments = {
        current: null,
        file: {},
        pluginTutorialList: true,
        pluginTutorialEditor: true
    }

    if (props.state != null) {
        initialDocuments = props.state;
    }

    const documentReducer = (state, action) => {
        switch (action.type) {
            case 'setCurrentDocument':
                let newState;
                if (action.payload) newState = { ...state, current: action.payload };
                else 
                    newState = {
                        ...state,
                        file: {
                            ...state.file,
                            [state.current.documentId]: {
                                title: state.current.title,
                                revisionId: state.current.revisionId,
                                overview: state.current.overview,
                                blackListed: state.current.blackListed
                            }
                        },
                        current: null
                    }
                    
                // Update background script
                chromePort.postMessage({ type: "state", data: newState });
                return newState;
            case 'setState':
                return action.payload;
        }
    }

    const [documents, dispatch] = React.useReducer(documentReducer, initialDocuments);

    if (documents.current) return <DocumentEditor {...props} currDocument = {documents.current} dispatch = {dispatch} />
    return <DocumentList {...props} documents = {documents.file} dispatch = {dispatch} />
}

export default AuthenticatedSidebar;