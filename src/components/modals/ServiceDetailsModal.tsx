import React from 'react';
import { FaTimes, FaMapMarkerAlt, FaClock, FaTag, FaMoneyBillWave, FaCalendarAlt, FaPhoneAlt } from 'react-icons/fa';
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

  // Get days of availability
  const availableDays = Object.entries(service.availability)
    .filter(([key, value]) => value === true && key !== 'startTime' && key !== 'endTime')
    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
    .join(', ');

  // Get service image
  const serviceImageUrl = service.image ? getServiceImageUrl(service.image) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Service Details</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Service Image */}
            {serviceImageUrl && (
              <div className="mb-6 w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={serviceImageUrl} 
                  alt={service.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            
            {/* Service Title and Category */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h1>
              <div className="flex items-center flex-wrap gap-2">
                <span className='inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded-full'>
                  <FaTag className="mr-1 text-gray-500" size={12}/> {service.category}
                </span>
                <span className='inline-flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-full'>
                  <FaClock className="mr-1" size={12}/> {service.estimatedCompletionTime}
                </span>
              </div>
            </div>
            
            {/* Housekeeper Info */}
            <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
              <img
                src={getProfileImageUrl(housekeeper.image)}
                alt={housekeeper.name}
                className="w-14 h-14 rounded-full object-cover mr-4 border border-gray-200"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
              />
              <div>
                <h3 className="font-semibold text-gray-800">{housekeeper.name}</h3>
                {housekeeper.rating !== undefined && (
                  <div className="flex items-center text-sm text-amber-500">
                    ★ {housekeeper.rating.toFixed(1)}
                    <span className="ml-1 text-gray-500">
                      ({housekeeper.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{service.description}</p>
            </div>
            
            {/* Service Tags */}
            {service.tags && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {service.tags.split(',').map((tag, index) => (
                    <span 
                      key={index} 
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Service Details */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-gray-700">
                <FaMapMarkerAlt className="mr-2 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p>{service.serviceLocation}</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-700">
                <FaMoneyBillWave className="mr-2 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Price</p>
                  <p className="font-semibold text-green-600">₱{service.price}</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-700">
                <FaCalendarAlt className="mr-2 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Availability</p>
                  <p>{availableDays || 'No days specified'}</p>
                  <p className="text-sm">{service.availability.startTime} - {service.availability.endTime}</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-700">
                <FaPhoneAlt className="mr-2 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Contact</p>
                  <p>{service.contactNumber}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="p-6 border-t">
            <button
              onClick={onBookService}
              className="w-full bg-gradient-to-r from-[#133E87] to-[#1a4c9e] text-white px-4 py-3 rounded-lg hover:from-[#0f2f66] hover:to-[#1a4c9e] transition-all font-semibold"
            >
              Book This Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsModal; 