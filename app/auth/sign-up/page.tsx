'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { motion } from 'framer-motion';
import { BackgroundAnimation } from '@/components/landing/background-animation';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && !success) {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Show success message and redirect after delay
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/sign-in');
      }, 2000);
    } catch (error: any) {
      let errorMessage = 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10">
      {/* Use BackgroundAnimation component with reduced intensity */}
      <BackgroundAnimation reducedIntensity={true} />
      
      {/* Additional dark overlay for better contrast */}
      <div className="fixed inset-0 bg-black/40 z-[2] pointer-events-none"></div>

      {/* Clean Card with Glass Effect */}
      <motion.div 
        className="relative max-w-md w-full mx-4 z-[3]"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Home button - positioned above the card */}
        <motion.div 
          className="absolute -top-16 left-0 right-0 flex justify-center mb-4"
          variants={itemVariants}
        >
          <Link 
            href="/"
            className="flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-all group"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </motion.div>
        
        {/* Glass card with improved clarity */}
        <div className="relative p-8 backdrop-blur-2xl bg-[#0E0B30]/90 border border-white/20 rounded-2xl shadow-xl">
          {/* Add subtle glow effect around the card */}
          <div className="absolute inset-0 -z-10 rounded-2xl bg-indigo-600/5 blur-xl"></div>
          
          {/* Title with white text for better visibility */}
          <motion.h2 
            className="text-center text-5xl font-bold mb-12 text-white"
            variants={itemVariants}
          >
            Sign Up
          </motion.h2>

          {error && (
            <motion.div 
              className="mb-6 p-3 rounded-lg bg-red-500/20 text-red-200 text-center backdrop-blur-md border border-red-500/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              className="mb-6 p-3 rounded-lg bg-green-500/20 text-green-200 text-center backdrop-blur-md border border-green-500/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Account created successfully! Redirecting to sign in...
            </motion.div>
          )}

          <motion.form onSubmit={handleSubmit} variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4 py-4 bg-[#0a0823]/50 border border-purple-900/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-100 transition placeholder-gray-400"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full px-4 py-4 bg-[#0a0823]/50 border border-purple-900/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-100 transition placeholder-gray-400"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-4 bg-[#0a0823]/50 border border-purple-900/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-100 transition placeholder-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-4 bg-[#0a0823]/50 border border-purple-900/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-100 transition placeholder-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full px-4 py-4 bg-[#0a0823]/50 border border-purple-900/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-100 transition placeholder-gray-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              className="w-full mt-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20 relative overflow-hidden group"
              variants={itemVariants}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shine effect on hover */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <span className="relative z-10">Create Account</span>
              )}
            </motion.button>
          </motion.form>

          <motion.div 
            className="mt-8 text-center"
            variants={itemVariants}
          >
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/sign-in" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 