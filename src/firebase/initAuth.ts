// src/firebase/initAuth.ts
import { onAuthStateChange, initAnonymousAuth } from './config';

export const initializeAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        console.log('User is authenticated with UID:', user.uid);
        unsubscribe();
        resolve(true);
      } else {
        console.log('No user signed in, attempting anonymous auth...');
        try {
          const userCred = await initAnonymousAuth();
          if (userCred) {
            console.log('Anonymous user created with UID:', userCred.uid);
            unsubscribe();
            resolve(true);
          } else {
            console.error('Failed to create anonymous user');
            // Still resolve as true to let the app load
            unsubscribe();
            resolve(true);
          }
        } catch (error) {
          console.error('Error in anonymous auth:', error);
          // Still resolve as true to let the app load
          unsubscribe();
          resolve(true);
        }
      }
    });
  });
};