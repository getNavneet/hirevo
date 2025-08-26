import { useInterviewStore } from "./store/interview.store"
import CategoryCard from "./components/CategoryCard"
import SubcategorySelector from "./components/SubcategorySelector"
import LevelSelector from "./components/LevelSelector"
import ResumeUploader from "./components/ResumeUploader"
import InterviewRoom from "./components/InterviewRoom"
import Header from "../components/Header/Headersimple"
import Footer from "../components/Footer/Footer"

const categories = [
  {
    id: "programming",
    icon: "💻",
    title: "Programming Language",
    subtitle: "Test your coding skills in various languages",
    buttonText: "Select Language",
  },
  {
    id: "cs",
    icon: "🧠",
    title: "Core CS Subjects",
    subtitle: "Data structures, algorithms, and computer science fundamentals",
    buttonText: "Select Subject",
  },
  {
    id: "resume",
    icon: "📄",
    title: "Resume-Based Interview",
    subtitle: "Questions tailored to your experience and background",
    buttonText: "Upload Resume",
  },
  {
    id: "personal",
    icon: "👤",
    title: "Personal (HR/Behavioral)",
    subtitle: "Behavioral questions and soft skills assessment",
    buttonText: "Start Practice",
  },
]

function App() {
  const {
    currentStep,
    selectedCategory,
    selectedSubcategory,
    setStep,
    setCategory,
    setSubcategory,
    setLevel,
    setResume,
    startInterview,
    reset,
  } = useInterviewStore()

  const handleCategorySelect = (categoryId) => {
    setCategory(categoryId)

    if (categoryId === "personal") {
      startInterview()
    } else if (categoryId === "resume") {
      setStep("upload")
    } else {
      setStep("subcategory")
    }
  }

  const handleSubcategorySelect = (subcategory) => {
    setSubcategory(subcategory)
    setStep("level")
  }

  const handleLevelSelect = (level) => {
    setLevel(level)
    startInterview()
  }

  const handleResumeUpload = (file) => {
    setResume(file)
  }

  const handleStartResumeInterview = () => {
    startInterview()
  }

  const handleBack = () => {
    if (currentStep === "subcategory") {
      setStep("category")
    } else if (currentStep === "level") {
      setStep("subcategory")
    } else if (currentStep === "upload") {
      setStep("category")
    }
  }

  if (currentStep === "interview") {
    return <InterviewRoom />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header/>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentStep === "category" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">Choose Your Interview Type</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Select the type of interview you'd like to practice. Each category is designed to help you improve
                specific skills.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  icon={category.icon}
                  title={category.title}
                  subtitle={category.subtitle}
                  buttonText={category.buttonText}
                  onClick={() => handleCategorySelect(category.id)}
                />
              ))}
            </div>
          </div>
        )}

        {currentStep === "subcategory" && (
          <SubcategorySelector category={selectedCategory} onSelect={handleSubcategorySelect} onBack={handleBack} />
        )}

        {currentStep === "level" && <LevelSelector onSelect={handleLevelSelect} onBack={handleBack} />}

        {currentStep === "upload" && (
          <ResumeUploader onUpload={handleResumeUpload} onBack={handleBack} onStart={handleStartResumeInterview} />
        )}
      </main>

      {/* Footer */}
     <Footer/>
    </div>
  )
}

export default App
