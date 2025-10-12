import { motion } from "framer-motion";
import { Sparkles, Mic, Brain, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function HeroLight() {
  const navigate = useNavigate();
  return (
    <section className="relative flex items-center justify-center min-h-screen pt-20 lg:pt-16 bg-gray-50 text-gray-800 overflow-hidden">
      {/* Modern animated background for light mode */}
      <div className="absolute inset-0">
        {/* Animated grid pattern */}
        <motion.div
          className="absolute inset-0 opacity-50"
          animate={{
            backgroundPosition: ["0px 0px", "50px 50px"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundImage: `
              linear-gradient(rgba(129, 140, 248, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(129, 140, 248, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Animated particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-300/60 rounded-full"
            style={{
              left: `${5 + i * 11}%`,
              top: `${15 + i * 10}%`,
            }}
            animate={{
              y: [-20, -100, -20],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
          />
        ))}

        {/* Floating orbs with adjusted opacity for light mode */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-20 h-20 sm:w-32 sm:h-32 bg-indigo-400/10 rounded-full blur-2xl"
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 15, 0],
            scale: [1, 1.2, 0.9, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute top-3/4 right-1/3 w-16 h-16 sm:w-24 sm:h-24 bg-cyan-300/10 rounded-full blur-xl"
          animate={{
            x: [0, -35, 18, 0],
            y: [0, 25, -12, 0],
            scale: [1, 0.8, 1.3, 1],
            rotate: [0, -120, -240, -360],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        <motion.div
          className="absolute bottom-1/4 left-3/4 w-14 h-14 sm:w-20 sm:h-20 bg-purple-400/10 rounded-full blur-lg"
          animate={{
            x: [0, 30, -15, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.4, 0.7, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />

        {/* Additional smaller orbs */}
        <motion.div
          className="absolute top-1/2 right-1/4 w-10 h-10 sm:w-16 sm:h-16 bg-pink-300/10 rounded-full blur-lg"
          animate={{
            x: [0, -25, 12, 0],
            y: [0, 20, -28, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        <motion.div
          className="absolute top-1/3 left-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-yellow-300/10 rounded-full blur-md"
          animate={{
            x: [0, 20, -12, 0],
            y: [0, -15, 25, 0],
            scale: [1, 0.8, 1.2, 1],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />

        {/* Subtle gradient overlay for light mode */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white via-indigo-50/20 to-cyan-50/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl text-center px-4 sm:px-6 lg:px-8">
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
            className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-gray-200 text-gray-600 text-xs sm:text-sm font-medium"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
            </motion.div>
            <span className="whitespace-nowrap">
              AI-Powered Interview Practice
            </span>
          </motion.div>

          {/* Main heading with staggered animation */}
      {/* Main heading with staggered animation */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-tight mb-4 sm:mb-6"
          >
            <motion.span 
              className="block bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Don't Just Practice.
            </motion.span>
            <motion.span 
              className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-cyan-500 to-purple-500"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              Perform.
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 lg:mb-10 px-4"
          >
            Interview practice that adapts to you, helping you build confidence and land your dream job.
          </motion.p>


          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/GetStarted")}
              className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
              <span className="relative z-10">Start Interview</span>
              <motion.div
                className="relative z-10"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-700 font-semibold border border-gray-300 shadow-sm flex items-center justify-center gap-2 transition-all duration-300"
            >
              <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
              Get your resume scored
            </motion.button>
          </motion.div>

          {/* Floating scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="mt-8 sm:mt-12 lg:mt-16 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-5 h-8 sm:w-6 sm:h-10 rounded-full border-2 border-gray-300 flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-0.5 h-2 sm:w-1 sm:h-3 bg-gray-400 rounded-full mt-1 sm:mt-2"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroLight;
