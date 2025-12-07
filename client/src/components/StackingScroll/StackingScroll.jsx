import React, { useRef } from 'react';
import { useScroll } from 'framer-motion';
import Card from './Card';
import './stackingscroll.css';

const StackingCards = () => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end']
  });

  const projects = [
    {
      title: "AI-Powered Interviews",
      description: "Master your interview skills with our advanced AI that adapts to your responses in real-time. Get instant feedback on your answers, body language, and communication style. Practice unlimited times until you feel confident and ready.",
      src: "interview-mockup.jpg",
      url: "https://yourapp.com/interviews",
      color: "#5f57ff"
    },
    {
      title: "Resume Analysis",
      description: "Upload your resume and receive comprehensive AI-powered scoring with actionable insights. Our system analyzes formatting, keywords, achievements, and overall impact to help you stand out from the competition.",
      src: "resume-mockup.jpg",
      url: "https://yourapp.com/resume",
      color: "#8c52ff"
    },
    {
      title: "Leaderboards & Challenges",
      description: "Rise in the ranks by putting in the work. Our point system is based on dedication, not scores. Compete with peers, earn badges, and track your progress as you prepare for your dream role.",
      src: "leaderboard-mockup.jpg",
      url: "https://yourapp.com/leaderboard",
      color: "#d946ef"
    },
    {
      title: "Progress Tracking",
      description: "Monitor your improvement over time with detailed analytics and performance metrics. Visualize your strengths, identify areas for improvement, and watch your confidence grow with every practice session.",
      src: "progress-mockup.jpg",
      url: "https://yourapp.com/progress",
      color: "#f43f5e"
    }
  ];

  return (
    <main ref={container} className="stacking-main">
      {projects.map((project, i) => {
        const targetScale = 1 - ((projects.length - i) * 0.05);
        return (
          <Card 
            key={`card_${i}`}
            i={i} 
            {...project} 
            progress={scrollYProgress} 
            range={[i * 0.25, 1]} 
            targetScale={targetScale}
          />
        );
      })}
    </main>
  );
};

export default StackingCards;
