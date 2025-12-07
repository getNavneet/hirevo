import { useState, useRef, useEffect } from "react"

export default function UserVideo({ isRecording }) {
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      streamRef.current = stream
      setHasPermission(true)
      setError(null)
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.")
      setHasPermission(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-gray-400">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Camera Access Required</p>
            <p className="text-gray-400 text-sm mt-2">{error}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">REC</span>
        </div>
      )}

      {/* User Info Overlay */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg">
        <span className="text-sm">You</span>
      </div>
    </div>
  )
}
