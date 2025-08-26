import { motion } from "framer-motion";
import { Sparkles, Mic, Brain, ArrowRight } from "lucide-react";

function Hero() {
  return (
    <section className="relative flex items-center justify-center min-h-screen bg-black text-white overflow-hidden">
      
      {/* Modern animated background */}
      <div className="absolute inset-0">
        {/* Animated grid pattern */}
        <motion.div 
          className="absolute inset-0 opacity-20"
          animate={{ 
            backgroundPosition: ['0px 0px', '50px 50px'],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Animated particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${20 + (i * 8)}%`,
            }}
            animate={{
              y: [-20, -100, -20],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + (i * 0.5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
          />
        ))}
        
        {/* Floating orbs with enhanced movement */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"
          animate={{ 
            x: [0, 60, -30, 0], 
            y: [0, -40, 20, 0],
            scale: [1, 1.2, 0.9, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        
        <motion.div
          className="absolute top-3/4 right-1/3 w-24 h-24 bg-cyan-400/15 rounded-full blur-xl"
          animate={{ 
            x: [0, -50, 25, 0], 
            y: [0, 30, -15, 0],
            scale: [1, 0.8, 1.3, 1],
            rotate: [0, -120, -240, -360]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 left-3/4 w-20 h-20 bg-purple-500/10 rounded-full blur-lg"
          animate={{ 
            x: [0, 40, -20, 0], 
            y: [0, -50, 25, 0],
            scale: [1, 1.4, 0.7, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 4
          }}
        />
        
        {/* Additional smaller orbs */}
        <motion.div
          className="absolute top-1/2 right-1/4 w-16 h-16 bg-pink-400/10 rounded-full blur-lg"
          animate={{ 
            x: [0, -30, 15, 0], 
            y: [0, 25, -35, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ 
            duration: 9, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        <motion.div
          className="absolute top-1/3 left-1/2 w-12 h-12 bg-yellow-400/8 rounded-full blur-md"
          animate={{ 
            x: [0, 25, -15, 0], 
            y: [0, -20, 30, 0],
            scale: [1, 0.8, 1.2, 1]
          }}
          transition={{ 
            duration: 11, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 3
          }}
        />
        
        {/* Animated gradient overlays */}
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              "linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, transparent 50%, rgba(6, 182, 212, 0.08) 100%)",
              "linear-gradient(45deg, rgba(6, 182, 212, 0.08) 0%, transparent 50%, rgba(168, 85, 247, 0.1) 100%)",
              "linear-gradient(45deg, rgba(168, 85, 247, 0.1) 0%, transparent 50%, rgba(99, 102, 241, 0.1) 100%)"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-900/10 to-pink-900/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-gray-300 text-sm font-medium"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </motion.div>
            <span>AI-Powered Interview Practice</span>
          </motion.div>

          {/* Main heading with staggered animation */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-tight mb-6"
          >
            <motion.span 
              className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Crack Your
            </motion.span>
            <motion.span 
              className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              Next Interview
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10"
          >
            Practice real-time interviews with an AI that asks you smart questions, 
            listens to your answers, and gives instant feedback to boost your confidence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-2xl shadow-indigo-600/30 flex items-center gap-2 transition-all duration-300 relative overflow-hidden"
            >
              {/* Button shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
              <Mic className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Start Interview</span>
              <motion.div
                className="relative z-10"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all duration-300"
            >
              <Brain className="w-5 h-5" />
              Learn More
            </motion.button>
          </motion.div>

          {/* Subtle floating indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="mt-16 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-1 h-3 bg-white/40 rounded-full mt-2"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;