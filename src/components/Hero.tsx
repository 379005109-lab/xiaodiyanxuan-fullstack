import React from 'react';
import { motion } from 'framer-motion';
import { Armchair, Bed, Sofa, Lamp, Table2, Tv2, Box, Layers, Monitor, Component } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const icons = [Sofa, Bed, Armchair, Lamp, Table2, Tv2, Box, Layers, Monitor, Component];
  
  const particles = Array.from({ length: 32 }).map((_, i) => {
    const Icon = icons[i % icons.length];
    const angle = (i / 32) * Math.PI * 2;
    const radius = 350 + Math.random() * 150; 
    const startX = Math.cos(angle) * radius;
    const startY = Math.sin(angle) * radius;
    const duration = 4 + Math.random() * 4; 
    const delay = Math.random() * 5; 

    return { Icon, startX, startY, duration, delay };
  });

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-white">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-blue-50 to-purple-50 blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
        <div className="relative w-80 h-80 mx-auto mb-12 md:mb-16 flex items-center justify-center">
          
          {particles.map((p, index) => (
            <motion.div
              key={index}
              className="absolute text-gray-400"
              initial={{ 
                x: p.startX, 
                y: p.startY, 
                opacity: 0, 
                scale: 0.5,
                rotate: Math.random() * 360
              }}
              animate={{ 
                x: 0, 
                y: 0, 
                opacity: [0, 0.8, 0.8, 0], 
                scale: [0.6, 1.2, 0.3],
                rotate: 0
              }}
              transition={{ 
                duration: p.duration, 
                delay: p.delay, 
                repeat: Infinity, 
                ease: "easeInOut"
              }}
            >
              <p.Icon size={24 + Math.random() * 12} strokeWidth={1.5} />
            </motion.div>
          ))}

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative z-20 w-40 h-40 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex flex-col items-center justify-center shadow-2xl"
          >
            <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 blur-xl -z-10 rounded-full"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            <span className="text-3xl font-bold tracking-tighter">小迪</span>
            <span className="text-sm tracking-widest mt-1 opacity-90">严选</span>
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6"
        >
          万物归一 · 严选佛山
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-xl md:text-2xl text-gray-500 font-light tracking-wide max-w-2xl mx-auto"
        >
          200+ 优质工厂源源不断汇聚于此。<br className="hidden md:block" />
          为您筛选最好的设计与工艺。
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
        >
          <button 
            onClick={() => navigate('/products')}
            className="px-8 py-3 bg-blue-600 text-white rounded-full text-base font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
          >
            浏览产品
          </button>
        </motion.div>
      </div>
      
      <div className="absolute bottom-10 animate-bounce text-gray-400">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>
      </div>
    </section>
  );
};

export default Hero;
