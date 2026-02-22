import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyD6eqVG1zgY4l4u7anW1xVhbfUUMO2WYBg",
    authDomain: "gx-store-43cc0.firebaseapp.com",
    projectId: "gx-store-43cc0",
    storageBucket: "gx-store-43cc0.firebasestorage.app",
    messagingSenderId: "1032633501549",
    appId: "1:1032633501549:web:1db7e41edb633095bc7c64",
    measurementId: "G-G8B3SBT6RP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { ref, uploadString, getDownloadURL };
