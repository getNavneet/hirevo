import {motion} from 'framer-motion';
const FAQ = () => {
  const faqs = [
    { q: "Is it free to use?", a: "Yes, you can start for free with limited interviews." },
    { q: "Can I use it without uploading a resume?", a: "Yes! You can also select a topic manually." },
    { q: "Who is this for?", a: "Students, job seekers, or anyone who wants to improve interview skills." },
  ];

  return (
    <section className="py-20">
      <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
      <div className="max-w-3xl mx-auto space-y-6 px-6">
        {faqs.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-50 rounded-xl shadow-md p-6"
          >
            <h3 className="font-semibold mb-2">{f.q}</h3>
            <p className="text-gray-600">{f.a}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;