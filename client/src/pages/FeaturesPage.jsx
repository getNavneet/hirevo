import { motion } from "framer-motion";
import { CheckCircle, Upload, Mic, FileText } from "lucide-react";

function FeaturesPage() {
  const steps = [
    {
      icon: <Upload className="w-10 h-10 text-blue-500" />,
      title: "Upload Resume",
      description: "Easily upload your resume or choose a topic to start practicing right away.",
    },
    {
      icon: <Mic className="w-10 h-10 text-green-500" />,
      title: "Practice Interview",
      description: "AI interviewer asks you real-world questions and listens to your answers.",
    },
    {
      icon: <FileText className="w-10 h-10 text-purple-500" />,
      title: "Get Feedback",
      description: "Receive instant insights, strengths, and improvement tips tailored for you.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16 px-6 md:px-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <h2 className="text-4xl font-bold mb-4 text-gray-900">
          How It <span className="text-blue-600">Works</span>
        </h2>
        <p className="text-lg text-gray-600">
          Just three simple steps to improve your interview skills with AI assistance.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            className="bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-xl transition"
          >
            <div className="mb-6">{step.icon}</div>
            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              {step.title}
            </h3>
            <p className="text-gray-600">{step.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-16 flex justify-center"
      >
        <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 transition flex items-center gap-2">
          Get Started
          <CheckCircle className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}

export default FeaturesPage;
