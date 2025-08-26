import { motion } from "framer-motion";
import { Sparkles, Mic, Brain } from "lucide-react";

function Hero() {
  return (
    <section className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white overflow-hidden">
      
      {/* Subtle animated background blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse"></div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4 text-indigo-300 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Interview Practice</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-pink-300 to-yellow-200">
            Crack Your Next Interview with Confidence
          </h1>

          <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
            Practice real-time interviews with an AI that asks you smart questions, 
            listens to your answers, and gives instant feedback.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition">
              <Mic className="w-5 h-5" />
              Start Interview
            </button>
            <button className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md flex items-center gap-2 transition">
              <Brain className="w-5 h-5" />
              Learn More
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;