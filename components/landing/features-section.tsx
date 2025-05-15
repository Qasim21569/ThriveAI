import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="p-8 rounded-xl bg-gradient-to-br from-[#14143a]/80 to-[#1c1056]/80 backdrop-blur-md border border-indigo-900/40 relative overflow-hidden h-full shadow-xl shadow-indigo-900/20"
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg"></div>
      
      {/* Glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-indigo-600/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="text-indigo-400 mb-6">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-900/70 to-indigo-700/40 flex items-center justify-center shadow-lg">
        {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </motion.div>
  );
};

export const FeaturesSection = () => {
  const [sectionRef, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="relative py-24 px-4 md:py-32" id="features">
      {/* Enhanced background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c22]/90 to-[#141436]/90 z-[-1]"></div>
      
      {/* Section connector - creates visual flow from mode cards section */}
      <div className="absolute top-0 left-0 right-0 h-32 z-0" style={{
        background: 'linear-gradient(to bottom, rgba(26, 1, 64, 0.7) 0%, rgba(10, 10, 31, 0) 100%)'
      }}></div>
      
      {/* Add vertical light beam for visual connection */}
      <motion.div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-24"
        style={{
          background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.7) 0%, rgba(67, 56, 202, 0.1) 100%)',
          filter: 'blur(3px)'
        }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
          height: [80, 100, 80]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      />
      
      <div className="max-w-6xl mx-auto relative z-10">  
        <motion.div 
          ref={sectionRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            Transform Your Life With <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400">AI Coaching</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Personalized guidance at your fingertips for fitness, career, finances, and mental wellbeing
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>}
            title="Fitness Coaching"
            description="Personalized workout plans, nutrition guidance, and progress tracking tailored to your unique body and goals."
          />
          
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>}
            title="Career Development"
            description="Interview preparation, skill enhancement advice, and personalized career roadmaps to accelerate your professional growth."
          />
          
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>}
            title="Financial Guidance"
            description="Budget optimization, investment strategies, and financial planning assistance tailored to your income and goals."
          />
          
          <FeatureCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>}
            title="Mental Wellbeing"
            description="Stress reduction techniques, mindfulness practices, and emotional support whenever you need it, day or night."
          />
        </div>
        
        {/* Stats section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-20">
          <motion.div 
            className="stat-item"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-[#14143a]/80 to-[#1c1056]/80 backdrop-blur-md border border-indigo-900/40 relative overflow-hidden shadow-xl shadow-purple-900/10">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg"></div>
              
              <div className="relative">
                <div className="text-6xl font-bold text-white mb-3">24/7</div>
                <p className="text-white text-xl font-semibold mb-2">Always Available</p>
                <p className="text-gray-300 text-base">Get guidance whenever you need it, day or night</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="stat-item"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-[#14143a]/80 to-[#1c1056]/80 backdrop-blur-md border border-indigo-900/40 relative overflow-hidden shadow-xl shadow-purple-900/10">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg"></div>
              
              <div className="relative">
                <div className="text-6xl font-bold text-white mb-3">100%</div>
                <p className="text-white text-xl font-semibold mb-2">Personalized</p>
                <p className="text-gray-300 text-base">Guidance tailored to your specific goals and needs</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="stat-item"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-[#14143a]/80 to-[#1c1056]/80 backdrop-blur-md border border-indigo-900/40 relative overflow-hidden shadow-xl shadow-purple-900/10">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-purple-500/40 rounded-br-lg"></div>
              
              <div className="relative">
                <div className="text-6xl font-bold text-white mb-3">4 in 1</div>
                <p className="text-white text-xl font-semibold mb-2">Coaching Areas</p>
                <p className="text-gray-300 text-base">Complete life improvement in a single application</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
