import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  deleteDoc,
  where,
  increment
} from "firebase/firestore";

// Config provided explicitly by the user
const firebaseConfig = {
  apiKey: "AIzaSyDLdNOy2x4HjsZbuj6BUg9AotYb91_h2uM",
  authDomain: "test-b84f1.firebaseapp.com",
  projectId: "test-b84f1",
  storageBucket: "test-b84f1.firebasestorage.app",
  messagingSenderId: "993006149661",
  appId: "1:993006149661:web:7ffede06ede3c2fd4966f4",
  measurementId: "G-SK6XPL988H"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Add search / prompt params to ensure standard popup behavior
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Firebase Login Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase Logout Error:", error);
    throw error;
  }
};
