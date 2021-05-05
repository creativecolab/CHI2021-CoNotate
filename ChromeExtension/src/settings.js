const SERVER_API_URL = "http://problem-framing.ucsd.edu";
const CORS_PROXY_URL = "https://fast-savannah-03844.herokuapp.com";
const GOOGLE_DOCS_MACRO = "https://script.google.com/a/macros/ucsd.edu/s/AKfycbxkKW9NgqhGSecGoiCuRf2sZns1aNVC4BJabEhhHHd0ei8qDJ1T/exec";
const GOOGLE_DOCS_API = "https://docs.googleapis.com/v1/documents";
const GOOGLE_AUTOSUGGESTION_API = "http://suggestqueries.google.com/complete/search?output=chrome";
const GOOGLE_DOC_IMAGE_API = "https://lh3.google.com/u/0/d";
const GOOGLE_DOC_LINK = "https://docs.google.com/document/d";
const GOOGLE_DOC_CREATE_NEW_IMAGE = "https://ssl.gstatic.com/docs/templates/thumbnails/docs-blank-googlecolors.png";

const FIREBASE_CREDENTIALS = {
    apiKey: "AIzaSyDoOgy5ns3mufee177U90vTdK8gY6lDIKE",
    authDomain: "search-protolab.firebaseapp.com",
    databaseURL: "https://search-protolab.firebaseio.com",
    projectId: "search-protolab",
    storageBucket: "search-protolab.appspot.com",
    messagingSenderId: "491265602238",
    appId: "1:491265602238:web:34a53c04a5ab8e08bca4ef",
    measurementId: "G-FMBSC9BP3G"
};

const PLUGIN_MODE = "experimental_notes"; // control or experimental_notes
const PLUGIN_TYPE = ["overview", "explore"]; // array with possible elements of overview and explore

export {
    SERVER_API_URL,
    CORS_PROXY_URL,
    GOOGLE_DOCS_MACRO,
    GOOGLE_DOCS_API,
    GOOGLE_AUTOSUGGESTION_API,
    GOOGLE_DOC_IMAGE_API,
    GOOGLE_DOC_LINK,
    GOOGLE_DOC_CREATE_NEW_IMAGE,
    FIREBASE_CREDENTIALS,
    PLUGIN_MODE,
    PLUGIN_TYPE
};