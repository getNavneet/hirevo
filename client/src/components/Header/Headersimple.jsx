  
  function Header() {
    return (
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-blue-600">Hirevo</h1>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Practice
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Progress
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                Help
              </a>
            </nav>
          </div>
        </div>
      </header>
    );
  }
  
  export default Header;
  
  
  
  
  
  