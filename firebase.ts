// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqOjRtfHdGNk5P3jjcxQA8QJCqOlGgJPQ",
  authDomain: "wordsteacher-fb214.firebaseapp.com",
  projectId: "wordsteacher-fb214",
  storageBucket: "wordsteacher-fb214.firebasestorage.app",
  messagingSenderId: "564551974208",
  appId: "1:564551974208:web:c5bc31891c296516ae4ea5",
  measurementId: "G-GX2ER9KHM4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
