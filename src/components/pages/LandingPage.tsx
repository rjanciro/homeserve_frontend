import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBroom, FaArrowRight, FaCheckCircle, FaStar, FaUserCheck, FaUtensils, FaBaby, FaTshirt, FaHandSparkles, FaBars, FaTimes } from 'react-icons/fa';

interface ServiceCardProps {
  icon: React.ReactElement;
  title: string;
  description: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description }) => (
  <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100">
    <div className="text-3xl sm:text-4xl mb-4 sm:mb-6 text-[#133E87] flex justify-center">{icon}</div>
    <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{title}</h3>
    <p className="text-gray-600 text-sm sm:text-base">{description}</p>
  </div>
);

interface ServicesProps {
  services: Array<{name: string, description: string, icon: React.ReactElement}>;
}

const Services: React.FC<ServicesProps> = ({ services }) => {
  return (
    <section className="py-12 sm:py-16 md:py-20" id="services">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-[#133E87] font-semibold text-sm sm:text-base">Our Services</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3 sm:mb-4">Housekeeping Services We Offer</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">Choose from our range of professional housekeeping services delivered by verified and trustworthy housekeepers.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.name}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
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
          <a href="#services" className="text-gray-600 hover:text-[#133E87] transition-colors text-sm lg:text-base font-medium">Services</a>
          <a href="#how-it-works" className="text-gray-600 hover:text-[#133E87] transition-colors text-sm lg:text-base font-medium">How It Works</a>
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
            href="#services" 
            className="text-gray-600 hover:text-[#133E87] transition-colors py-2 border-b border-gray-100 font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Services
          </a>
          <a 
            href="#how-it-works" 
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

const Hero: React.FC = () => {
  return (
    <div className="pt-20 sm:pt-28 md:pt-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16 pb-16 sm:pb-20 md:pb-32">
        <div className="flex flex-col lg:flex-row items-center">
          {/* Homeowner section (left side) */}
          <div className="w-full lg:w-1/2 lg:pr-8 mb-10 lg:mb-0">
            <span className="bg-[#E0E0E0] text-[#133E87] px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium inline-block mb-2 sm:mb-4">Housekeeping Service Platform</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2 sm:mt-4 mb-4 sm:mb-6 leading-tight">
              Your Home, <span className="text-[#133E87]">Always Clean</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              Book trusted housekeepers for one-time cleaning or hire them long-term. Whether you need a single deep clean or regular household help, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link to="/signup" className="bg-[#133E87] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-[#1F5CD1] inline-block text-center font-medium shadow-lg hover:shadow-xl transition-all text-sm sm:text-base">
                Find a Housekeeper
              </Link>
              <a href="#how-it-works" className="border border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:border-[#1F5CD1] inline-block text-center font-medium transition-all text-sm sm:text-base mt-2 sm:mt-0">
                Learn How It Works
              </a>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87] flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Book one-time cleaning services</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87] flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Hire housekeepers long-term</span>
              </div>
            </div>
          </div>
          
          {/* Housekeeper section (right side) */}
          <div className="w-full lg:w-1/2 lg:pl-8 bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
              Are you a housekeeper looking for work?
            </h2>
            <ul className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
              <li className="flex items-start">
                <FaCheckCircle className="text-[#133E87] mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Connect with homeowners in your area</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-[#133E87] mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Find regular cleaning opportunities</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-[#133E87] mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Manage your schedule efficiently</span>
              </li>
              <li className="flex items-start">
                <FaCheckCircle className="text-[#133E87] mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base">Build lasting relationships with homeowners</span>
              </li>
            </ul>
            <Link to="/signup?type=housekeeper" className="bg-[#133E87] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-[#137D13] flex items-center justify-center max-w-xs font-medium shadow-lg hover:shadow-xl transition-all text-sm sm:text-base">
              Join as Housekeeper <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const HowItWorks: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <span className="text-[#133E87] font-semibold text-sm sm:text-base">Simple Process</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3 sm:mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">Choose between one-time services or long-term hiring</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[#133E87] text-lg sm:text-xl font-bold mx-auto mb-4 sm:mb-6">1</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Browse Profiles</h3>
            <p className="text-gray-600 text-sm sm:text-base">View profiles, ratings, and experience of verified housekeepers in your area.</p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[#133E87] text-lg sm:text-xl font-bold mx-auto mb-4 sm:mb-6">2</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Choose Service Type</h3>
            <p className="text-gray-600 text-sm sm:text-base">Select between one-time cleaning or long-term hiring with custom schedules.</p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[#133E87] text-lg sm:text-xl font-bold mx-auto mb-4 sm:mb-6">3</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Book & Schedule</h3>
            <p className="text-gray-600 text-sm sm:text-base">Book your preferred housekeeper and set up your desired schedule.</p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[#133E87] text-lg sm:text-xl font-bold mx-auto mb-4 sm:mb-6">4</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Enjoy Clean Home</h3>
            <p className="text-gray-600 text-sm sm:text-base">Get professional cleaning service with the flexibility that suits your needs.</p>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-gray-50 p-6 sm:p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-[#133E87]">One-Time Service</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-[#133E87] mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Perfect for occasional deep cleaning</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-[#133E87] mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">No long-term commitment</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-[#133E87] mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Flexible scheduling</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-6 sm:p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-[#133E87]">Long-Term Hiring</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-[#133E87] mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Regular scheduled cleaning</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-[#133E87] mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Build a lasting relationship</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-[#133E87] mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Consistent service quality</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTA: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-[#133E87] to-[#5B9BD5] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Ready to get started?</h2>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto">Join thousands of satisfied homeowners using HomeServe for reliable housekeeping services</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup" className="bg-white text-[#133E87] px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-gray-100 inline-block font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base">
            Sign Up as Homeowner
          </Link>
          <Link to="/signup?type=housekeeper" className="bg-transparent text-white border-2 border-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-white/10 inline-block font-semibold transition-all text-sm sm:text-base mt-2 sm:mt-0">
            Register as Housekeeper
          </Link>
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
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
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">General Cleaning</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Deep Cleaning</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Laundry</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Cooking</a></li>
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
  );
};

const LandingPage: React.FC = () => {
  const services = [
    {
      name: 'General Cleaning',
      icon: <FaBroom size={28} />,
      description: 'Regular cleaning services to keep your home tidy and dust-free'
    },
    {
      name: 'Deep Cleaning',
      icon: <FaHandSparkles size={28} />,
      description: 'Thorough cleaning for stubborn dirt and hard-to-reach areas'
    },
    {
      name: 'Laundry',
      icon: <FaTshirt size={28} />,
      description: 'Washing, ironing, and folding services for your clothes'
    },
    {
      name: 'Cooking',
      icon: <FaUtensils size={28} />,
      description: 'Home-cooked meals prepared fresh in your kitchen'
    },
    {
      name: 'Childcare',
      icon: <FaBaby size={28} />,
      description: 'Reliable childcare services while you focus on other tasks'
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="bg-gradient-to-r from-white to-[#F2F2F2]">
        <Hero />
        <Services services={services} />
      </div>
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
