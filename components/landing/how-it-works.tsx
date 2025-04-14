import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
// @ts-ignore
import gsap from 'gsap';
// @ts-ignore
import ScrollTrigger from 'gsap/dist/ScrollTrigger';

// Register ScrollTrigger with GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (sectionRef.current) {
      gsap.from(".step-item", {
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          end: 'bottom 50%',
          toggleActions: 'play none none none'
        }
      });
    }
  }, []);

  // Animation variants for hover effects
  const hoverAnimation = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  // Animation for the connecting line
  const lineAnimation = {
    hidden: { width: "0%", opacity: 0 },
    visible: { 
      width: "100%", 
      opacity: 1, 
      transition: { 
        duration: 1.5, 
        ease: "easeInOut",
        delay: 0.3
      } 
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="py-24 px-4 md:py-32 relative overflow-hidden"
      id="how-it-works"
    >
      {/* Enhanced background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A1F] via-[#120E30] to-[#1a0140]/70 z-[-1]"></div>
      
      {/* Section connector - creates visual flow from mode cards to this section */}
      <div className="absolute top-0 left-0 right-0 h-32 z-0" style={{
        background: 'linear-gradient(to bottom, rgba(26, 1, 64, 0.7) 0%, rgba(18, 14, 48, 0) 100%)'
      }}></div>
      
      {/* Enhanced light beam effects */}
      <motion.div 
        className="absolute left-1/2 transform -translate-x-1/2 -top-10 w-1/4 h-60"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(100, 60, 255, 0.2) 0%, rgba(71, 38, 217, 0.1) 40%, transparent 80%)',
          filter: 'blur(40px)'
        }}
        animate={{ 
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      {/* Glowing dots */}
      <div className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-indigo-500 opacity-70"></div>
      <div className="absolute top-3/4 right-10 w-3 h-3 rounded-full bg-purple-500 opacity-60"></div>
      <motion.div 
        className="absolute bottom-1/4 left-1/4 w-3 h-3 rounded-full bg-violet-500" 
        animate={{ 
          opacity: [0.4, 0.8, 0.4],
          boxShadow: [
            '0 0 10px 2px rgba(139, 92, 246, 0.3)',
            '0 0 20px 4px rgba(139, 92, 246, 0.5)',
            '0 0 10px 2px rgba(139, 92, 246, 0.3)'
          ]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-5xl xl:text-6xl font-bold mb-6 text-white">
              How <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">ThriveAI</span> Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your AI life coach is just a few steps away from transforming your life
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          {/* Connecting line for desktop - enhanced */}
          <div className="hidden md:block absolute left-0 right-0 h-1 z-0"
            style={{
              background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.8), rgba(139, 92, 246, 0.2))',
              boxShadow: '0 0 10px 2px rgba(139, 92, 246, 0.4)',
              top: '140px'
            }}
          ></div>
          
          {/* Step 1 - Enhanced */}
          <motion.div 
            className="step-item relative z-10"
            whileHover="hover"
            initial="rest"
            animate="rest"
          >
            <motion.div 
              className="relative bg-gradient-to-br from-[#1b1b4c]/80 to-[#19124a]/80 backdrop-blur-md rounded-xl border border-indigo-900/40 p-8 h-full"
              variants={hoverAnimation}
              style={{
                boxShadow: '0 10px 30px -5px rgba(20, 20, 70, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)'
              }}
            >
              {/* Glowing number with enhanced visibility */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-900/70 z-10">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur-sm opacity-80"></div>
                <span className="relative z-10">1</span>
              </div>
              <div className="pt-6">
                <div className="text-center mb-6">
                  <motion.div 
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1b1b4c] to-[#19124a] p-5 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      boxShadow: '0 5px 15px -5px rgba(67, 56, 202, 0.4)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#hiw-gradient1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                      <defs>
                        <linearGradient id="hiw-gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-white mb-3">Create Your Profile</h3>
                </div>
                <p className="text-gray-300 text-center">
                  Share your goals, preferences, and current situation to help the AI understand your unique needs.
                </p>
              </div>
              {/* Corner glow accents */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg"></div>
            </motion.div>
          </motion.div>
          
          {/* Step 2 - Enhanced */}
          <motion.div 
            className="step-item relative z-10"
            whileHover="hover"
            initial="rest"
            animate="rest"
          >
            <motion.div 
              className="relative bg-gradient-to-br from-[#1b1b4c]/80 to-[#19124a]/80 backdrop-blur-md rounded-xl border border-indigo-900/40 p-8 h-full"
              variants={hoverAnimation}
              style={{
                boxShadow: '0 10px 30px -5px rgba(20, 20, 70, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)'
              }}
            >
              {/* Glowing number with enhanced visibility */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-900/70 z-10">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur-sm opacity-80"></div>
                <span className="relative z-10">2</span>
              </div>
              <div className="pt-6">
                <div className="text-center mb-6">
                  <motion.div 
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1b1b4c] to-[#19124a] p-5 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      boxShadow: '0 5px 15px -5px rgba(67, 56, 202, 0.4)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#hiw-gradient2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                      <defs>
                        <linearGradient id="hiw-gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-white mb-3">Select Your Focus Area</h3>
                </div>
                <p className="text-gray-300 text-center">
                  Choose between fitness, career, financial, or mental wellbeing coaching based on your current priorities.
                </p>
              </div>
              {/* Corner glow accents */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg"></div>
            </motion.div>
          </motion.div>
          
          {/* Step 3 - Enhanced */}
          <motion.div 
            className="step-item relative z-10"
            whileHover="hover"
            initial="rest"
            animate="rest"
          >
            <motion.div 
              className="relative bg-gradient-to-br from-[#1b1b4c]/80 to-[#19124a]/80 backdrop-blur-md rounded-xl border border-indigo-900/40 p-8 h-full"
              variants={hoverAnimation}
              style={{
                boxShadow: '0 10px 30px -5px rgba(20, 20, 70, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)'
              }}
            >
              {/* Glowing number with enhanced visibility */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-900/70 z-10">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur-sm opacity-80"></div>
                <span className="relative z-10">3</span>
              </div>
              <div className="pt-6">
                <div className="text-center mb-6">
                  <motion.div 
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1b1b4c] to-[#19124a] p-5 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      boxShadow: '0 5px 15px -5px rgba(67, 56, 202, 0.4)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#hiw-gradient3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                      <defs>
                        <linearGradient id="hiw-gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      <line x1="9" y1="10" x2="15" y2="10"></line>
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-white mb-3">Start Your Conversation</h3>
                </div>
                <p className="text-gray-300 text-center">
                  Ask questions, get personalized advice, and receive ongoing guidance tailored to your unique journey.
                </p>
              </div>
              {/* Corner glow accents */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg"></div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Enhanced Action button */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <motion.a 
            href="#modes"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-lg shadow-xl shadow-purple-900/20 relative overflow-hidden group"
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Shine effect on hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            
            <span className="relative z-10 flex items-center">
              Get Started Now
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </motion.a>
        </motion.div>
      </div>
      
      {/* Enhanced Decorative elements */}
      <motion.div 
        className="absolute bottom-20 left-20 w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.05) 70%, transparent 100%)',
          filter: 'blur(40px)'
        }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-40 right-20 w-40 h-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.05) 70%, transparent 100%)',
          filter: 'blur(40px)'
        }}
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 2
        }}
      />
    </section>
  );
};

export default HowItWorksSection; 