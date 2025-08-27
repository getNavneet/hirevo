import { motion } from "framer-motion";

function AboutPage() {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center h-[50vh] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center px-6"
        >
          <h1 className="text-5xl font-bold mb-4">About Us</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Empowering students to prepare for interviews with AI-driven mock sessions, feedback, and real-world practice.
          </p>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6 md:px-20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            We believe every student deserves the chance to crack their dream job. Our AI Interview Platform simulates real interview environments, asks smart questions, and provides personalized feedback to boost confidence and skills.
          </p>
        </motion.div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            {
              title: "AI-Powered Practice",
              desc: "Simulate real interviews with AI-generated questions and feedback."
            },
            {
              title: "Accessible for Everyone",
              desc: "Our platform is built to help students globally, anytime, anywhere."
            },
            {
              title: "Future Ready",
              desc: "We continuously improve to keep you ahead in placements and career growth."
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-gray-100 rounded-2xl shadow-lg p-8 text-center"
            >
              <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-6 md:px-20">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10">Meet the Team</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
            {[
              { name: "Navneet Kumar", role: "Founder & Developer" },
              { name: "AI System", role: "Your Interviewer" },
              { name: "Future Teammates", role: "Coming Soon 🚀" }
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="bg-white shadow-lg rounded-2xl p-6"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                  {member.name[0]}
                </div>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-gray-500">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-16 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold mb-4">Ready to Ace Your Next Interview?</h2>
          <p className="text-lg mb-6">Join thousands of students improving their skills with AI.</p>
          <button className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition">
            Get Started
          </button>
        </motion.div>
      </section>
    </div>
  );
}

export default AboutPage;