import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDKqAVxNbdtPqyHsDvAzt3M-_iOjvzHeEU",
  authDomain: "djaje-322d1.firebaseapp.com",
  projectId: "djaje-322d1",
  storageBucket: "djaje-322d1.firebasestorage.app",
  messagingSenderId: "999993300637",
  appId: "1:999993300637:web:ff2397e68ce56670b06674",
  measurementId: "G-KBLW6LTV29"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
