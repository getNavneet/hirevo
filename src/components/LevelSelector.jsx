"use client"

const levels = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Basic concepts and fundamental questions",
    duration: "15-20 minutes",
    color: "bg-green-50 border-green-200 hover:border-green-300",
    badge: "bg-green-100 text-green-800",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Moderate complexity with practical scenarios",
    duration: "25-30 minutes",
    color: "bg-yellow-50 border-yellow-200 hover:border-yellow-300",
    badge: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Complex problems and in-depth analysis",
    duration: "35-45 minutes",
    color: "bg-red-50 border-red-200 hover:border-red-300",
    badge: "bg-red-100 text-red-800",
  },
]

export default function LevelSelector({ onSelect, onBack }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Select Difficulty Level</h2>
        <p className="text-lg text-gray-600">Choose the level that matches your current skill level</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => onSelect(level.id)}
            className={`${level.color} rounded-xl p-6 border-2 transition-all duration-200 text-left`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{level.name}</h3>
                <span className={`${level.badge} px-2 py-1 rounded-full text-xs font-medium`}>{level.duration}</span>
              </div>
              <p className="text-gray-600">{level.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
