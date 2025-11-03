// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVkmS7S9QRzHwQGC3hSrlzA8_ndVNoOoI",
  authDomain: "personal-13238.firebaseapp.com",
  projectId: "personal-13238",
  storageBucket: "personal-13238.firebasestorage.app",
  messagingSenderId: "297412037077",
  appId: "1:297412037077:web:49d934d523c0ae54d8d55c",
  measurementId: "G-EXXTJJFW8T"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// const analytics = getAnalytics(app);