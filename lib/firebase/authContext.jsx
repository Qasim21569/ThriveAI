'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Create the authentication context
const AuthContext = createContext({
  user: null,
  loading: true,
  error: null
});

/**
 * AuthProvider component to wrap around the app
 * Provides authentication state to all child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Set up auth state listener when the component mounts
  useEffect(() => {
    console.log('Auth provider initializing');
    
    try {
      const unsubscribe = onAuthStateChanged(
        auth, 
        (user) => {
          console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
          setUser(user);
          setLoading(false);
          setAuthInitialized(true);
        },
        (error) => {
          console.error('Auth state error:', error);
          setError(error);
          setLoading(false);
          setAuthInitialized(true);
        }
      );

      // Clean up subscription when the component unmounts
      return () => {
        console.log('Cleaning up auth listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up auth listener:', err);
      setError(err);
      setLoading(false);
    }
  }, []);

  // Expose auth state and extra debug info
  const value = {
    user,
    loading,
    error,
    authInitialized,
    authTime: new Date().toString()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 