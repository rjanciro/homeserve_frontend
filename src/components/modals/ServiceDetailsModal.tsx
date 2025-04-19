import React, { useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt, FaClock, FaTag, FaMoneyBillWave, FaCalendarAlt, FaPhoneAlt, FaStar, FaInfoCircle } from 'react-icons/fa';
import { Service } from '../services/service.service';

interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  housekeeper: {
    id: string;
    name: string;
    image?: string;
    rating?: number;
    reviewCount?: number;
  } | null;
  getProfileImageUrl: (imagePath: string | undefined) => string;
  getServiceImageUrl: (imagePath: string | undefined) => string | null;
  onBookService: () => void;
}

const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  isOpen,
  onClose,
  service,
  housekeeper,
  getProfileImageUrl,
  getServiceImageUrl,
  onBookService
}) => {
  if (!isOpen || !service || !housekeeper) return null;

  // Add body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Get days of availability
  const availableDays = Object.entries(service.availability)
    .filter(([key, value]) => value === true && key !== 'startTime' && key !== 'endTime')
    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
    .join(', ');

  // Get service image
  const serviceImageUrl = service.image ? getServiceImageUrl(service.image) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden">
      {/* Backdrop with blur effect */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-hidden animate-modalEntry flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Service Image Header with gradient overlay */}
          <div className="relative">
            {serviceImageUrl ? (
              <div className="w-full h-56 overflow-hidden">
                <img 
                  src={serviceImageUrl} 
                  alt={service.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              </div>
            ) : (
              <div className="w-full h-24 bg-gradient-to-r from-blue-100 to-blue-50"></div>
            )}
            
            {/* Close button - floating */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 hover:scale-105 z-10"
              aria-label="Close modal"
            >
              <FaTimes size={16} />
            </button>
            
            {/* Service title and category overlaid on image */}
            {serviceImageUrl && (
              <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                <h1 className="text-2xl font-bold mb-2 drop-shadow-md">{service.name}</h1>
                <div className="flex items-center flex-wrap gap-2">
                  <span className='inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm'>
                    <FaTag className="mr-1 opacity-70" size={12}/> {service.category}
                  </span>
                  <span className='inline-flex items-center bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm'>
                    <FaClock className="mr-1 opacity-70" size={12}/> {service.estimatedCompletionTime}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Content area */}
          <div className="px-6 py-5 overflow-y-auto flex-1">
            {/* Service Title and Category (visible if no image) */}
            {!serviceImageUrl && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h1>
                <div className="flex items-center flex-wrap gap-2">
                  <span className='inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm'>
                    <FaTag className="mr-1 text-gray-500" size={12}/> {service.category}
                  </span>
                  <span className='inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm'>
                    <FaClock className="mr-1" size={12}/> {service.estimatedCompletionTime}
                  </span>
                </div>
              </div>
            )}
            
            {/* Housekeeper Info Card */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={getProfileImageUrl(housekeeper.image)}
                    alt={housekeeper.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
                  />
                  {housekeeper.rating !== undefined && (
                    <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-sm">
                      {housekeeper.rating.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-800 text-lg">{housekeeper.name}</h3>
                  {housekeeper.reviewCount !== undefined && (
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < Math.round(housekeeper.rating || 0) ? "text-amber-400" : "text-gray-200"}
                            size={12}
                          />
                        ))}
                      </div>
                      <span className="ml-1 text-xs">
                        ({housekeeper.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Description</h3>
              <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-100">{service.description}</p>
            </div>
            
            {/* Service Tags */}
            {service.tags && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {service.tags.split(',').map((tag, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-100"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Service Details Cards */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-700 mr-3">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="font-medium text-gray-800">{service.serviceLocation}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-green-100 text-green-700 mr-3">
                    <FaMoneyBillWave />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="font-bold text-green-600 text-lg">₱{service.price}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-700 mr-3">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Availability</p>
                    <p className="font-medium text-gray-800">{availableDays || 'No days specified'}</p>
                    <p className="text-sm text-gray-600">{service.availability.startTime} - {service.availability.endTime}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-amber-100 text-amber-700 mr-3">
                    <FaPhoneAlt />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact</p>
                    <p className="font-medium text-gray-800">{service.contactNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 sticky bottom-0 left-0 right-0 mt-auto">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-white border border-gray-300 text-gray-800 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm flex items-center justify-center"
              >
                <FaInfoCircle className="mr-2 text-gray-600" />
                <span>Close</span>
              </button>
              <button
                onClick={onBookService}
                className="flex-1 bg-gradient-to-r from-[#133E87] to-[#1a4c9e] text-white px-4 py-3 rounded-xl hover:from-[#0f2f66] hover:to-[#1a4c9e] transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <span className="mr-2">Book This Service</span>
                <FaCalendarAlt className="text-white/80" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsModal; 