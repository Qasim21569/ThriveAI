'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Create a much simpler stars background that doesn't rely on Three.js
const SimpleStarsBackground = ({ count = 100 }) => {
  // Generate random stars
  const stars = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.5 + 0.1
    }))
  , [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {stars.map((star) => (
        <div 
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `twinkle ${star.animationDuration} ease-in-out infinite`,
            animationDelay: star.animationDelay,
          }}
        />
      ))}
    </div>
  );
};

export function StarsBackground() {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Only show on desktop and medium/high-end devices
    const checkDeviceCapability = () => {
      if (typeof window === 'undefined') return false;
      if (window.innerWidth < 1024) return false;
      return true;
    };
    
    setShouldRender(checkDeviceCapability());
    
    const handleResize = () => {
      setShouldRender(checkDeviceCapability());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!mounted || !shouldRender) return null;

  return <SimpleStarsBackground count={100} />;
} 