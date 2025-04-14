'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const FitnessLanding = () => {
  const sectionRef = useRef(null);
  const stepsRef = useRef(null);
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate stars on client-side only to avoid hydration errors
    const generatedStars = Array(20).fill(0).map((_, i) => ({
      key: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: 0.4 + Math.random() * 0.6,
      animation: `twinkle ${3 + Math.random() * 5}s ease-in-out infinite`
    }));
    setStars(generatedStars);
    
    if (stepsRef.current) {
      const stepItems = gsap.utils.toArray('.step-item');
      
      stepItems.forEach((item, index) => {
        gsap.fromTo(
          item,
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
            delay: index * 0.2,
          }
        );
      });
    }
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen py-24 px-4 md:py-32 overflow-hidden"
      id="fitness-mode"
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A1F] to-[#1a0140] z-0"></div>
      
      {/* Small stars - client-side rendered */}
      {stars.map((star) => (
        <div 
          key={star.key}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            top: star.top,
            left: star.left,
            opacity: star.opacity,
            animation: star.animation
          }}
        />
      ))}

      {/* Content container */}
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-20"
        >
          <div className="mb-8 inline-block relative">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 hero-title shimmer-text relative z-10">
              Welcome to Fitness Mode
            </h1>
            <div className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent"></div>
            <div className="absolute -inset-10 bg-[#643cff]/5 rounded-full blur-3xl -z-10"></div>
          </div>
          <p className="text-xl md:text-2xl text-[#e5e5ff] opacity-90 max-w-3xl mx-auto">
            Your personalized AI fitness coach that adapts to your goals, schedule, and preferences.
          </p>
        </motion.div>

        {/* About section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="glass-bg rounded-2xl p-8 md:p-12 mb-20 max-w-4xl mx-auto border border-indigo-500/20 shadow-[0_0_30px_rgba(100,60,255,0.15)]"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 glow-text bg-clip-text text-transparent bg-gradient-to-r from-[#643cff] to-[#b446ff]">
            About Fitness Mode
          </h2>
          <div className="space-y-4 text-[#e5e5ff]">
            <p className="text-lg">
              Fitness Mode is your personal AI-powered fitness coach designed to create a customized fitness plan based on your unique profile, goals, and preferences.
            </p>
            <p className="text-lg">
              Unlike generic workout plans, our system uses advanced AI to analyze your specific needs, adapting to your progress and providing guidance that evolves with you.
            </p>
            <p className="text-lg">
              Whether you're looking to build muscle, lose weight, improve endurance, or enhance overall wellness, Fitness Mode creates a tailored program just for you.
            </p>
          </div>
        </motion.div>

        {/* How it works section */}
        <div ref={stepsRef} className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center glow-text bg-clip-text text-transparent bg-gradient-to-r from-[#643cff] to-[#b446ff]">
            How It Works
          </h2>

          <div className="grid gap-10 md:gap-16">
            {/* Step 1 */}
            <div className="step-item glass-bg rounded-2xl p-8 md:p-10 relative overflow-hidden border border-indigo-500/20 shadow-[0_0_20px_rgba(100,60,255,0.1)]">
              <div className="absolute -top-5 -left-5 w-24 h-24 bg-gradient-to-br from-[#643cff] to-[#b446ff] rounded-full opacity-20 blur-xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[#1a0140] border-2 border-[#643cff] text-[#b446ff] text-3xl font-bold shadow-[0_0_15px_rgba(100,60,255,0.4)]">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-[#e5e5ff]">Complete Your Profile</h3>
                  <p className="text-lg text-[#e5e5ff] opacity-90">
                    Share your current fitness level, any health conditions, exercise preferences, and available equipment. This helps us understand your unique situation.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-item glass-bg rounded-2xl p-8 md:p-10 relative overflow-hidden border border-indigo-500/20 shadow-[0_0_20px_rgba(100,60,255,0.1)]">
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-gradient-to-br from-[#643cff] to-[#b446ff] rounded-full opacity-20 blur-xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[#1a0140] border-2 border-[#643cff] text-[#b446ff] text-3xl font-bold shadow-[0_0_15px_rgba(100,60,255,0.4)]">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-[#e5e5ff]">Define Your Goals</h3>
                  <p className="text-lg text-[#e5e5ff] opacity-90">
                    Tell us what you want to achieve - weight loss, muscle gain, improved endurance, better flexibility, or specific sport performance. Be as specific as possible.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-item glass-bg rounded-2xl p-8 md:p-10 relative overflow-hidden border border-indigo-500/20 shadow-[0_0_20px_rgba(100,60,255,0.1)]">
              <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-gradient-to-br from-[#643cff] to-[#b446ff] rounded-full opacity-20 blur-xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[#1a0140] border-2 border-[#643cff] text-[#b446ff] text-3xl font-bold shadow-[0_0_15px_rgba(100,60,255,0.4)]">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-[#e5e5ff]">Set Your Schedule</h3>
                  <p className="text-lg text-[#e5e5ff] opacity-90">
                    Share your weekly availability, including how many days you can exercise and for how long. This ensures your plan fits your lifestyle.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="step-item glass-bg rounded-2xl p-8 md:p-10 relative overflow-hidden border border-indigo-500/20 shadow-[0_0_20px_rgba(100,60,255,0.1)]">
              <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-gradient-to-br from-[#643cff] to-[#b446ff] rounded-full opacity-20 blur-xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[#1a0140] border-2 border-[#643cff] text-[#b446ff] text-3xl font-bold shadow-[0_0_15px_rgba(100,60,255,0.4)]">
                  4
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-[#e5e5ff]">Receive Your Custom Plan</h3>
                  <p className="text-lg text-[#e5e5ff] opacity-90">
                    Our AI will analyze your inputs and generate a comprehensive fitness plan including workouts, nutrition guidance, and progress tracking tailored specifically to you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 text-center"
        >
          <Link href="/fitness/form" className="inline-block">
            <button className="relative overflow-hidden group px-10 py-5 rounded-full text-white font-bold text-xl transition-all duration-300 bg-gradient-to-r from-[#4726d9] to-[#b446ff] shadow-[0_0_25px_rgba(180,70,255,0.5)] hover:shadow-[0_0_35px_rgba(180,70,255,0.8)]">
              <span className="relative z-10">Get Started</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#643cff] to-[#b446ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FitnessLanding; 