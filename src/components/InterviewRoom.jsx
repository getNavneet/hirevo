"use client"

import { useState, useEffect } from "react"
import { useInterviewStore } from "../store/interview.store"
import AIAnimation from "./AIAnimation"
import UserVideo from "./UserVideo"

const sampleQuestions = [
  "Tell me about yourself and your background.",
  "What interests you most about this role?",
  "Describe a challenging project you've worked on.",
  "How do you handle working under pressure?",
  "Where do you see yourself in 5 years?",
]

export default function InterviewRoom() {
  const {
    currentQuestion,
    totalQuestions,
    timeRemaining,
    isRecording,
    toggleRecording,
    nextQuestion,
    prevQuestion,
    updateTimer,
    reset,
  } = useInterviewStore()

  const [isAISpeaking, setIsAISpeaking] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      if (timeRemaining > 0) {
        updateTimer()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, updateTimer])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      nextQuestion()
      setIsAISpeaking(true)
      setTimeout(() => setIsAISpeaking(false), 3000)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      prevQuestion()
      setIsAISpeaking(true)
      setTimeout(() => setIsAISpeaking(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Hirevo Interview</h1>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
                <span>•</span>
                <span>{formatTime(timeRemaining)}</span>
              </div>
            </div>
            <button onClick={reset} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Interview Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-80px)]">
        {/* AI Interviewer Side */}
        <div className="bg-gray-800 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8">
            <AIAnimation isActive={isAISpeaking} />
          </div>

          {/* Question Display */}
          <div className="p-6 bg-gray-700">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-200">Current Question:</h3>
              <p className="text-xl text-white leading-relaxed">{sampleQuestions[currentQuestion]}</p>
            </div>
          </div>
        </div>

        {/* User Side */}
        <div className="bg-gray-900 flex flex-col">
          <div className="flex-1 p-8">
            <UserVideo isRecording={isRecording} />
          </div>

          {/* Controls */}
          <div className="p-6 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestion === totalQuestions - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <button
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRecording ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isRecording ? (
                  <>
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Start Recording
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
