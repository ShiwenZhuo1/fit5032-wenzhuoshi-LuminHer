// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2oDYZt8mPLMVWA4Jwb_13Ll-BtvsJXis",
  authDomain: "luminher-app.firebaseapp.com",
  projectId: "luminher-app",
  storageBucket: "luminher-app.appspot.com", // ✅ corrected suffix
  messagingSenderId: "371726917847",
  appId: "1:371726917847:web:55cb63a1e6e10cb0e69092"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Keep user session after reload
setPersistence(auth, browserLocalPersistence)