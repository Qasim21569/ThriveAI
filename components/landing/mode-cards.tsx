'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import AuthModal from '@/components/auth/AuthModal';

export const ModeCards = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  // Animation variants for fade up effect
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1]
      }
    })
  };

  // Handler for mode selection
  const handleModeSelect = (mode: string) => {
    if (!user) {
      setSelectedMode(mode);
      setShowAuthModal(true);
    } else {
      router.push(`/${mode}`);
    }
  };

  // Handle auth success (when user successfully signs in)
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (selectedMode) {
      router.push(`/${selectedMode}`);
    }
  };

  return (
    <section className="relative py-24 px-4 md:py-32 overflow-visible z-10" id="modes">
      {/* Section connector - creates visual flow from hero to this section */}
      <div className="absolute top-0 left-0 right-0 h-32 z-0" style={{
        background: 'linear-gradient(to bottom, rgba(26, 1, 64, 0.7) 0%, rgba(18, 14, 48, 0) 100%)'
      }}></div>
      
      {/* Vertical light beam connecting to hero section */}
      <motion.div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-24 z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.7) 0%, rgba(124, 58, 237, 0.1) 100%)',
          filter: 'blur(3px)'
        }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
          height: [80, 100, 80]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      {/* Enhanced background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Larger gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#14143a]/80 to-[#1c1056]/90"></div>
        
        {/* Larger, more vibrant glow elements */}
        <motion.div 
          className="absolute left-1/4 top-1/3 w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, rgba(139, 92, 246, 0.15) 40%, transparent 70%)',
            filter: 'blur(80px)'
          }}
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute right-1/4 bottom-1/3 w-[25vw] h-[25vw] max-w-[400px] max-h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(79, 70, 229, 0.1) 40%, transparent 70%)',
            filter: 'blur(60px)'
          }}
          animate={{ 
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          custom={0}
        >
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-bold text-center mb-6 text-white">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Coaching Mode</span>
          </h2>
          <p className="text-xl text-center text-gray-300 mb-16 max-w-3xl mx-auto">
            Select the area where you want personalized AI-powered guidance to help you thrive
          </p>
        </motion.div>
        
        {/* Enhanced card shine effect overlay */}
        <div className="absolute left-0 right-0 top-1/4 h-1/2 overflow-hidden opacity-70 z-0 pointer-events-none">
          <motion.div 
            className="absolute -inset-full"
            style={{
              background: 'linear-gradient(45deg, rgba(124, 58, 237, 0) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(124, 58, 237, 0) 100%)',
            }}
            animate={{
              left: ['200%', '-200%']
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
        
        {/* Only showing the two functional cards with centered layout */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 justify-center max-w-4xl mx-auto">
          {/* Fitness Card - Enhanced */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            custom={1}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="w-full md:w-1/2 max-w-md"
          >
            <div 
              onClick={() => handleModeSelect('fitness')} 
              className="cursor-pointer block"
            >
              <div className="relative h-full rounded-xl bg-gradient-to-br from-[#14143a] to-[#1c1056] border border-indigo-900/40 shadow-xl shadow-indigo-900/20 overflow-hidden group">
                {/* Enhanced card glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-indigo-900/0 via-violet-700/10 to-purple-600/20"></div>
                
                {/* Enhanced top border glow */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/70 to-transparent"></div>
                
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg"></div>
                
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1b1b4c] to-[#19124a] flex items-center justify-center shadow-lg shadow-purple-900/30 group-hover:shadow-indigo-700/40 transition-all">
                      <svg className="w-8 h-8 text-indigo-300 group-hover:text-violet-200 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 4v16M18 4v16M4 12h16M8 8l8 8M16 8l-8 8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-violet-200 transition-colors">Fitness Coaching</h3>
                      <div className="h-1 w-12 mt-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 group-hover:w-20 transition-all duration-300"></div>
                    </div>
                  </div>
                  
                  <p className="text-lg text-gray-300 mb-8 group-hover:text-gray-200 transition-colors">
                    Get a personalized workout and nutrition plan tailored to your goals, fitness level, and available equipment.
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-400 font-semibold text-lg group-hover:text-violet-300 transition-colors">Get Started</span>
                    <span className="w-10 h-10 bg-gradient-to-br from-[#1b1b4c] to-[#19124a] rounded-full flex items-center justify-center text-indigo-400 group-hover:bg-violet-700/50 group-hover:text-violet-200 transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Mental Wellbeing Card - Enhanced */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            custom={2}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="w-full md:w-1/2 max-w-md"
          >
            <div 
              onClick={() => handleModeSelect('mental')} 
              className="cursor-pointer block"
            >
              <div className="relative h-full rounded-xl bg-gradient-to-br from-[#14143a] to-[#1c1056] border border-indigo-900/40 shadow-xl shadow-indigo-900/20 overflow-hidden group">
                {/* Enhanced card glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-indigo-900/0 via-violet-700/10 to-purple-600/20"></div>
                
                {/* Enhanced top border glow */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/70 to-transparent"></div>
                
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg"></div>
                
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1b1b4c] to-[#19124a] flex items-center justify-center shadow-lg shadow-purple-900/30 group-hover:shadow-indigo-700/40 transition-all">
                      <svg className="w-8 h-8 text-indigo-300 group-hover:text-violet-200 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round"/>
                        <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12H9" strokeLinecap="round"/>
                        <circle cx="9" cy="12" r="2" fill="currentColor"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-violet-200 transition-colors">Mental Wellbeing</h3>
                      <div className="h-1 w-12 mt-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 group-hover:w-20 transition-all duration-300"></div>
                    </div>
                  </div>
                  
                  <p className="text-lg text-gray-300 mb-8 group-hover:text-gray-200 transition-colors">
                    Reduce stress and enhance mental wellness through guided conversations with an AI coach that adapts to your needs.
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-400 font-semibold text-lg group-hover:text-violet-300 transition-colors">Get Started</span>
                    <span className="w-10 h-10 bg-gradient-to-br from-[#1b1b4c] to-[#19124a] rounded-full flex items-center justify-center text-indigo-400 group-hover:bg-violet-700/50 group-hover:text-violet-200 transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Enhanced decorative elements */}
        <motion.div 
          className="absolute -bottom-24 left-1/4 w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.07) 40%, transparent 70%)',
            filter: 'blur(40px)'
          }}
          animate={{ 
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute -top-24 right-1/4 w-72 h-72 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(79, 70, 229, 0.05) 40%, transparent 70%)',
            filter: 'blur(40px)'
          }}
          animate={{ 
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          message="Please sign in to access this coaching mode"
        />
      )}
    </section>
  );
};