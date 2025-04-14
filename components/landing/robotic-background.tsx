'use client';

import React, { useEffect, useState, useRef } from 'react';

// Define types for our elements
interface Dot {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  opacity: number;
  color: string;
}

interface Line {
  id: number;
  left: number;
  top: number;
  width: number;
  rotate: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface Node {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

interface Orb {
  id: number;
  left: number;
  top: number;
  width: number;
  height: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface DigitalLine {
  id: number;
  top: number;
  delay: number;
  height: number;
  opacity: number;
}

export default function RoboticBackground() {
  const [isMounted, setIsMounted] = useState(false);
  // Use refs to store generated elements for stability
  const dotsRef = useRef<Dot[]>([]);
  const linesRef = useRef<Line[]>([]);
  const nodesRef = useRef<Node[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const digitalLinesRef = useRef<DigitalLine[]>([]);
  
  useEffect(() => {
    // Generate static elements once to prevent regeneration on re-renders
    if (dotsRef.current.length === 0) {
      dotsRef.current = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 10,
        width: Math.random() * 3 + 1,
        height: Math.random() * 3 + 1,
        opacity: Math.random() * 0.3 + 0.2,
        color: Math.random() > 0.7 
          ? '#3b82f6' 
          : Math.random() > 0.5 
            ? '#6366f1' 
            : '#4f46e5'
      }));
      
      linesRef.current = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        width: Math.random() * 100 + 50,
        rotate: Math.random() * 360,
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
        opacity: Math.random() * 0.2 + 0.1
      }));
      
      nodesRef.current = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 4 + Math.floor(Math.random() * 3) * 2,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 3
      }));
      
      orbsRef.current = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        width: Math.random() * 80 + 50,
        height: Math.random() * 80 + 50,
        delay: Math.random() * 5,
        duration: 20 + Math.random() * 10,
        opacity: Math.random() * 0.08 + 0.03
      }));
      
      digitalLinesRef.current = Array.from({ length: 3 }, (_, i) => ({
        id: i,
        top: (i + 1) * 25,
        delay: i * 2,
        height: 1,
        opacity: 0.2 + (Math.random() * 0.1)
      }));
    }
    
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isMounted) {
    return (
      <div className="fixed inset-0 z-[-2] bg-gradient-to-b from-[#020212] via-[#070726] to-[#0f0f30]"></div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-[-2] bg-gradient-to-b from-[#020212] via-[#070726] to-[#0f0f30] overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      
      {/* Circuit board pattern */}
      <div className="absolute inset-0 circuit-pattern opacity-10"></div>
      
      {/* Circuit lines */}
      <div className="circuit-lines"></div>
      
      {/* Floating dots - reduced quantity */}
      {dotsRef.current.map((dot) => (
        <div 
          key={`dot-${dot.id}`}
          className="dot"
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            animationDelay: `${dot.delay}s`,
            animationDuration: `${dot.duration}s`,
            width: `${dot.width}px`,
            height: `${dot.height}px`,
            opacity: dot.opacity,
            backgroundColor: dot.color
          }}
        />
      ))}
      
      {/* Connection lines - reduced quantity */}
      <div className="connection-container">
        {linesRef.current.map((line) => (
          <div 
            key={`connection-${line.id}`}
            className="connection-line"
            style={{
              left: `${line.left}%`,
              top: `${line.top}%`,
              width: `${line.width}px`,
              transform: `rotate(${line.rotate}deg)`,
              animationDelay: `${line.delay}s`,
              animationDuration: `${line.duration}s`,
              opacity: line.opacity
            }}
          />
        ))}
      </div>
      
      {/* Circuit nodes - reduced quantity */}
      {nodesRef.current.map((node) => (
        <div 
          key={`node-${node.id}`}
          className="circuit-node"
          style={{
            left: `${node.left}%`,
            top: `${node.top}%`,
            width: `${node.size}px`,
            height: `${node.size}px`,
            animationDelay: `${node.delay}s`,
            animationDuration: `${node.duration}s`
          }}
        />
      ))}
      
      {/* Glowing orbs - reduced quantity */}
      {orbsRef.current.map((orb) => (
        <div 
          key={`orb-${orb.id}`}
          className="orb"
          style={{
            left: `${orb.left}%`,
            top: `${orb.top}%`,
            width: `${orb.width}px`,
            height: `${orb.height}px`,
            animationDelay: `${orb.delay}s`,
            animationDuration: `${orb.duration}s`,
            opacity: orb.opacity
          }}
        />
      ))}
      
      {/* Digital Effects - Lines across screen - reduced quantity */}
      {digitalLinesRef.current.map((line) => (
        <div 
          key={`digital-line-${line.id}`}
          className="digital-line"
          style={{
            top: `${line.top}%`,
            animationDelay: `${line.delay}s`,
            height: `${line.height}px`,
            opacity: line.opacity
          }}
        />
      ))}
      
      {/* CSS styles */}
      <style jsx>{`
        .bg-grid {
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        .circuit-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10,10 L40,10 L40,40 L10,40 Z M50,10 L50,40 M60,10 L60,40 M70,10 L90,10 L90,30 M90,30 L60,30 M50,50 L50,90 M60,50 L60,90 M70,50 L90,50 L90,70 M90,70 L60,70 M10,50 L40,50 L40,90 L10,90 Z' stroke='%233b82f6' stroke-width='1' fill='none' /%3E%3C/svg%3E");
          background-size: 100px 100px;
        }
        
        .dot {
          position: absolute;
          border-radius: 50%;
          animation: float 15s ease-in-out infinite;
          box-shadow: 0 0 5px currentColor;
          will-change: transform;
        }
        
        .circuit-lines {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.15) 0%, transparent 50%);
        }
        
        .connection-line {
          position: absolute;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent);
          animation: pulse 20s ease-in-out infinite;
          will-change: opacity, transform;
        }
        
        .orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, transparent 70%);
          filter: blur(20px);
          animation: pulse 20s ease-in-out infinite;
          will-change: opacity, transform;
        }
        
        .connection-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        
        .circuit-node {
          position: absolute;
          border-radius: 50%;
          background-color: #3b82f6;
          box-shadow: 0 0 10px #3b82f6;
          animation: blink 4s ease-in-out infinite;
          will-change: opacity;
        }
        
        .digital-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(to right, 
            transparent 0%, 
            rgba(99, 102, 241, 0.1) 10%, 
            rgba(59, 130, 246, 0.3) 20%, 
            rgba(99, 102, 241, 0.1) 30%, 
            transparent 40%, 
            rgba(99, 102, 241, 0.2) 50%, 
            rgba(59, 130, 246, 0.4) 60%, 
            rgba(99, 102, 241, 0.2) 70%, 
            transparent 80%, 
            rgba(59, 130, 246, 0.3) 90%, 
            transparent 100%
          );
          animation: scan 10s linear infinite;
          will-change: transform;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(10px, -10px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }
        
        @keyframes blink {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes scan {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
} 