const HowItWorks = () => {
  const steps = [
    { step: "1", title: "Upload Resume / Select Topic" },
    { step: "2", title: "Practice Interview with AI" },
    { step: "3", title: "Get Feedback & Improve" },
  ];

  return (
    <section className="py-20">
      <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
      <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex flex-col items-center bg-indigo-50 rounded-xl shadow-md p-6 w-full"
          >
            <div className="text-4xl font-bold text-indigo-600 mb-4">{s.step}</div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;