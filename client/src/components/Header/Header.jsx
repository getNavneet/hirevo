import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react"; 

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isDarkPage, setIsDarkPage] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // useEffect(() => {
  //   const handleScroll = () => setScrolled(window.scrollY > 50);
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

   useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);  //true if scroll is more than 50
    };

    // Detect if current page has dark background
    const checkPageBackground = () => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const bgColor = computedStyle.backgroundColor;
      // Add logic to determine if page is dark
      setIsDarkPage(window.location.pathname === '/');
    };

    window.addEventListener('scroll', handleScroll);
    checkPageBackground();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  

  return (
    <motion.header
      className={`fixed top-0 left-0 w-full flex justify-between items-center px-6 md:px-10 py-4 md:py-6 z-50 transition-all duration-500
        ${scrolled ? "bg-white/10 backdrop-blur-3xl shadow-md" : "bg-transparent"}`}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Logo */}
      <h1 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
        HireVo
      </h1>

      {/* Desktop Navigation */}
      <nav className={`hidden md:flex gap-8 font-medium ${scrolled ? "text-gray-800" : "text-white"}`}>
        <a href="#features" className="hover:text-indigo-500 transition">Features</a>
        <a href="#pricing" className="hover:text-indigo-500 transition">Pricing</a>
        <a href="#about" className="hover:text-indigo-500 transition">About</a>
      </nav>

      {/* CTA Desktop */}
      <div className="hidden md:block">
        <button className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                           text-white rounded-xl shadow-md hover:opacity-90 transition">
          Get Started
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-white"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          className="absolute top-0 right-0 w-3/4 h-screen bg-white shadow-lg flex flex-col items-center pt-20 gap-6 md:hidden"
        >
          <a href="#features" onClick={() => setMenuOpen(false)} className="text-lg font-semibold text-gray-800">
            Features
          </a>
          <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-lg font-semibold text-gray-800">
            Pricing
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)} className="text-lg font-semibold text-gray-800">
            About
          </a>
          <button
            onClick={() => setMenuOpen(false)}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                       text-white rounded-xl shadow-md hover:opacity-90 transition"
          >
            Get Started
          </button>
        </motion.div>
      )}
    </motion.header>
  );
}
