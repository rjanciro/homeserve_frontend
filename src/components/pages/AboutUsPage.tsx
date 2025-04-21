import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBroom, FaHandshake, FaStar, FaLightbulb, FaCheckCircle, FaCode, FaArrowRight, FaArrowLeft, FaBars, FaTimes } from 'react-icons/fa';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import RenzProfilePic from '../../assets/images/Anciro_Renz_Joshua_3C.png';

const AboutUsPage: React.FC = () => {
  useDocumentTitle('About Us');

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-white to-[#F2F2F2]">
        {/* Back to Home Button */}
      <div className="container mx-auto px-[5%] pt-28">
        <Link to="/" className="hidden sm:inline-flex items-center text-[#133E87] hover:text-[#3A80D2] transition-colors">
          <FaArrowLeft className="mr-2" />
          <span>Back to Home</span>
        </Link>
      </div>
        <div className="container mx-auto px-[5%] text-center pt-20 pb-20">
          <span className="bg-[#E0E0E0] text-[#133E87] px-4 py-1 rounded-full text-sm font-medium">About Us</span>
          <h1 className="text-[3.5rem] font-bold text-gray-900 mt-6 mb-6 leading-tight">
            About <span className="text-[#133E87]">HomeServe</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Connecting homeowners with trusted housekeepers to make home maintenance simple, reliable, and stress-free.
          </p>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-[5%]">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-12 md:mb-0">
              <span className="text-[#133E87] font-semibold">Our Mission</span>
              <h2 className="text-4xl font-bold mt-2 mb-6">Simplifying Home Services</h2>
              <p className="text-gray-600 text-lg mb-6">
                At HomeServe, I believe maintaining your home should be simple. My mission is to create a seamless connection between homeowners and qualified housekeepers, ensuring every home service experience is reliable, transparent, and satisfying.
              </p>
              <p className="text-gray-600 text-lg">
                I'm transforming the housekeeping industry by building a platform that values quality work, clear communication, and customer satisfaction above all else.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Why HomeServe?
                </h3>
                <ul className="mb-8 space-y-4">
                  <li className="flex items-center">
                    <FaCheckCircle className="text-[#133E87] mr-3" />
                    <span className="text-gray-700">Find reliable housekeepers in your area</span>
                  </li>
                  <li className="flex items-center">
                    <FaCheckCircle className="text-[#133E87] mr-3" />
                    <span className="text-gray-700">Book one-time or recurring cleaning services</span>
                  </li>
                  <li className="flex items-center">
                    <FaCheckCircle className="text-[#133E87] mr-3" />
                    <span className="text-gray-700">Verified and trustworthy housekeepers</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-gradient-to-r from-white to-[#F2F2F2]">
        <div className="container mx-auto px-[5%]">
          <div className="text-center mb-16">
            <span className="text-[#133E87] font-semibold">Our Story</span>
            <h2 className="text-4xl font-bold mt-2 mb-4">How It Started</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              HomeServe was developed as a capstone project at Gordon College, addressing real-world challenges in the home services industry.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 h-full">
              <h3 className="text-2xl font-semibold mb-4 text-[#133E87]">The Academic Challenge</h3>
              <p className="text-gray-600 mb-4">
                As part of my Bachelor of Science in Information Technology program, I was tasked with creating a solution that addresses a significant market need and demonstrates my technical and business skills.
              </p>
              <p className="text-gray-600">
                After researching various industries, I identified the housekeeping sector as one that could greatly benefit from technological innovation and a more streamlined approach to connecting housekeepers with homeowners.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 h-full">
              <h3 className="text-2xl font-semibold mb-4 text-[#133E87]">The Solution</h3>
              <p className="text-gray-600 mb-4">
                I developed HomeServe as a comprehensive platform where homeowners can easily find verified housekeepers, read authentic reviews, and book services with confidence.
              </p>
              <p className="text-gray-600">
                This project allowed me to apply my academic knowledge to a real-world problem while gaining valuable experience in software development, user experience design, and project management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-[5%]">
          <div className="text-center mb-16">
            <span className="text-[#133E87] font-semibold">Our Values</span>
            <h2 className="text-4xl font-bold mt-2 mb-4">What We Stand For</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything I do at HomeServe
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100">
              <div className="text-4xl mb-6 text-[#133E87] flex justify-center">
                <FaHandshake size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trust & Reliability</h3>
              <p className="text-gray-600">
                I verify all housekeepers and maintain high standards for quality and professionalism.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100">
              <div className="text-4xl mb-6 text-[#133E87] flex justify-center">
                <FaStar size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Customer Satisfaction</h3>
              <p className="text-gray-600">
                I prioritize exceptional experiences for both homeowners and housekeepers.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100">
              <div className="text-4xl mb-6 text-[#133E87] flex justify-center">
                <FaLightbulb size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Innovation</h3>
              <p className="text-gray-600">
                I continuously improve the platform to make home services more efficient and accessible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Developer */}
      <section className="py-20 bg-gradient-to-r from-white to-[#F2F2F2]">
        <div className="container mx-auto px-[5%]">
          <div className="text-center mb-16">
            <span className="text-[#133E87] font-semibold">Meet The Developer</span>
            <h2 className="text-4xl font-bold mt-2 mb-4">The Person Behind HomeServe</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              HomeServe is designed, developed, and maintained by a single passionate developer
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-6">
                  <img 
                    src={RenzProfilePic} 
                    alt="Renz Joshua Anciro" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <h3 className="text-2xl font-semibold mb-1">Renz Joshua Anciro</h3>
                <p className="text-[#133E87] font-medium mb-4">Founder & Developer</p>
                <p className="text-gray-600 mb-4 text-center max-w-lg">
                  A passionate developer with a vision to transform the housekeeping industry through technology. Currently completing a Bachelor of Science in Information Technology at Integrated College.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <FaCode className="text-[#133E87]" />
                  <span className="text-gray-700">Full-stack Developer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 bg-gradient-to-r from-[#133E87] to-[#5B9BD5] text-white">
        <div className="container mx-auto px-[5%] text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Join HomeServe for reliable housekeeping services that make your life easier
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-[#133E87] px-8 py-4 rounded-full hover:bg-gray-100 inline-block font-semibold shadow-lg hover:shadow-xl transition-all">
              Sign Up as Homeowner
            </Link>
            <Link to="/signup?type=housekeeper" className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-full hover:bg-white/10 inline-block font-semibold transition-all">
              Register as Housekeeper <FaArrowRight className="ml-2 inline" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 sm:pt-16 pb-6 sm:pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16 lg:gap-20 mb-6 sm:mb-8">
            <div>
              <div className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center">
                HomeServe
              </div>
              <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Connecting homeowners with trusted housekeepers for a cleaner home.</p>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Services</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="/#services" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">General Cleaning</a></li>
                <li><a href="/#services" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Deep Cleaning</a></li>
                <li><a href="/#services" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Laundry</a></li>
                <li><a href="/#services" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Cooking</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Company</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="/about" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">About Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-xs sm:text-sm">
            <p>&copy; {new Date().getFullYear()} HomeServe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'} py-4`}>
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-[#133E87] flex items-center">
          <Link to="/" className="flex items-center">
            <span className="text-3xl mr-2">HomeServe</span>
          </Link>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <a href="/#services" className="text-gray-600 hover:text-[#133E87] transition-colors text-sm lg:text-base font-medium">Services</a>
          <a href="/#how-it-works" className="text-gray-600 hover:text-[#133E87] transition-colors text-sm lg:text-base font-medium">How It Works</a>
          <Link to="/about" className="text-gray-600 hover:text-[#133E87] transition-colors text-sm lg:text-base font-medium">About Us</Link>
          <a href="/login" className="bg-[#133E87] text-white px-5 py-2 rounded-full hover:bg-[#1F5CD1] transition-colors font-medium text-sm lg:text-base">
            Sign In
          </a>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-600 hover:text-[#133E87] transition-colors focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden absolute w-full bg-white shadow-lg transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
          <a 
            href="/#services" 
            className="text-gray-600 hover:text-[#133E87] transition-colors py-2 border-b border-gray-100 font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Services
          </a>
          <a 
            href="/#how-it-works" 
            className="text-gray-600 hover:text-[#133E87] transition-colors py-2 border-b border-gray-100 font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            How It Works
          </a>
          <Link 
            to="/about" 
            className="text-gray-600 hover:text-[#133E87] transition-colors py-2 border-b border-gray-100 font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            About Us
          </Link>
          <a 
            href="/login" 
            className="bg-[#133E87] text-white px-5 py-2 rounded-full hover:bg-[#1F5CD1] transition-colors font-medium text-center mt-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Sign In
          </a>
        </div>
      </div>
    </nav>
  );
};

export default AboutUsPage; 