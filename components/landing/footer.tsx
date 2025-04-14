'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export const Footer = () => {
  return (
    <footer className="relative mt-16 py-20 px-4 border-t border-blue-900/30 overflow-hidden z-10">
      {/* Enhanced Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080820] via-[#060618] to-[#030312] z-[-1]"></div>
      
      {/* Animated glow effects */}
      <motion.div 
        className="absolute left-1/4 bottom-1/3 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(71, 38, 217, 0.1) 0%, rgba(100, 60, 255, 0.05) 40%, transparent 70%)',
          filter: 'blur(80px)'
        }}
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
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
        className="absolute right-1/4 top-1/2 w-72 h-72 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(100, 60, 255, 0.12) 0%, rgba(71, 38, 217, 0.05) 40%, transparent 70%)',
          filter: 'blur(60px)'
        }}
        animate={{ 
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-1">
            <motion.h3 
              className="text-2xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-500 to-indigo-600 mr-1">Thrive</span>
              <span className="text-violet-400">AI</span>
            </motion.h3>
            <motion.p 
              className="text-gray-300 mb-6"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Your personal AI life coach for fitness, career, finance, and mental health guidance.
            </motion.p>
            <motion.div 
              className="flex space-x-5 mt-6"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.a 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#14143a]/80 to-[#1c1056]/80 text-gray-300 hover:text-violet-400 transition-colors border border-indigo-900/40"
                whileHover={{ y: -3, scale: 1.05, transition: { duration: 0.2 } }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </motion.a>
              <motion.a 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#14143a]/80 to-[#1c1056]/80 text-gray-300 hover:text-violet-400 transition-colors border border-indigo-900/40"
                whileHover={{ y: -3, scale: 1.05, transition: { duration: 0.2 } }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                </svg>
              </motion.a>
              <motion.a 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#14143a]/80 to-[#1c1056]/80 text-gray-300 hover:text-violet-400 transition-colors border border-indigo-900/40"
                whileHover={{ y: -3, scale: 1.05, transition: { duration: 0.2 } }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </motion.a>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold text-white mb-5 relative inline-block">
              Company
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-transparent"></div>
            </h4>
            <ul className="space-y-3">
              <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <Link href="/about" className="text-gray-300 hover:text-violet-400 transition-colors">About</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <Link href="/services" className="text-gray-300 hover:text-violet-400 transition-colors">Services</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <Link href="/blog" className="text-gray-300 hover:text-violet-400 transition-colors">Blog</Link>
              </motion.li>
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold text-white mb-5 relative inline-block">
              Support
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-transparent"></div>
            </h4>
            <ul className="space-y-3">
              <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <Link href="/help" className="text-gray-300 hover:text-violet-400 transition-colors">Help Center</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <Link href="/contact" className="text-gray-300 hover:text-violet-400 transition-colors">Contact</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <Link href="/faq" className="text-gray-300 hover:text-violet-400 transition-colors">FAQ</Link>
              </motion.li>
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="text-lg font-semibold text-white mb-5 relative inline-block">
              Legal
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-transparent"></div>
            </h4>
            <ul className="space-y-3">
              <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <Link href="/privacy" className="text-gray-300 hover:text-violet-400 transition-colors">Privacy Policy</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <Link href="/terms" className="text-gray-300 hover:text-violet-400 transition-colors">Terms of Service</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <Link href="/cookies" className="text-gray-300 hover:text-violet-400 transition-colors">Cookie Policy</Link>
              </motion.li>
            </ul>
          </motion.div>
        </div>
        
        <div className="border-t border-blue-900/30 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
          <motion.p 
            className="text-gray-400 text-sm"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            © 2025 ThriveAI. All rights reserved.
          </motion.p>
          <motion.p 
            className="text-gray-400 text-sm mt-4 md:mt-0"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Built with 
            <span className="inline-block mx-1">
              <motion.span 
                className="text-violet-400"
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                ❤️
              </motion.span>
            </span> 
            for a healthier, happier you
          </motion.p>
        </div>
      </div>
    </footer>
  );
};
