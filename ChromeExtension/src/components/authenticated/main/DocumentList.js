import React from 'react';
import googleAPI from '../../../helpers/googleAPIContent';
import { GOOGLE_DOC_CREATE_NEW_IMAGE, GOOGLE_DOC_IMAGE_API } from './../../../settings';

const DocumentList = (props) => {
    const documentArray = Object.entries(props.documents);
    const setCurrentDocument = (payload) => props.dispatch({ type: 'setCurrentDocument', payload });

    const createGoogleDoc = async () => {
        const responseCreation = await googleAPI.createGoogleDoc();
        setCurrentDocument({
            documentId: responseCreation.documentId,
            title: responseCreation.title,
            overview: [],
            blackListed: []
        });
    }

    return (
        <div id = "content-body" class = "grid padded">
            <div id ="create" class = "content-body-grid-item" onClick = {createGoogleDoc}>
                <div class = "content-body-grid-item-thumbnail" style = {{
                    backgroundImage: `url(${GOOGLE_DOC_CREATE_NEW_IMAGE})`
                }} />
            </div>
            {documentArray.map(([key, value]) => (
                <div class = "content-body-grid-item" onClick = {() => setCurrentDocument({documentId: key, ...props.documents[key]})}>
                    <div class = "content-body-grid-item-thumbnail" style = {{ backgroundImage: `url(${GOOGLE_DOC_IMAGE_API}/${key})` }} />
                    <div class = "content-body-grid-item-title">{value.title}</div>
                </div>
            ))}
        </div>
    )
}

export default DocumentList;