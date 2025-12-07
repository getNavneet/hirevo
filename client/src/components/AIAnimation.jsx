export default function AIAnimation({ isActive }) {
  return (
    <div className="relative">
      {/* Main AI Avatar Circle */}
      <div
        className={`w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center transition-all duration-300 ${
          isActive ? "scale-110 shadow-lg shadow-blue-500/50" : "scale-100"
        }`}
      >
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      </div>

      {/* Animated Rings */}
      {isActive && (
        <>
          <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-blue-400/30 animate-ping"></div>
          <div
            className="absolute inset-0 w-32 h-32 rounded-full border-2 border-purple-400/30 animate-ping"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </>
      )}

      {/* Status Indicator */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isActive ? "bg-green-500 text-white" : "bg-gray-600 text-gray-300"
          }`}
        >
          {isActive ? "Speaking..." : "Listening"}
        </div>
      </div>
    </div>
  )
}
