'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  authInitialized: boolean;
  authTime: string;
}

// Create the authentication context
const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  authInitialized: false,
  authTime: '',
});

/**
 * AuthProvider component to wrap around the app
 * Provides authentication state to all child components
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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
          setError(error as Error);
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
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  // Expose auth state and extra debug info
  const value: AuthContextValue = {
    user,
    loading,
    error,
    authInitialized,
    authTime: new Date().toString(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
