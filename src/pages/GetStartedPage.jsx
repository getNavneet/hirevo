import { useInterviewStore } from "../store/interview.store"
import CategoryCard from "../components/CategoryCard"
import SubcategorySelector from "../components/SubcategorySelector"
import LevelSelector from "../components/LevelSelector"
import ResumeUploader from "../components/ResumeUploader"
import { s } from "framer-motion/client"

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

function GetStartedPage() {
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
     setStep("level")
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
    console.log(level)
    setStep("interview")  
    //from this we will render interviewRoom if step is not interview dont open interviewRoom as level selection is always a last step
    // console.log("currentStep", currentStep)
  }

  const handleResumeUpload = (file) => {
    setResume(file)
    setStep("level")
  }

  // const handleStartResumeInterview = () => {
  //   startInterview()
  // }

  const handleBack = () => {
    if (currentStep === "subcategory") {
      setStep("category")
    } else if (currentStep === "level") {
      if(setCategory == 'programming' || setCategory == 'cs'){
        setStep("subcategory")
      }
      else{
        setStep("category")
      }
    } else if (currentStep === "upload") {
      setStep("category")
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content with header spacing */}
      <main className="max-w-6xl mx-auto px-4 pt-20 lg:pt-24 pb-8">
        {currentStep === "category" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Choose Your Interview Type</h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
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

        {currentStep === "level" && <LevelSelector category={selectedCategory} onSelect={handleLevelSelect} onBack={handleBack} />}

        {currentStep === "upload" && (
          <ResumeUploader onUpload={handleResumeUpload} onBack={handleBack} 
          />

          //the problem we are getting that the pages goes blank after selecting the level is because after selecting the level our 'currentStep' variable is getting changes and we dont have anything else to dispaly because on this page we are conditionally displaying the components like when 'currentStep' is category we have caterogyCard dispaly component, when we have 'currentStep' is sub-category we are displaying sub-category card but after selecting level we dont have anything to dispaly
        )}

      </main>
    </div>
  )
}

export default GetStartedPage;