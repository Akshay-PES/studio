
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTAroTTAANOi82YaniTJ1QXQLaZPlkcvI",
  authDomain: "academic-calendar-bc5f8.firebaseapp.com",
  projectId: "academic-calendar-bc5f8",
  storageBucket: "academic-calendar-bc5f8.firebasestorage.app", // Corrected from .app to .com as per common Firebase config, but user provided .app
  messagingSenderId: "644503761849",
  appId: "1:644503761849:web:c8e3b6c276bec9a364bc68",
  measurementId: "G-WEQ0MXP7SS"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);

export { app, db };
