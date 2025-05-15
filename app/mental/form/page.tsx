'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { SafeComponent } from '@/components/ui/safe-component';

// Dynamically import components to avoid hydration issues
const Navbar = dynamic(
  () => import('@/components/landing/navbar').then(mod => mod.Navbar),
  { ssr: false }
);

const Footer = dynamic(
  () => import('@/components/landing/footer').then(mod => mod.Footer),
  { ssr: false }
);

const BackgroundAnimation = dynamic(
  () => import('@/components/landing/background-animation').then(mod => mod.default),
  { ssr: false }
);

const MentalWellbeingForm = dynamic(
  () => import('@/components/modes/mental/form/MentalWellbeingForm').then(mod => mod.MentalWellbeingForm),
  { ssr: false }
);

export default function MentalWellbeingFormPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [bgColor, setBgColor] = useState('blue');

  useEffect(() => {
    // Delay loading of background elements for better performance
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    // Change background color subtly based on time to create a "breathing" effect
    const interval = setInterval(() => {
      setBgColor(prev => prev === 'blue' ? 'indigo' : 'blue');
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Static Background */}
      <div className="fixed inset-0 bg-background z-0"></div>
      
      {/* Calm mind overlay with subtle animation */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div 
          className={`absolute top-0 left-0 w-full h-screen opacity-30 transition-all duration-5000 ease-in-out`}
          style={{
            background: bgColor === 'blue' 
              ? 'radial-gradient(circle at 30% 20%, rgba(142, 145, 255, 0.2), transparent 70%)' 
              : 'radial-gradient(circle at 30% 20%, rgba(125, 135, 255, 0.2), transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
        <div 
          className={`absolute bottom-0 right-0 w-full h-screen opacity-30 transition-all duration-5000 ease-in-out`}
          style={{
            background: bgColor === 'blue'
              ? 'radial-gradient(circle at 70% 80%, rgba(60, 99, 255, 0.3), transparent 60%)'
              : 'radial-gradient(circle at 70% 80%, rgba(80, 70, 255, 0.3), transparent 60%)',
            filter: 'blur(100px)'
          }}
        />

        {/* Subtle central glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[60vh] opacity-20 transition-all duration-5000 ease-in-out`}
          style={{
            background: bgColor === 'blue'
              ? 'radial-gradient(ellipse, rgba(100, 130, 255, 0.4), transparent 70%)'
              : 'radial-gradient(ellipse, rgba(120, 100, 255, 0.4), transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        
        {/* Floating particles for calm effect */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-blue-300/30"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 8 + 2}px`,
                height: `${Math.random() * 8 + 2}px`,
                animation: `float ${Math.random() * 10 + 15}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Animated Background (loads after delay) */}
      {isLoaded && (
        <div className="fixed inset-0 z-0">
          <SafeComponent fallback={<div className="bg-background/80" />}>
            <BackgroundAnimation reducedIntensity />
          </SafeComponent>
        </div>
      )}
      
      {/* Navbar */}
      <SafeComponent fallback={<div className="h-16" />}>
        <Navbar />
      </SafeComponent>
      
      {/* Main Content */}
      <main className="flex-1 z-10 container mx-auto px-4 py-12 md:py-20">
        <SafeComponent fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em]"></div>
            <p className="ml-4 text-lg">Loading Assessment...</p>
          </div>
        }>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <MentalWellbeingForm />
          </motion.div>
        </SafeComponent>
      </main>
      
      {/* Footer */}
      <SafeComponent fallback={<div className="h-16" />}>
        <Footer />
      </SafeComponent>
      
      {/* Global style for floating animation */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 