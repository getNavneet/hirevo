import React from 'react';

const QuestionSection = ({ currentQuestion }) => {
  if (!currentQuestion) return null;

  return (
    <div className="question-section">
      <h3>Current Question:</h3>
      <p className="question-text">{currentQuestion}</p>
    </div>
  );
};

export default QuestionSection;