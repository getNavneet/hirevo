import { useState } from "react"

export default function ResumeUploader({ onUpload, onBack, onStart }) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    if (file.type === "application/pdf" || file.type.includes("document")) {
      setUploadedFile(file)
      onUpload(file)
    } else {
      alert("Please upload a PDF or document file")
    }
  }

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
        <h2 className="text-3xl font-bold text-gray-900">Upload Your Resume</h2>
        <p className="text-lg text-gray-600">
          Upload your resume to get personalized questions based on your experience
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : uploadedFile
                ? "border-green-400 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {uploadedFile ? (
            <div className="space-y-4">
              <div className="text-green-600">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-gray-600">File uploaded successfully</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-gray-400">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">Drag and drop your resume here, or click to browse</p>
                <p className="text-gray-600">Supports PDF, DOC, and DOCX files</p>
              </div>
            </div>
          )}
        </div>

        {uploadedFile && (
          <div className="mt-6 text-center">
            <button
              onClick={onStart}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Start Resume-Based Interview
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
