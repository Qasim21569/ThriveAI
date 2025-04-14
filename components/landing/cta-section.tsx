import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

// Register ScrollTrigger with GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const CTASection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (sectionRef.current && contentRef.current) {
      // Create animation for the content
      gsap.from(contentRef.current.querySelectorAll('.animate-item'), {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        scrollTrigger: {
          trigger: contentRef.current,
          start: 'top 80%',
          end: 'bottom 60%',
          toggleActions: 'play none none none'
        }
      });
      
      // Create animation for the glow effect
      gsap.to('.glow-effect', {
        opacity: 0.8,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }
  }, []);
  
  return (
    <section 
      ref={sectionRef}
      className="relative py-24 px-4 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] to-[#141425] pointer-events-none" />
      
      {/* Animated glow elements */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/2 glow-effect">
        <div className="blob bg-blue-600/20 left-0 top-0" />
      </div>
      <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 glow-effect">
        <div className="blob bg-indigo-600/20 right-0 bottom-0" />
      </div>
      
      {/* Main content */}
      <div 
        ref={contentRef}
        className="relative max-w-7xl mx-auto bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-3xl overflow-hidden border border-gray-700/40 p-12 sm:p-16"
      >
        {/* Highlight accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
        
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 
            className="animate-item text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100"
          >
            Begin Your AI Coaching Journey Today
          </motion.h2>
          
          <motion.p 
            className="animate-item text-gray-300 text-lg md:text-xl mb-10"
          >
            Get personalized guidance tailored to your unique profile and goals. 
            Our AI coaches are available 24/7 to help you achieve success.
          </motion.p>
          
          <div className="animate-item flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-8 rounded-full transition-all shadow-lg shadow-blue-500/20"
            >
              Get Started For Free
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="border border-white/20 hover:bg-white/10 text-white font-medium py-4 px-8 rounded-full transition-all backdrop-blur-sm"
            >
              View Demo
            </motion.button>
          </div>
        </div>
        
        {/* Animated features list */}
        <div className="animate-item mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { title: 'Personalized AI', description: 'Coaching tailored to your specific profile and needs' },
            { title: 'Multiple Domains', description: 'Guidance for fitness, career, finance, and mental health' },
            { title: 'Always Available', description: 'Get answers and support 24/7 without waiting' }
          ].map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl bg-gray-800/30 backdrop-blur-sm border border-gray-700/30"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}; 