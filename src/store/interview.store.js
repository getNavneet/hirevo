import { create } from "zustand"

export const useInterviewStore = create((set) => ({
  // Current step in the flow
  currentStep: "category", // 'category', 'subcategory', 'level', 'upload', 'interview'

  // Selected options
  selectedCategory: null,
  selectedSubcategory: null,  //
  selectedLevel: null,
  uploadedResume: null,
  isInterviewActive: false,
  // currentQuestion: 0,
  // totalQuestions: 5,
  // timeRemaining: 1800, // 30 minutes in seconds
  isRecording: false,

  // Actions
  setStep: (step) => set({ currentStep: step }),
  setCategory: (category) => set({ selectedCategory: category }),
  setSubcategory: (subcategory) => set({ selectedSubcategory: subcategory }),
  setLevel: (level) => set({ selectedLevel: level }),
  setResume: (resume) => set({ uploadedResume: resume }),

  startInterview: () =>
    set({
      currentStep: "interview",
      isInterviewActive: true,
      // currentQuestion: 0,
      // timeRemaining: 1800,
    }),

  // nextQuestion: () =>
  //   set((state) => ({
  //     currentQuestion: Math.min(state.currentQuestion + 1, state.totalQuestions - 1),
  //   })),

  // prevQuestion: () =>
  //   set((state) => ({
  //     currentQuestion: Math.max(state.currentQuestion - 1, 0),
  //   })),

  toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),

  // updateTimer: () =>
  //   set((state) => ({
  //     timeRemaining: Math.max(state.timeRemaining - 1, 0),
  //   })),

  reset: () =>
    set({
      currentStep: "category",
      selectedCategory: null,
      selectedSubcategory: null,
      selectedLevel: null,
      uploadedResume: null,
      isInterviewActive: false,
      // currentQuestion: 0,
      // timeRemaining: 1800,
      isRecording: false,
    }),
}))
