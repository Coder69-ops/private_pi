
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAN4hphJTgXDAwvFep_aKXtAiwfjP0eYQM",
    authDomain: "private-pi.firebaseapp.com",
    projectId: "private-pi",
    storageBucket: "private-pi.firebasestorage.app",
    messagingSenderId: "955599693346",
    appId: "1:955599693346:web:eed8d2cf00757eb1998c7b",
    measurementId: "G-BXWMXC3R6W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
