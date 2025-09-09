//these question rules apply for programming language and core subject

const DIFFICULTY_CONFIGS = {
  begineer: {
    CRITICAL_RULES: [
      "Generate ONE simple, straightforward question at a time about the selected topic.",
      "Focus on core concepts, definitions, and everyday real-world examples.",
      "Keep wording clear and beginner-friendly; avoid jargon.",
      "Maintain a friendly, encouraging tone.",
      "If first question, start with a warm welcome.",
      "No trivia or trick questions; support learning."
    ],
    QUESTION_TYPES: [
      "Direct conceptual questions (e.g., 'What is a variable in JavaScript?')",
      "Basic real-world scenarios ('How would you use an array in your daily coding tasks?')",
      "Simple trade-off or decision-making questions ('When would you use a loop instead of recursion?')"
    ],
    ASSESSMENT_FOCUS: [
      "Basic understanding",
      "Clarity of explanation",
      "Ability to connect concept to practical use",
      "Communication confidence"
    ]
  },
  intermediate: {
    CRITICAL_RULES: [
      "Ask questions that require application of topic knowledge to practical situations.",
      "always ask one question at a time",
      "Introduce some complexity: short scenarios, best practices, common pitfalls.",
      "Encourage explanation of thought process and reasoning.",
      "Keep the tone professional but supportive."
    ],
    QUESTION_TYPES: [
      "Scenario-based ('Given this bug report, how would you investigate?')",
      "Problem-solving ('How would you optimize this SQL query for faster performance?')",
      "Best practices ('What steps would you follow to debug a memory leak?')"
    ],
    ASSESSMENT_FOCUS: [
      "Ability to apply concepts",
      "Logical and structured approach",
      "Problem-solving in realistic contexts",
      "Explaining reasoning clearly"
    ]
  },
  expert: {
    CRITICAL_RULES: [
      "Pose in-depth, challenging questions that test deep understanding, multi-step reasoning, and real-world expertise.",
      `Scenario-based questions ("How would you handle...")`,
      `Experience-driven questions ("Tell me about a time when...")`,
      "Force candidate to analyze, compare approaches, or make architectural decisions.",
      "Use high-level scenarios, system design, or edge-case problems.",
      "Maintain a professional tone, but encourage critical thinking."
    ],
    QUESTION_TYPES: [
      "Complex scenarios ('How would you design a high-traffic URL shortener?')",
      "Trade-off/Decision-making ('What are the pros and cons of eventual vs. strong consistency in distributed databases?')",
      "Optimization/Scaling ('How would you handle scaling bottlenecks in a microservices architecture?')"
    ],
    ASSESSMENT_FOCUS: [
      "Depth of technical knowledge",
      "Big-picture/system thinking",
      "Decision-making with rationale",
      "Ability to identify and address trade-offs"
    ]
  }
};

function getQuestionRulesByLevel(level) {   //easy,medium,hard
  console.log("level",level)
  const criticalRules= DIFFICULTY_CONFIGS[level].CRITICAL_RULES;
  const questionTypeToPrioritize= DIFFICULTY_CONFIGS[level].QUESTION_TYPES;
  const assessementFocus= DIFFICULTY_CONFIGS[level].ASSESSMENT_FOCUS;
  return {criticalRules,questionTypeToPrioritize,assessementFocus}
}

export {getQuestionRulesByLevel}


