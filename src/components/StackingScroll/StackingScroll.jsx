const StackingCard = () => {
 const features = [
    {
      title: "AI-Powered Interviews",
      description: "Practice with our advanced AI that adapts to your responses in real-time",
      icon: "🎯",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      title: "Real-Time Feedback",
      description: "Get instant analysis on your answers, body language, and communication skills",
      icon: "⚡",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      title: "Resume Analysis",
      description: "AI-powered resume scoring with actionable insights to improve your profile",
      icon: "📊",
      gradient: "from-pink-500 to-rose-600"
    },
    {
      title: "Track Your Progress",
      description: "Monitor improvement over time with detailed analytics and performance metrics",
      icon: "📈",
      gradient: "from-rose-500 to-orange-600"
    }
  ];

  return (
    <section className="relative bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">
          Everything You Need to Succeed
        </h2>
        
        <div className="relative">
          {features.map((feature, index) => (
            <div
              key={index}
              className="sticky mb-8"
              style={{
                top: `${index * 2}rem`,
                marginTop: index === 0 ? 0 : '50vh',
              }}
            >
              <div 
                className={`rounded-3xl bg-gradient-to-br ${feature.gradient} p-8 shadow-2xl transform transition-transform duration-300`}
                style={{
                  transformOrigin: 'top center',
                }}
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-3xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-lg text-white/90">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default StackingCard;