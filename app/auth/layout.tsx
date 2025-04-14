'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A1F]">
      {/* Logo in top left */}
      <div className="absolute top-6 left-6 z-10">
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
      
      {/* Main content */}
      {children}
    </div>
  );
} 