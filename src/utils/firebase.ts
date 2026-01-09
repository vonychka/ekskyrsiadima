import firebase from 'firebase/app';
import 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD4VQ5-2Q8V9F3W7R6T5Y4U3I2O1P0Q9R8",
  authDomain: "ekskyrsiadima.firebaseapp.com",
  databaseURL: "https://ekskyrsiadima-default-rtdb.firebaseio.com",
  projectId: "ekskyrsiadima",
  storageBucket: "ekskyrsiadima.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345"
};

// Инициализируем Firebase только если он еще не инициализирован
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const database = firebase.database();

export { app, database };
