// src/firebase/config.ts
import { FirebaseApp } from 'firebase/app';
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
import { app } from '../services/storageService';

// Используем существующий Firebase app из storageService.ts
let database: Database;
let auth: Auth;

// Initialize database and auth
database = getDatabase(app);
auth = getAuth(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Auth persistence enabled');
  })
  .catch((error: any) => {
    console.error('Error enabling auth persistence:', error);
  });

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