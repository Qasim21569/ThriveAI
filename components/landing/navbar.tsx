'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase/firebaseConfig';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // Check Firebase auth state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true);
        // Get first name from display name
        if (user.displayName) {
          const firstName = user.displayName.split(' ')[0];
          setUserName(firstName);
        } else {
          setUserName('User');
        }
      } else {
        setIsLoggedIn(false);
        setUserName('');
      }
    });
    
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe(); // Clean up auth listener
    };
  }, [scrolled]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'py-4 bg-[#14143a]/80 backdrop-blur-md border-b border-indigo-500/10' : 'py-6'
    }`}>
      <div className="container mx-auto px-6">
        {/* Desktop navigation - using CSS Grid for perfect centering */}
        <div className="hidden md:grid" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          {/* Left section - Logo */}
          <div className="flex items-center justify-start">
            <Link href="/" className="text-xl md:text-2xl font-bold text-white">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-violet-500 to-indigo-600 font-bold">Thrive</span>
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-700 font-bold">AI</span>
                
                {/* Enhanced glow effect */}
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 opacity-0 blur-md rounded-lg"
                  animate={{
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                ></motion.div>
              </motion.div>
            </Link>
          </div>
          
          {/* Middle section - Navigation Links (always centered) */}
          <nav className="flex items-center justify-center space-x-8">
            <Link href="/#hero" className="text-indigo-100/90 hover:text-white transition-colors relative group">
              <span>Home</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/#modes" className="text-indigo-100/90 hover:text-white transition-colors relative group">
              <span>Coaching Modes</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/#features" className="text-indigo-100/90 hover:text-white transition-colors relative group">
              <span>Features</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/#testimonials" className="text-indigo-100/90 hover:text-white transition-colors relative group">
              <span>Testimonials</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>
          
          {/* Right section - Auth Controls (always right-aligned) */}
          <div className="flex items-center justify-end">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-indigo-100 mr-2">Welcome,</span>
                  <motion.span 
                    className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500"
                    animate={{ 
                      textShadow: ["0 0 4px rgba(139, 92, 246, 0.3)", "0 0 8px rgba(139, 92, 246, 0.6)", "0 0 4px rgba(139, 92, 246, 0.3)"]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    {userName}
                  </motion.span>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/auth/sign-in"
                  className="px-4 py-2 text-white border border-indigo-500/30 rounded-lg text-sm font-medium hover:bg-indigo-500/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/sign-up"
                  className="px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile navigation */}
        <div className="flex items-center justify-between md:hidden">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-violet-500 to-indigo-600 font-bold">Thrive</span>
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-700 font-bold">AI</span>
            </motion.div>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="text-white p-2 rounded-lg bg-gradient-to-br from-[#1b1b4c]/80 to-[#19124a]/80 backdrop-blur-sm border border-indigo-500/20"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {showMobileMenu && (
        <motion.div 
          className="md:hidden bg-[#14143a]/95 backdrop-blur-lg border-t border-indigo-500/10"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-6 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/#hero" 
                className="text-indigo-100/90 hover:text-white py-2 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              <Link 
                href="/#modes" 
                className="text-indigo-100/90 hover:text-white py-2 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Coaching Modes
              </Link>
              <Link 
                href="/#features" 
                className="text-indigo-100/90 hover:text-white py-2 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Features
              </Link>
              <Link 
                href="/#testimonials" 
                className="text-indigo-100/90 hover:text-white py-2 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Testimonials
              </Link>
              
              {isLoggedIn ? (
                <div className="pt-2 border-t border-indigo-500/10 flex justify-between items-center">
                  <div className="text-indigo-100">Welcome, <span className="font-bold text-indigo-400">{userName}</span></div>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setShowMobileMenu(false);
                    }}
                    className="px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-indigo-500/10 flex flex-col space-y-2">
                  <Link 
                    href="/auth/sign-in"
                    className="w-full px-4 py-2 text-center text-white border border-indigo-500/30 rounded-lg text-sm font-medium hover:bg-indigo-500/10 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/sign-up"
                    className="w-full px-4 py-2 text-center text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </motion.div>
      )}
    </header>
  );
}; 