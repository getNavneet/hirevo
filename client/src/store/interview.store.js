import { create } from "zustand"

export const useInterviewStore = create((set) => ({
  currentStep: "category", // 'category', 'subcategory', 'level', 'upload', 'interview'
  selectedCategory: null,
  selectedSubcategory: null,  //
  selectedLevel: null,
  uploadedResume: null,
  isInterviewActive: false,
  isRecording: false,
  sessionID: null,
  // Actions
  setStep: (step) => set({ currentStep: step }),
  setCategory: (category) => set({ selectedCategory: category }),
  setSubcategory: (subcategory) => set({ selectedSubcategory: subcategory }),
  setLevel: (level) => set({ selectedLevel: level }),
  setResume: (resume) => set({ uploadedResume: resume }),
  setSessionID: (id) => set({ sessionID: id }),
  startInterview: () =>
    set({
      currentStep: "interview",
      isInterviewActive: true,

    }),

  toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),

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
