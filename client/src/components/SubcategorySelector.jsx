
const subcategories = {
  programming: [
    { id: "javascript", name: "JavaScript", description: "ES6+, async/await, closures" },
    { id: "python", name: "Python", description: "Data structures, OOP, libraries" },
    { id: "java", name: "Java", description: "OOP, collections, multithreading" },
    { id: "cpp", name: "C++", description: "Memory management, STL, algorithms" },
    { id: "react", name: "React", description: "Hooks, state management, components" },
    { id: "nodejs", name: "Node.js", description: "Express, APIs, async programming" },
  ],
  core: [
    { id: "dsa", name: "Data Structures & Algorithms", description: "Arrays, trees, graphs, sorting" },
    { id: "system-design", name: "System Design", description: "Scalability, databases, architecture" },
    { id: "os", name: "Operating Systems", description: "Processes, memory, file systems" },
    { id: "networks", name: "Computer Networks", description: "TCP/IP, HTTP, protocols" },
    { id: "databases", name: "Databases", description: "SQL, NoSQL, indexing, transactions" },
    { id: "security", name: "Cybersecurity", description: "Encryption, authentication, vulnerabilities" },
  ],
}

export default function SubcategorySelector({ category, onSelect, onBack }) {
  const items = subcategories[category] || []

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
        <h2 className="text-3xl font-bold text-gray-900">Choose Your Focus Area</h2>
        <p className="text-lg text-gray-600">Select the specific topic you'd like to practice</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-200 text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
            <p className="text-gray-600 text-sm">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
