// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBnap_peuivZqYyQS6LZO0f6TCD7sBzc4s",
  authDomain: "tech-dream-job.firebaseapp.com",
  projectId: "tech-dream-job",
  storageBucket: "tech-dream-job.firebasestorage.app",
  messagingSenderId: "625356762055",
  appId: "1:625356762055:web:49b9ec9957535d277d07e2",
  measurementId: "G-K6G1S0H4MK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);