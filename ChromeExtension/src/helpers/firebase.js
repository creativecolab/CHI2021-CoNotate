import firebase from "firebase/app";
import { FIREBASE_CREDENTIALS } from '../settings';
import "firebase/database";
import "firebase/auth";
import "firebase/firestore";

firebase.initializeApp(FIREBASE_CREDENTIALS);

firebase.firestore();

export default firebase;