import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Image from 'next/image';

// Register ScrollTrigger with GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  avatar: string;
  rating: number;
}

export const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Fitness Transformation",
      quote: "Thrive AI completely revolutionized my approach to fitness. After 3 months, I exceeded my weight loss goals and built a sustainable routine I actually enjoy. The personalized guidance makes all the difference!",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Tech Lead",
      quote: "As someone who struggled with work-life balance, the career coaching has been invaluable. Thrive AI helped me negotiate a 20% raise and create boundaries that improved both my performance and happiness.",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      rating: 5
    },
    {
      id: 3,
      name: "Emma Wilson",
      role: "Entrepreneur",
      quote: "The financial insights transformed my business. Thrive AI identified spending patterns I was blind to and guided me through creating an investment strategy that's already showing returns.",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 5
    },
    {
      id: 4,
      name: "David Rodriguez",
      role: "Mental Health Journey",
      quote: "I was skeptical about AI coaching for mental wellbeing, but I'm amazed at how effective it's been. The daily mindfulness exercises and cognitive techniques have reduced my anxiety by at least 80%.",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      rating: 5
    },
    {
      id: 5,
      name: "Aisha Patel",
      role: "Working Parent",
      quote: "Juggling career and family was overwhelming until I found Thrive AI. The personalized routines and goal-setting frameworks helped me prioritize what truly matters. Life-changing!",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5
    }
  ];
  
  const handleImageError = (id: number) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  };
  
  useEffect(() => {
    if (sectionRef.current && headingRef.current) {
      // Animate the section title
      gsap.from(headingRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top 80%',
          end: 'bottom 60%',
          toggleActions: 'play none none none',
        }
      });
    }
    
    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
  // Function to render avatar with fallback
  const renderAvatar = (testimonial: Testimonial) => {
    if (imageError[testimonial.id]) {
      // Render fallback avatar with initials if image fails to load
      const initials = testimonial.name.split(' ').map(n => n[0]).join('');
      return (
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
          {initials}
        </div>
      );
    }
    
    return (
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500">
        <Image 
          src={testimonial.avatar} 
          alt={testimonial.name} 
          width={64} 
          height={64}
          onError={() => handleImageError(testimonial.id)}
          priority={activeIndex === testimonials.findIndex(t => t.id === testimonial.id)}
        />
      </div>
    );
  };
  
  return (
    <section 
      ref={sectionRef}
      className="relative py-28 px-4 overflow-hidden"
      id="testimonials"
    >
      {/* Enhanced background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#120E30] to-[#1a0140]/90 z-[-1]"></div>
      
      {/* Section connector - creates visual flow from features to this section */}
      <div className="absolute top-0 left-0 right-0 h-32 z-0" style={{
        background: 'linear-gradient(to bottom, rgba(26, 1, 64, 0.7) 0%, rgba(18, 14, 48, 0) 100%)'
      }}></div>
      
      {/* Background elements */}
      <motion.div 
        className="absolute left-1/2 transform -translate-x-1/2 -top-10 w-1/3 h-80"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(100, 60, 255, 0.25) 0%, rgba(71, 38, 217, 0.15) 40%, transparent 80%)',
          filter: 'blur(60px)'
        }}
        animate={{ 
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div ref={headingRef} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Real <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">Transformations</span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-300 text-lg">
            See how Thrive AI is helping people achieve their goals and transform their lives.
          </p>
        </div>
        
        <div 
          ref={testimonialsRef}
          className="relative max-w-4xl mx-auto p-1 my-10"
        >
          {/* Testimonial Cards */}
          <div className="relative h-[340px] sm:h-[300px]">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className={`absolute top-0 left-0 w-full p-8 rounded-2xl ${
                  activeIndex === index 
                    ? 'z-10 bg-gradient-to-br from-[#1a1a40]/90 to-[#2c1d6c]/90' 
                    : 'z-0 bg-[#1a1a40]/50'
                } backdrop-blur-md border border-indigo-500/30 transition-all duration-500`}
                style={{
                  boxShadow: activeIndex === index 
                    ? '0 10px 30px -5px rgba(20, 20, 70, 0.7), 0 0 20px 1px rgba(139, 92, 246, 0.2)'
                    : '0 8px 20px -5px rgba(20, 20, 70, 0.5)'
                }}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ 
                  opacity: activeIndex === index ? 1 : 0,
                  y: activeIndex === index ? 0 : 20,
                  scale: activeIndex === index ? 1 : 0.95,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="flex-shrink-0">
                    {renderAvatar(testimonial)}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <svg 
                          key={starIndex} 
                          className={`w-5 h-5 ${starIndex < testimonial.rating ? 'text-violet-400' : 'text-gray-600'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    
                    <p className="text-gray-200 text-lg mb-4 italic">"{testimonial.quote}"</p>
                    
                    <div>
                      <h4 className="font-semibold text-white">{testimonial.name}</h4>
                      <p className="text-indigo-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Pagination dots */}
          <div className="flex justify-center space-x-2 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  activeIndex === index 
                    ? 'bg-violet-500 w-8' 
                    : 'bg-gray-700 hover:bg-indigo-500'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Enhanced Decorative elements */}
      <motion.div 
        className="absolute bottom-20 right-20 w-48 h-48 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.05) 70%, transparent 100%)',
          filter: 'blur(60px)'
        }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      {/* Additional glowing accent */}
      <motion.div 
        className="absolute top-40 left-20 w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 90%)',
          filter: 'blur(30px)'
        }}
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          x: [0, 10, 0],
          y: [0, -5, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
    </section>
  );
}; 