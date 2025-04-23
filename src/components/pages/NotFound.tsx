import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6">
      <div className="text-center">
        <h1 className="text-8xl sm:text-9xl font-bold text-[#133E87]">404</h1>
        <h2 className="mt-4 text-xl sm:text-2xl font-semibold text-gray-800">Page Not Found</h2>
        <p className="mt-2 text-gray-600 max-w-md mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/" 
            className="px-5 py-3 flex items-center gap-2 rounded-full bg-[#133E87] text-white hover:bg-[#1F5CD1] transition-colors w-full sm:w-auto justify-center"
          >
            <FaHome /> Back to Home
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="px-5 py-3 flex items-center gap-2 rounded-full border border-gray-300 text-gray-700 hover:border-[#1F5CD1] transition-all w-full sm:w-auto justify-center"
          >
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 