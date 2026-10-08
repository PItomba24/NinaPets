
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import { getDatabase } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBJ-jvz3gcIrZwpQ_jwUzg7P82s6vUf4Vg",
    authDomain: "ninapets-7d65f.firebaseapp.com",
    databaseURL: "https://ninapets-7d65f-default-rtdb.firebaseio.com",
    projectId: "ninapets-7d65f",
    storageBucket: "ninapets-7d65f.firebasestorage.app",
    messagingSenderId: "817398881662",
    appId: "1:817398881662:web:49583a864e0767c572a72f"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };

