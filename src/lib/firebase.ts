// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLNI6M4Qr2ASvDSpZjNWx7IPkVQqQHB_8",
  authDomain: "jsb-calender.firebaseapp.com",
  projectId: "jsb-calender",
  storageBucket: "jsb-calender.appspot.com",
  messagingSenderId: "919280262238",
  appId: "1:919280262238:web:a8a55c6c97566f338228cf",
  measurementId: "G-WY3Y85WV7M"
};


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { app, db, auth };
