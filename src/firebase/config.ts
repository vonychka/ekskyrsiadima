// src/firebase/config.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBE-bcqM7DM_zV8xivFKKbrSAHifIWYgps",
  authDomain: "exursional.firebaseapp.com",
  databaseURL: "https://exursional-default-rtdb.firebaseio.com/",
  projectId: "exursional",
  storageBucket: "exursional.firebasestorage.app",
  messagingSenderId: "770008017138",
  appId: "1:770008017138:web:23909355289d478208c86b"
};

// Initialize Firebase
let app: FirebaseApp;
let database: Database;
let auth: Auth;

// Initialize Firebase only once
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  
  // Enable persistence
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Auth persistence enabled');
    })
    .catch((error) => {
      console.error('Error enabling auth persistence:', error);
    });
} else {
  app = getApp();
  auth = getAuth(app);
  database = getDatabase(app);
}

// Auth state observer
const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Initialize anonymous auth
const initAnonymousAuth = async (): Promise<User | null> => {
  try {
    console.log('Attempting anonymous sign-in...');
    const userCredential = await signInAnonymously(auth);
    console.log('Anonymous sign-in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Anonymous auth error:', error);
    return null;
  }
};

// Existing admin auth functions
const loginAdmin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Login error:', error);
    return { user: null, error: error.message };
  }
};

const logoutAdmin = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

export { 
  database, 
  auth, 
  loginAdmin, 
  logoutAdmin,
  initAnonymousAuth,
  onAuthStateChange
};