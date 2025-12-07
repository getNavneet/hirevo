import { motion } from "framer-motion";
import { Upload, MessageSquare, TrendingUp, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "Upload Resume / Select Topic",
      description: "Choose your interview focus by uploading your resume or selecting from programming languages and core CS subjects",
      icon: <Upload className="w-8 h-8" />,
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      step: "2",
      title: "Practice Interview with AI",
      description: "Engage in realistic mock interviews with our AI that asks relevant questions based on your profile",
      icon: <MessageSquare className="w-8 h-8" />,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      step: "3",
      title: "Get Feedback & Improve",
      description: "Receive instant detailed feedback on your answers and track your progress over time",
      icon: <TrendingUp className="w-8 h-8" />,
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get interview-ready in three simple steps
          </p>
        </motion.div>

        {/* Steps Container */}
        <div className="relative">
          {/* Connection Line (Desktop only) */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 transform -translate-y-1/2" style={{ width: 'calc(100% - 8rem)', left: '4rem' }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                {/* Card */}
                <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 h-full">
                  {/* Step Number Badge */}
                  <div className={`absolute -top-6 left-8 w-12 h-12 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg z-10`}>
                    <span className="text-white font-bold text-xl">{s.step}</span>
                  </div>

                  {/* Icon Container */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white mb-6 mt-4`}
                  >
                    {s.icon}
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {s.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                {/* Arrow Connector (Desktop only, not on last item) */}
                {i < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 + 0.3 }}
                    viewport={{ once: true }}
                    className="hidden md:block absolute top-24 -right-4 transform -translate-y-1/2 z-20"
                  >
                    <ArrowRight className="w-8 h-8 text-indigo-400" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Add to your global CSS or Tailwind config */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
