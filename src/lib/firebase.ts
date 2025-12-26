
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCps-KXEenwG711fLfnUM6lAV2C6jw7r-c",
  authDomain: "academiasyncjsb-71977203-24f75.firebaseapp.com",
  projectId: "academiasyncjsb-71977203-24f75",
  storageBucket: "academiasyncjsb-71977203-24f75.appspot.com",
  messagingSenderId: "586143134182",
  appId: "1:586143134182:web:27747c2401ded119226627"
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
