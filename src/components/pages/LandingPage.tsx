import React from 'react';
import { Link } from 'react-router-dom';
import { FaBroom, FaArrowRight, FaCheckCircle, FaStar, FaUserCheck, FaUtensils, FaBaby, FaTshirt, FaHandSparkles } from 'react-icons/fa';
import Logo from '../../assets/icons/HomeServe_Transparent_Logo.png';

interface ServiceCardProps {
  icon: React.ReactElement;
  title: string;
  description: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-xl shadow-lg text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100">
    <div className="text-4xl mb-6 text-[#133E87] flex justify-center">{icon}</div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

interface ServicesProps {
  services: Array<{name: string, description: string, icon: React.ReactElement}>;
}

const Services: React.FC<ServicesProps> = ({ services }) => {
  return (
    <section className="pt-35 pb-16" id="services">
      <div className="container mx-auto px-[5%]">
        <div className="text-center mb-12">
          <span className="text-[#133E87] font-semibold">Our Services</span>
          <h2 className="text-4xl font-bold mt-2 mb-4">Housekeeping Services We Offer</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Choose from our range of professional housekeeping services delivered by verified and trustworthy housekeepers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
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
  return (
    <nav className="fixed w-full bg-white z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-[#133E87] flex items-center">
          <span className="text-3xl mr-2">HomeServe</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#services" className="text-gray-600 hover:text-gray-900 transition-colors">Services</a>
          <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
          <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">About Us</Link>
          <a href="/login" className="bg-[#133E87] text-white px-6 py-2 rounded-full hover:bg-[#3A80D2] transition-colors font-medium">
            Login
          </a>
        </div>
        <button className="md:hidden text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

const Hero: React.FC = () => {
  return (
    <div className="pt-40">
      <div className="container mx-auto px-[5%] pt-20 pb-32">
        <div className="flex flex-wrap items-center">
          {/* Homeowner section (left side) */}
          <div className="w-full md:w-1/2 pr-4 mb-12 md:mb-0">
            <span className="bg-[#E0E0E0] text-[#133E87] px-4 py-1 rounded-full text-sm font-medium">Housekeeping Service Platform</span>
            <h1 className="text-[3.5rem] font-bold text-gray-900 mt-6 mb-6 leading-tight">
              Your Home, <span className="text-[#133E87]">Always Clean</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Book trusted housekeepers for one-time cleaning or hire them long-term. Whether you need a single deep clean or regular household help, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="bg-[#133E87] text-white px-8 py-4 rounded-full hover:bg-[#1F5CD1] inline-block text-center font-medium shadow-lg hover:shadow-xl transition-all">
                Find a Housekeeper
              </Link>
              <a href="#how-it-works" className="border border-gray-300 text-gray-700 px-8 py-4 rounded-full hover:border-[#1F5CD1] inline-block text-center font-medium transition-all">
                Learn How It Works
              </a>
            </div>
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87]" />
                <span className="text-gray-700">Book one-time cleaning services</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87]" />
                <span className="text-gray-700">Hire housekeepers long-term</span>
              </div>
            </div>
          </div>
          
          {/* Housekeeper section (right side) */}
          <div className="w-full md:w-1/2 pl-4 md:pl-16 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Are you a housekeeper looking for work?
            </h2>
            <ul className="mb-8 space-y-4">
              <li className="flex items-center">
                <FaCheckCircle className="text-[#133E87] mr-3" />
                <span className="text-gray-700">Connect with homeowners in your area</span>
              </li>
              <li className="flex items-center">
                <FaCheckCircle className="text-[#133E87] mr-3" />
                <span className="text-gray-700">Find regular cleaning opportunities</span>
              </li>
              <li className="flex items-center">
                <FaCheckCircle className="text-[#133E87] mr-3" />
                <span className="text-gray-700">Manage your schedule efficiently</span>
              </li>
              <li className="flex items-center">
                <FaCheckCircle className="text-[#133E87] mr-3" />
                <span className="text-gray-700">Build lasting relationships with homeowners</span>
              </li>
            </ul>
            <Link to="/signup?type=housekeeper" className="bg-[#133E87] text-white px-8 py-4 rounded-full hover:bg-[#137D13] flex items-center justify-center max-w-xs font-medium shadow-lg hover:shadow-xl transition-all">
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
    <section className="py-24 bg-white" id="how-it-works">
      <div className="container mx-auto px-[5%]">
        <div className="text-center mb-16">
          <span className="text-[#133E87] font-semibold">Simple Process</span>
          <h2 className="text-4xl font-bold mt-2 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Choose between one-time services or long-term hiring</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[#133E87] text-xl font-bold mx-auto mb-6">1</div>
            <h3 className="text-xl font-semibold mb-3">Browse Profiles</h3>
            <p className="text-gray-600">View profiles, ratings, and experience of verified housekeepers in your area.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[#133E87] text-xl font-bold mx-auto mb-6">2</div>
            <h3 className="text-xl font-semibold mb-3">Choose Service Type</h3>
            <p className="text-gray-600">Select between one-time cleaning or long-term hiring with custom schedules.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[#133E87] text-xl font-bold mx-auto mb-6">3</div>
            <h3 className="text-xl font-semibold mb-3">Book & Schedule</h3>
            <p className="text-gray-600">Book your preferred housekeeper and set up your desired schedule.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[#133E87] text-xl font-bold mx-auto mb-6">4</div>
            <h3 className="text-xl font-semibold mb-3">Enjoy Clean Home</h3>
            <p className="text-gray-600">Get professional cleaning service with the flexibility that suits your needs.</p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <h3 className="text-2xl font-semibold mb-4 text-[#133E87]">One-Time Service</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87]" />
                <span>Perfect for occasional deep cleaning</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87]" />
                <span>No long-term commitment</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87]" />
                <span>Flexible scheduling</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <h3 className="text-2xl font-semibold mb-4 text-[#133E87]">Long-Term Hiring</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87]" />
                <span>Regular scheduled cleaning</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87]" />
                <span>Build a lasting relationship</span>
              </li>
              <li className="flex items-center gap-2">
                <FaCheckCircle className="text-[#133E87]" />
                <span>Consistent service quality</span>
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
    <section className="py-20 bg-gradient-to-r from-[#133E87] to-[#5B9BD5] text-white">
      <div className="container mx-auto px-[5%] text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
        <p className="text-xl mb-10 max-w-2xl mx-auto">Join thousands of satisfied homeowners using HomeServe for reliable housekeeping services</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup" className="bg-white text-[#133E87] px-8 py-4 rounded-full hover:bg-gray-100 inline-block font-semibold shadow-lg hover:shadow-xl transition-all">
            Sign Up as Homeowner
          </Link>
          <Link to="/signup?type=housekeeper" className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-full hover:bg-white/10 inline-block font-semibold transition-all">
            Register as Housekeeper
          </Link>
        </div>
        <div className="mt-10 flex items-center justify-center space-x-6">
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-[5%]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-40 mb-7">
          <div>
            <div className="text-2xl font-bold mb-6 flex items-center">
              HomeServe
            </div>
            <p className="text-gray-400 mb-6">Connecting homeowners with trusted housekeepers for a cleaner home.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Services</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">General Cleaning</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Deep Cleaning</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Laundry</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cooking</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">Company</h3>
            <ul className="space-y-3">
              <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
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
