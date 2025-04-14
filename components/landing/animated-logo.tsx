'use client';

import { motion } from 'framer-motion';
import React from 'react';

export const AnimatedLogo = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      className="relative mb-8"
    >
      <div className="relative inline-block">
        {/* Main container with enhanced styling */}
        <div className="relative px-6 py-3 overflow-hidden group">
          {/* Enhanced glowing lines */}
          <motion.div
            className="absolute inset-0 opacity-30 group-hover:opacity-70 transition-opacity duration-500"
            animate={{
              background: [
                "radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.15), transparent 30%)",
                "radial-gradient(circle at 80% 80%, rgba(124, 58, 237, 0.15), transparent 30%)",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          ></motion.div>

          {/* Main text - increased size */}
          <div className="relative z-10">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-center relative">
              <div className="relative inline-block group">
                {/* Main text with enhanced purplish gradients */}
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-violet-500 to-indigo-600 group-hover:from-indigo-400 group-hover:to-violet-700 transition-all duration-500">
                  Thrive
                </span>
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-700 group-hover:from-violet-500 group-hover:to-indigo-800 transition-all duration-500">
                  AI
                </span>

                {/* Enhanced background glow */}
                <div className="absolute inset-0 -z-10">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 blur-xl"
                    animate={{
                      opacity: [0.2, 0.4, 0.2],
                      scale: [0.98, 1.02, 0.98]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>

                {/* Enhanced decorative elements */}
                <div className="absolute -inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-40"></div>
                <div className="absolute -inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-40"></div>
              </div>
            </h1>

            {/* Enhanced scan lines */}
            <motion.div 
              className="absolute inset-0 overflow-hidden opacity-15"
              animate={{ opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/15 to-transparent"
                  style={{ top: `${i * 20}%` }}
                  animate={{
                    x: ["-100%", "100%"]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "linear"
                  }}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Enhanced outer glow effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500 rounded-full"
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.98, 1.02, 0.98]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        ></motion.div>
        
        {/* Additional glow orbs */}
        <motion.div
          className="absolute -top-8 -right-8 w-16 h-16 rounded-full bg-violet-500/10 blur-xl"
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        ></motion.div>
        
        <motion.div
          className="absolute -bottom-6 -left-6 w-12 h-12 rounded-full bg-indigo-500/10 blur-xl"
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.85, 1.15, 0.85]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        ></motion.div>
      </div>
    </motion.div>
  );
};

export default AnimatedLogo; 