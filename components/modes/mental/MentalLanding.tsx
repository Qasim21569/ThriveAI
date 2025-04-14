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

const MentalLanding = () => {
  const sectionRef = useRef(null);
  const categoriesRef = useRef(null);
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
    
    if (categoriesRef.current) {
      const categoryItems = gsap.utils.toArray('.category-item');
      
      categoryItems.forEach((item, index) => {
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
      id="mental-mode"
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
              Welcome to Mental Wellbeing Mode
            </h1>
            <div className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent"></div>
            <div className="absolute -inset-10 bg-[#643cff]/5 rounded-full blur-3xl -z-10"></div>
          </div>
          <p className="text-xl md:text-2xl text-[#e5e5ff] opacity-90 max-w-3xl mx-auto">
            Your personalized AI mental health guide for self-awareness, emotional balance, and psychological resilience.
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
            About Mental Wellbeing Mode
          </h2>
          <div className="space-y-4 text-[#e5e5ff]">
            <p className="text-lg">
              Mental Wellbeing Mode is designed to help you gain valuable insights into your mental health, lifestyle habits, and emotional patterns through a thoughtful questionnaire.
            </p>
            <p className="text-lg">
              Our AI-powered system analyzes your responses to create a personalized report about your current mental state, areas for improvement, and practical solutions tailored to your unique situation.
            </p>
            <p className="text-lg">
              This is not a diagnostic tool, but rather a gateway to self-awareness and emotional growth. All your data is handled with the utmost privacy and care.
            </p>
          </div>
        </motion.div>

        {/* Assessment Categories section */}
        <div ref={categoriesRef} className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center glow-text bg-clip-text text-transparent bg-gradient-to-r from-[#643cff] to-[#b446ff]">
            What We Assess
          </h2>

          <div className="grid gap-10 md:gap-16">
            {/* Category 1 */}
            <div className="category-item glass-bg rounded-2xl p-8 md:p-10 relative overflow-hidden border border-indigo-500/20 shadow-[0_0_20px_rgba(100,60,255,0.1)]">
              <div className="absolute -top-5 -left-5 w-24 h-24 bg-gradient-to-br from-[#643cff] to-[#b446ff] rounded-full opacity-20 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6 text-[#e5e5ff] bg-clip-text bg-gradient-to-r from-[#e5e5ff] to-[#b446ff]">Mental Health Indicators</h3>
                <ul className="list-disc pl-6 space-y-3 text-lg text-[#e5e5ff] opacity-90">
                  <li>Anxiety levels and how they manifest in your daily life</li>
                  <li>Physical symptoms of anxiety like racing heartbeat or dizziness</li>
                  <li>Presence of intrusive thoughts and how they affect you</li>
                </ul>
                <p className="mt-6 text-[#e5e5ff] opacity-80 italic border-l-4 border-violet-500/40 pl-4">
                  These indicators can help identify emotional distress and guide early intervention needs.
                </p>
              </div>
            </div>

            {/* Category 2 */}
            <div className="category-item glass-bg rounded-2xl p-8 md:p-10 relative overflow-hidden border border-indigo-500/20 shadow-[0_0_20px_rgba(100,60,255,0.1)]">
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-gradient-to-br from-[#643cff] to-[#b446ff] rounded-full opacity-20 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6 text-[#e5e5ff] bg-clip-text bg-gradient-to-r from-[#e5e5ff] to-[#b446ff]">Lifestyle and Physical Health</h3>
                <ul className="list-disc pl-6 space-y-3 text-lg text-[#e5e5ff] opacity-90">
                  <li>Sleep patterns and quality of rest</li>
                  <li>Eating habits and meal frequency</li>
                  <li>Caffeine, alcohol consumption, and smoking habits</li>
                </ul>
                <p className="mt-6 text-[#e5e5ff] opacity-80 italic border-l-4 border-violet-500/40 pl-4">
                  These factors reveal health habits that significantly influence your psychological wellbeing.
                </p>
              </div>
            </div>

            {/* Category 3 */}
            <div className="category-item glass-bg rounded-2xl p-8 md:p-10 relative overflow-hidden border border-indigo-500/20 shadow-[0_0_20px_rgba(100,60,255,0.1)]">
              <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-gradient-to-br from-[#643cff] to-[#b446ff] rounded-full opacity-20 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6 text-[#e5e5ff] bg-clip-text bg-gradient-to-r from-[#e5e5ff] to-[#b446ff]">Temperament and Emotional Regulation</h3>
                <ul className="list-disc pl-6 space-y-3 text-lg text-[#e5e5ff] opacity-90">
                  <li>Your day-to-day temperament and mood fluctuations</li>
                  <li>How comfortable you are with expressing emotions</li>
                  <li>Your emotional intelligence and awareness</li>
                </ul>
                <p className="mt-6 text-[#e5e5ff] opacity-80 italic border-l-4 border-violet-500/40 pl-4">
                  These insights help assess your emotional stability and interpersonal functioning.
                </p>
              </div>
            </div>

            {/* Category 4 */}
            <div className="category-item glass-bg rounded-2xl p-8 md:p-10 relative overflow-hidden border border-indigo-500/20 shadow-[0_0_20px_rgba(100,60,255,0.1)]">
              <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-gradient-to-br from-[#643cff] to-[#b446ff] rounded-full opacity-20 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6 text-[#e5e5ff] bg-clip-text bg-gradient-to-r from-[#e5e5ff] to-[#b446ff]">Social Functioning and Personality</h3>
                <ul className="list-disc pl-6 space-y-3 text-lg text-[#e5e5ff] opacity-90">
                  <li>Your level of outgoingness in familiar settings</li>
                  <li>How you adapt to and function in unfamiliar environments</li>
                  <li>Your social comfort zones and boundaries</li>
                </ul>
                <p className="mt-6 text-[#e5e5ff] opacity-80 italic border-l-4 border-violet-500/40 pl-4">
                  These elements help assess introversion/extroversion tendencies and social adaptability.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="glass-bg rounded-2xl p-8 md:p-12 mb-20 max-w-4xl mx-auto border border-indigo-500/20 shadow-[0_0_30px_rgba(100,60,255,0.15)]"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-8 glow-text bg-clip-text text-transparent bg-gradient-to-r from-[#643cff] to-[#b446ff]">
            How It Works
          </h2>
          <ol className="space-y-8 text-[#e5e5ff] list-decimal pl-6">
            <li className="pl-4">
              <span className="font-bold text-xl block mb-3 text-[#e5e5ff]">Complete the Questionnaire</span>
              <p className="text-lg">Answer a series of thoughtful questions about your mental health, lifestyle habits, emotional regulation, and social functioning.</p>
            </li>
            <li className="pl-4">
              <span className="font-bold text-xl block mb-3 text-[#e5e5ff]">AI Analysis</span>
              <p className="text-lg">Our advanced AI analyzes your responses, identifying patterns, potential areas of concern, and strengths in your mental wellbeing.</p>
            </li>
            <li className="pl-4">
              <span className="font-bold text-xl block mb-3 text-[#e5e5ff]">Receive Your Personalized Report</span>
              <p className="text-lg">Get a comprehensive report detailing your current mental state, areas for improvement, and practical, actionable solutions.</p>
            </li>
            <li className="pl-4">
              <span className="font-bold text-xl block mb-3 text-[#e5e5ff]">Implement Recommendations</span>
              <p className="text-lg">Use the insights and recommendations to make positive changes in your daily life, improving your mental health and emotional resilience.</p>
            </li>
          </ol>
        </motion.div>

        {/* Important Note */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-20 max-w-4xl mx-auto text-center"
        >
          <div className="inline-block glass-bg border border-indigo-500/30 rounded-xl p-8 shadow-[0_0_20px_rgba(180,70,255,0.2)]">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-[#1a0140] border-2 border-[#643cff] shadow-[0_0_15px_rgba(100,60,255,0.4)]">
              <svg className="w-8 h-8 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-violet-300">Important Note</h3>
            <p className="text-lg text-[#e5e5ff] opacity-90">
              This tool is designed for self-awareness and guidance, not for clinical diagnosis. If you're experiencing severe distress, please seek help from a qualified mental health professional.
            </p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 text-center"
        >
          <Link href="#" className="inline-block">
            <button className="relative overflow-hidden group px-10 py-5 rounded-full text-white font-bold text-xl transition-all duration-300 bg-gradient-to-r from-[#4726d9] to-[#b446ff] shadow-[0_0_25px_rgba(180,70,255,0.5)] hover:shadow-[0_0_35px_rgba(180,70,255,0.8)]">
              <span className="relative z-10">Coming Soon</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#643cff] to-[#b446ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default MentalLanding; 