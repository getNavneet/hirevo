const Features = () => {
  const features = [
    { title: "Real-time Q&A", desc: "AI asks you realistic interview questions." },
    { title: "Resume Parsing", desc: "Get questions tailored to your resume." },
    { title: "Feedback Reports", desc: "Detailed feedback to improve every attempt." },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl shadow-lg p-6 text-center"
          >
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-gray-600">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
export default Features;