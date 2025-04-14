'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface BackgroundAnimationProps {
  reducedIntensity?: boolean;
}

export const BackgroundAnimation = ({ reducedIntensity = false }: BackgroundAnimationProps) => {
  const [mounted, setMounted] = useState(false);

  // Enhanced stars/particles with different sizes and animations
  const starsRef = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 1,
      opacity: Math.random() * 0.7 + 0.3,
      pulse: Math.random() * 2 + 1,
      xOffset: Math.random() * 40 - 20,
      yOffset: Math.random() * 40 - 20,
      duration: Math.random() * 20 + 30,
      delay: Math.random() * 5,
      color: Math.random() > 0.6 
        ? 'rgba(180, 70, 255, 0.8)' 
        : Math.random() > 0.5 
          ? 'rgba(100, 60, 255, 0.8)' 
          : 'rgba(220, 190, 255, 0.8)',
    }))
  );

  // Special accent stars (brighter and more prominent)
  const accentStarsRef = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 6 + 4,
      blur: Math.random() * 3 + 2,
      glow: Math.random() * 12 + 8,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }))
  );

  // Galaxy clusters (larger blurred elements)
  const galaxiesRef = useRef(
    Array.from({ length: 4 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 200 + 150,
      rotation: Math.random() * 360,
      opacity: Math.random() * 0.3 + 0.1,
      duration: Math.random() * 100 + 80,
      delay: Math.random() * 10,
      type: Math.random() > 0.5 ? 'spiral' : 'elliptical',
      color1: Math.random() > 0.5 ? 'rgba(180, 100, 255, 0.3)' : 'rgba(120, 80, 220, 0.3)',
      color2: Math.random() > 0.5 ? 'rgba(60, 20, 140, 0.2)' : 'rgba(100, 60, 170, 0.2)',
    }))
  );

  // Nebulae (colorful cosmic clouds)
  const nebulaeRef = useRef(
    Array.from({ length: 3 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: Math.random() * 30 + 20,
      height: Math.random() * 30 + 20,
      opacity: Math.random() * 0.3 + 0.1,
      blur: Math.random() * 80 + 40,
      duration: Math.random() * 80 + 60,
      delay: Math.random() * 5,
      color: i === 0 
        ? 'radial-gradient(ellipse, rgba(255, 100, 200, 0.3), rgba(100, 50, 180, 0.2), transparent 70%)' 
        : i === 1 
          ? 'radial-gradient(ellipse, rgba(100, 200, 255, 0.3), rgba(80, 70, 200, 0.2), transparent 70%)' 
          : 'radial-gradient(ellipse, rgba(150, 255, 200, 0.3), rgba(80, 120, 200, 0.2), transparent 70%)',
    }))
  );

  // Shooting stars
  const shootingStarsRef = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      length: Math.random() * 150 + 50,
      angle: Math.random() * 60 - 30,
      opacity: Math.random() * 0.7 + 0.3,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 10 + i * 8,
      width: Math.random() * 2 + 1,
    }))
  );

  useEffect(() => {
    // Delay mounting to avoid initial animation jank
    const timer = setTimeout(() => {
      setMounted(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // If not mounted or if window is undefined (SSR), return null
  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  // Safely access animated elements
  const stars = starsRef.current || [];
  const accentStars = accentStarsRef.current || [];
  const galaxies = galaxiesRef.current || [];
  const nebulae = nebulaeRef.current || [];
  const shootingStars = shootingStarsRef.current || [];

  // Adjust opacity based on whether we want reduced intensity
  const mainOpacity = reducedIntensity ? 0.35 : 0.5;
  const dustOpacity = reducedIntensity ? 0.25 : 0.4;
  const waveOpacity = reducedIntensity ? 0.15 : 0.25;
  const galaxyOpacity = reducedIntensity ? 0.2 : 0.3;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {/* Deep space background gradient */}
      <div
        className="absolute inset-0"
        style={{
          opacity: mainOpacity,
          background: 'linear-gradient(135deg, rgba(15, 0, 40, 0.7) 0%, rgba(40, 10, 90, 0.5) 50%, rgba(60, 25, 140, 0.3) 100%)',
        }}
      />

      {/* Cosmic vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(10, 0, 30, 0.4) 100%)',
          opacity: 0.7,
        }}
      />

      {/* Galaxies */}
      {galaxies.map((galaxy) => (
        <motion.div
          key={`galaxy-${galaxy.id}`}
          className="absolute rounded-full"
          style={{
            left: `${galaxy.left}%`,
            top: `${galaxy.top}%`,
            width: `${galaxy.size}px`,
            height: `${galaxy.size}px`,
            opacity: galaxy.opacity * (reducedIntensity ? 0.7 : 1),
            background: galaxy.type === 'spiral'
              ? `conic-gradient(from ${galaxy.rotation}deg, ${galaxy.color1}, ${galaxy.color2}, transparent 70%)`
              : `radial-gradient(ellipse, ${galaxy.color1}, ${galaxy.color2}, transparent 70%)`,
            filter: 'blur(40px)',
            transform: `rotate(${galaxy.rotation}deg)`,
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [galaxy.opacity * 0.7, galaxy.opacity, galaxy.opacity * 0.7],
            rotate: galaxy.rotation + 10,
          }}
          transition={{
            scale: {
              duration: galaxy.duration * 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            },
            opacity: {
              duration: galaxy.duration * 0.3,
            repeat: Infinity,
              repeatType: "reverse",
            ease: "easeInOut"
            },
            rotate: {
              duration: galaxy.duration,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        />
      ))}

      {/* Nebulae (colorful cosmic clouds) */}
      {nebulae.map((nebula) => (
        <motion.div
          key={`nebula-${nebula.id}`}
          className="absolute"
          style={{
            left: `${nebula.left}%`,
            top: `${nebula.top}%`,
            width: `${nebula.width}%`,
            height: `${nebula.height}%`,
            background: nebula.color,
            filter: `blur(${nebula.blur}px)`,
            opacity: nebula.opacity * (reducedIntensity ? 0.7 : 1),
          }}
          animate={{
            opacity: [nebula.opacity * 0.6, nebula.opacity, nebula.opacity * 0.6],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: nebula.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: nebula.delay
          }}
        />
      ))}

      {/* Cosmic dust clouds - larger, softer blurs */}
      <div
        className="absolute top-0 left-0 w-full h-screen"
        style={{
          opacity: dustOpacity,
          background: 'radial-gradient(circle at 30% 20%, rgba(142, 81, 255, 0.2), transparent 70%)',
          filter: 'blur(80px)'
        }}
      />

      <div
        className="absolute bottom-0 right-0 w-full h-screen"
        style={{
          opacity: dustOpacity,
          background: 'radial-gradient(circle at 70% 80%, rgba(100, 60, 255, 0.3), transparent 60%)',
          filter: 'blur(100px)'
        }}
      />

      {/* Subtle central glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[60vh] opacity-20"
        style={{
          background: 'radial-gradient(ellipse, rgba(180, 100, 255, 0.4), transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* First wave SVG - doubled width for seamless animation */}
      <div className="absolute bottom-0 left-0 right-0 w-[200%] h-[30vh]">
        <motion.div
          className="w-full h-full"
          style={{ width: '200%' }}
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{
            duration: 50,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <svg
            viewBox="0 0 2880 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,181.3C960,181,1056,203,1152,208C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z M1440,224L1488,213.3C1536,203,1632,181,1728,181.3C1824,181,1920,203,2016,202.7C2112,203,2208,181,2304,181.3C2400,181,2496,203,2592,208C2688,213,2784,203,2832,197.3L2880,192L2880,320L2832,320C2784,320,2688,320,2592,320C2496,320,2400,320,2304,320C2208,320,2112,320,2016,320C1920,320,1824,320,1728,320C1632,320,1536,320,1488,320L1440,320Z"
              fill={`rgba(72, 46, 117, ${waveOpacity})`}
            />
          </svg>
        </motion.div>
      </div>

      {/* Second wave SVG - doubled width for seamless animation */}
      <div className="absolute bottom-0 left-0 right-0 w-[200%] h-[35vh]">
        <motion.div
          className="w-full h-full"
          style={{ width: '200%' }}
          initial={{ x: '-10%' }}
          animate={{ x: '-60%' }}
          transition={{
            duration: 60,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <svg
            viewBox="0 0 2880 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,128C672,139,768,213,864,234.7C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z M1440,160L1488,170.7C1536,181,1632,203,1728,186.7C1824,171,1920,117,2016,128C2112,139,2208,213,2304,234.7C2400,256,2496,224,2592,213.3C2688,203,2784,213,2832,218.7L2880,224L2880,320L2832,320C2784,320,2688,320,2592,320C2496,320,2400,320,2304,320C2208,320,2112,320,2016,320C1920,320,1824,320,1728,320C1632,320,1536,320,1488,320L1440,320Z"
              fill={`rgba(100, 60, 255, ${waveOpacity * 0.7})`}
            />
          </svg>
        </motion.div>
      </div>

      {/* Star field (regular stars) */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          className="absolute rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            filter: 'blur(0.5px)',
            boxShadow: `0 0 4px 1px ${star.color}`,
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8], 
            opacity: [star.opacity * 0.5, star.opacity, star.opacity * 0.5],
            x: star.xOffset, 
            y: star.yOffset 
          }}
          transition={{
            scale: {
              duration: star.pulse,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            },
            opacity: {
              duration: star.pulse,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            },
            x: {
              duration: star.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: star.delay
            },
            y: {
              duration: star.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: star.delay
            }
          }}
        />
      ))}

      {/* Accent stars (brighter, with glow) */}
      {accentStars.map((star) => (
        <motion.div
          key={`accent-star-${star.id}`}
          className="absolute rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            filter: `blur(${star.blur}px)`,
            boxShadow: `0 0 ${star.glow}px 3px rgba(180, 120, 255, 0.8)`,
          }}
          initial={{ opacity: 0.1, scale: 0.6 }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.6, 1.4, 0.6] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: star.delay
          }}
        />
      ))}

      {/* Shooting stars */}
      {shootingStars.map((star) => (
        <motion.div
          key={`shooting-star-${star.id}`}
          className="absolute"
          style={{
            left: `${star.startX}%`,
            top: `${star.startY}%`,
            width: `${star.length}px`,
            height: `${star.width}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: `0 0 10px 2px rgba(180, 150, 255, 0.8), 0 0 20px 5px rgba(160, 100, 255, 0.4)`,
            opacity: 0,
            transformOrigin: 'left center',
            transform: `rotate(${star.angle}deg)`,
            borderRadius: '0 50% 50% 0',
          }}
          animate={{
            opacity: [0, star.opacity, 0],
            scaleX: [0.1, 1, 0.1],
            x: [0, star.length * 1.5, star.length * 3],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            repeatDelay: star.delay,
            ease: [0.2, 0.65, 0.9, 0.95],
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundAnimation;
