'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AnimatedLogo from './animated-logo';

export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [typewriterPhase, setTypewriterPhase] = useState(0);
  
  // Phrases to be typed out sequentially
  const phrases = [
    "Elevate your potential. Transform your life.",
    "Elevate your potential. Unlock your future.",
    "Elevate your potential. Find your purpose.",
    "Elevate your potential. Become your best."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTypewriterPhase(prev => (prev + 1) % phrases.length);
    }, 10000); // Change phrase every 10 seconds
    
    return () => clearInterval(timer);
  }, []);
  
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.2,
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1]
      }
    })
  };

  return (
    <section 
      ref={containerRef}
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 px-4"
    >
      {/* Glass panel for better text contrast with 3D background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A091F]/30 via-[#120E30]/20 to-[#1a0140]/40 backdrop-blur-sm z-0"></div>
      
      {/* Hero content */}
      <div className="max-w-6xl mx-auto text-center z-10 relative">
        {/* Animated logo */}
        <AnimatedLogo />
        
        {/* Restore the main title */}
        <motion.h1 
          className="hero-title text-5xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-5xl mx-auto text-white"
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUpVariants}
        >
          Your Personal<br />
          <span className="shimmer-text relative">AI-Powered</span> Life Coach
        </motion.h1>
        
        <motion.p 
          className="hero-subtitle text-xl text-gray-200/90 mb-12 max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUpVariants}
        >
          Personalized guidance to help you thrive in fitness, career, finances, and mental wellbeing.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUpVariants}
        >
          <motion.a 
            href="#modes"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="hero-button inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-lg shadow-xl shadow-purple-900/20 relative overflow-hidden group"
          >
            {/* Shine effect on hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            
            <span className="relative z-10 flex items-center">
              Get Started
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </motion.a>
          
          <motion.a 
            href="#features"
          whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="hero-button border border-violet-500/20 hover:bg-white/10 text-white font-medium py-4 px-8 rounded-lg transition-all backdrop-blur-sm relative overflow-hidden flex items-center justify-center"
          >
            <span className="relative z-10">Learn More</span>
            {/* Subtle glow effect */}
            <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></span>
          </motion.a>
        </motion.div>
        
        {/* Typewriter motto */}
        <motion.div 
          className="mt-6 mb-16"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          key={typewriterPhase} // Force re-render when phrase changes
        >
          <div className="flex justify-center items-center">
            <div className="typewriter-container px-4 py-2 rounded-md bg-gradient-to-r from-indigo-900/20 to-violet-900/20 backdrop-blur-sm border border-indigo-500/10">
              <p className="typewriter-text">{phrases[typewriterPhase]}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Trust text replaced with subtle divider */}
        <motion.div 
          className="mt-20"
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUpVariants}
        >
          <div className="flex justify-center">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-70"></div>
          </div>
        </motion.div>
      </div>

      {/* Shimmer effect styles */}
      <style jsx>{`
        .shimmer-text {
          background: linear-gradient(
            to right,
            #2a2062 0%,
            #7e42ff 15%,
            #bd85ff 30%,
            #7e42ff 45%,
            #2a2062 60%
          );
          background-size: 200% auto;
          color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        .pulse-glow-effect {
          background-image: linear-gradient(to right, #4f46e5, #8b5cf6, #4f46e5);
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: glow 2s ease-in-out infinite;
          text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
          position: relative;
        }
        
        /* Pulsing glow animation */
        @keyframes glow {
          0% {
            background-position: 0% center;
            filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.4));
          }
          50% {
            background-position: 100% center;
            filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.6));
          }
          100% {
            background-position: 0% center;
            filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.4));
          }
        }
        
        /* Typewriter effect */
        .typewriter-container {
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px -3px rgba(67, 56, 202, 0.1);
          min-width: 320px;
        }
        
        .typewriter-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(139, 92, 246, 0.5), transparent);
        }
        
        .typewriter-text {
          overflow: hidden;
          border-right: 2px solid rgba(139, 92, 246, 0.7);
          white-space: nowrap;
          margin: 0 auto;
          letter-spacing: 0.07em;
          font-size: 1rem;
          display: inline-block;
          background: linear-gradient(to right, #a78bfa, #c4b5fd);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: 
            typing 3.5s steps(40, end) forwards,
            blink-caret 0.75s step-end infinite,
            subtle-glow 3s ease-in-out infinite;
          width: 0;
          text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
        }
        
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }

        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: rgba(139, 92, 246, 0.7) }
        }
        
        @keyframes subtle-glow {
          0%, 100% {
            filter: drop-shadow(0 0 2px rgba(139, 92, 246, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.5));
          }
        }
      `}</style>
    </section>
  );
};
