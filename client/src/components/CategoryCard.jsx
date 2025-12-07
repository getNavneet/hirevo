export default function CategoryCard({ icon, title, subtitle, buttonText, onClick }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-200">
      <div className="text-center space-y-4">
        <div className="text-4xl">{icon}</div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{subtitle}</p>
        </div>
        <button
          onClick={onClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}
