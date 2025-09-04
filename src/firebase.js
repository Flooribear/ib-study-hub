// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChtrwXrczV7yxhhoR-3kbX0tI-u6T6_2A",
  authDomain: "ib-study-hub-fa610.firebaseapp.com",
  projectId: "ib-study-hub-fa610",
  storageBucket: "ib-study-hub-fa610.firebasestorage.app",
  messagingSenderId: "733206283053",
  appId: "1:733206283053:web:926b2248395d228ae209a4",
  measurementId: "G-Q06XT8N374"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Force auth to use Firebase domain
auth.settings.appVerificationDisabledForTesting = false;

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Connect to emulators in development (comment out in production)
// if (process.env.NODE_ENV === 'development') {
//   connectAuthEmulator(auth, "http://localhost:9099");
//   connectFirestoreEmulator(db, "localhost", 8080);
// }

export { app, analytics, auth, db, storage, googleProvider };
