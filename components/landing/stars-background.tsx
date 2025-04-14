'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Generate stars with different properties
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    animationDuration: Math.random() * 5 + 5,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.7 + 0.3,
  }));
};

export function StarsBackground() {
  const [mounted, setMounted] = useState(false);
  // Use refs to avoid regenerating stars on each render
  const starsRef = useRef(generateStars(100)); // Reduced from 150 for better performance
  const mediumStarsRef = useRef(generateStars(75)); // Reduced from 100
  const brightStarsRef = useRef(generateStars(30)); // Reduced from 50

  useEffect(() => {
    // Delay the mounting slightly to avoid initial rendering jank
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  // Early return if not mounted or if running in an environment without window
  if (!mounted || typeof window === 'undefined') return null;

  // Safely access refs
  const stars = starsRef.current || [];
  const mediumStars = mediumStarsRef.current || [];
  const brightStars = brightStarsRef.current || [];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Distant stars (small and dim) */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          className="absolute rounded-full bg-white"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            left: `${star.x}%`,
            top: `${star.y}%`,
            opacity: star.opacity * 0.6,
            boxShadow: `0 0 ${star.size * 1.5}px rgba(255, 255, 255, 0.7)`,
          }}
          initial={{ opacity: star.opacity * 0.6 }}
          animate={{
            opacity: [star.opacity * 0.6, star.opacity * 0.8, star.opacity * 0.6],
          }}
          transition={{
            duration: star.animationDuration,
            delay: star.delay,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Medium stars */}
      {mediumStars.map((star) => (
        <motion.div
          key={`medium-star-${star.id}`}
          className="absolute rounded-full bg-blue-50"
          style={{
            width: `${star.size + 0.5}px`,
            height: `${star.size + 0.5}px`,
            left: `${star.x}%`,
            top: `${star.y}%`,
            opacity: star.opacity * 0.7,
            boxShadow: `0 0 ${star.size * 2}px rgba(219, 234, 254, 0.8)`,
          }}
          initial={{ opacity: star.opacity * 0.7, scale: 1 }}
          animate={{
            opacity: [star.opacity * 0.7, star.opacity * 0.9, star.opacity * 0.7],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: star.animationDuration * 0.7,
            delay: star.delay,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Bright stars (purple hue) */}
      {brightStars.map((star) => (
        <motion.div
          key={`bright-star-${star.id}`}
          className="absolute rounded-full bg-violet-100"
          style={{
            width: `${star.size + 1}px`,
            height: `${star.size + 1}px`,
            left: `${star.x}%`,
            top: `${star.y}%`,
            opacity: star.opacity,
            boxShadow: `0 0 ${star.size * 3}px rgba(139, 92, 246, 0.9)`,
          }}
          initial={{ opacity: star.opacity, scale: 1 }}
          animate={{
            opacity: [star.opacity, 1, star.opacity],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.animationDuration * 0.5,
            delay: star.delay,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Nebula-like gradients - reduced to just one for better performance */}
      <motion.div
        className="absolute opacity-10 rounded-full"
        style={{
          width: '500px',
          height: '500px',
          left: '20%',
          top: '30%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(79, 70, 229, 0.2) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        initial={{ opacity: 0.1, scale: 1 }}
        animate={{
          opacity: [0.1, 0.15, 0.1],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
    </div>
  );
} 