// src/main.tsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeAuth } from './firebase/initAuth';
import App from './App';
import './index.css';

const Root = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    initializeAuth()
      .then(() => {
        console.log('Auth initialized successfully');
        setIsAuthReady(true);
      })
      .catch(error => {
        console.error('Failed to initialize auth:', error);
        // Still render the app even if auth fails
        setIsAuthReady(true);
      });
  }, []);

  if (!isAuthReady) {
    return <div>Loading...</div>; // Or your custom loading component
  }

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);