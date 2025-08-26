import { Link } from 'react-router-dom';
import {
  Code,
  Book,
  FileText,
  User,
  Mic,
  UserCheck,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-500 to-green-400 text-white py-16 md:py-24 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">  Your Nextwered Practice</h1>
          <p className="text-xl md:text-2xl mb-8">Personalized mock interviews, instant feedback, and comprehensive coverage for tech roles.</p>
          <Link to="/" className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-lg shadow-md hover:bg-gray-100 transition">
            Get Started
          </Link>
          <img
            src="https://via.placeholder.com/800x400?text=AI+Mock+Interview+Screenshot"
            alt="AI Mock Interview Platform"
            className="mx-auto mt-12 max-w-3xl rounded-lg shadow-lg"
          />
        </div>
      </header>

      {/* Benefits Section */} 
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why Choose Our AI Mock Interviews?</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <BenefitCard icon={<Mic className="text-4xl text-blue-500" />} title="Voice-Based Interaction" description="Practice speaking naturally with AI that understands and responds in real-time." />
            <BenefitCard icon={<UserCheck className="text-4xl text-green-500" />} title="Personalized Practice" description="Tailored questions based on your experience, role, and goals." />
            <BenefitCard icon={<Zap className="text-4xl text-blue-500" />} title="Instant Feedback" description="Get detailed analysis on your answers, strengths, and areas to improve." />
            <BenefitCard icon={<Layers className="text-4xl text-green-500" />} title="Covers All Rounds" description="From technical coding to behavioral and HR interviews." />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-4">
            <Step icon={<User className="text-4xl text-blue-500" />} title="Choose Your Interview Type" description="Select from programming, CS subjects, resume-based, or behavioral." />
            <ArrowRight className="text-3xl text-gray-500 hidden md:block" />
            <Step icon={<Mic className="text-4xl text-green-500" />} title="Start the Mock Session" description="Engage in a voice-based conversation with our AI interviewer." />
            <ArrowRight className="text-3xl text-gray-500 hidden md:block" />
            <Step icon={<Zap className="text-4xl text-blue-500" />} title="Receive Feedback" description="Get instant, actionable insights to refine your skills." />
          </div>
        </div>
      </section>

      {/* Selection Grid Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Select Your Practice Area</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SelectionCard 
              icon={<Code className="text-5xl text-blue-500" />} 
              title="Programming Language" 
              description="Practice coding interviews in your preferred language and difficulty level." 
              link="/programming-language"
            />
            <SelectionCard 
              icon={<Book className="text-5xl text-green-500" />} 
              title="Core CS Subjects" 
              description="Deep dive into algorithms, data structures, OS, networks, and more." 
              link="/core-cs-subjects"
            />
            <SelectionCard 
              icon={<FileText className="text-5xl text-blue-500" />} 
              title="Resume-Based Interview" 
              description="AI analyzes your resume and simulates tailored interview questions." 
              link="/resume-upload"
            />
            <SelectionCard 
              icon={<User className="text-5xl text-green-500" />} 
              title="Personal (HR/Behavioral) Interview" 
              description="Prepare for storytelling, leadership, and cultural fit questions." 
              link="/personal-interview"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">What Our Users Say</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <Testimonial quote="This platform transformed my interview prep. The AI feedback is spot-on!" author="Alex J., Software Engineer" />
            <Testimonial quote="Voice-based practice made me confident for real interviews. Highly recommend!" author="Sara K., Data Scientist" />
            <Testimonial quote="Covered everything from tech to behavioral. Landed my dream job!" author="Mike L., Product Manager" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-blue-600 text-white text-center">
        <div className="container mx-auto px-4">
          <p>&copy; 2025 AI Mock Interview Platform. All rights reserved.</p>
          <div className="mt-4">
            <a href="/privacy" className="mx-2 hover:underline">Privacy Policy</a>
            <a href="/terms" className="mx-2 hover:underline">Terms of Service</a>
            <a href="/contact" className="mx-2 hover:underline">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Reusable Components
const BenefitCard = ({ icon, title, description }) => (
  <div className="w-72 p-6 bg-white rounded-lg shadow-md text-center">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Step = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center max-w-xs">
    <div className="mb-4 bg-white p-4 rounded-full shadow">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const SelectionCard = ({ icon, title, description, link }) => (
  <div className="p-8 bg-white rounded-lg shadow-lg flex flex-col items-center text-center">
    {icon}
    <h3 className="text-2xl font-bold mt-4 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    <Link to={link} className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition">
      Start
    </Link>
  </div>
);

const Testimonial = ({ quote, author }) => (
  <div className="w-80 p-6 bg-white rounded-lg shadow-md">
    <p className="text-gray-600 mb-4 italic">"{quote}"</p>
    <p className="text-right font-semibold">- {author}</p>
  </div>
);

export default LandingPage;
