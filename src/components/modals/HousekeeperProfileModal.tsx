import React, { useEffect, useState } from 'react';
import { FaMapMarkerAlt, FaUser, FaCertificate, FaCheck, FaCalendar, FaStar, FaTools, FaTimes, FaBriefcase, FaQuoteLeft, FaInfoCircle } from 'react-icons/fa';
import { Service } from '../services/service.service';

// Define types
interface HousekeeperReview {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  date: string;
}

export interface Housekeeper {
  id: string;
  name: string;
  location: string;
  availability?: string;
  rating: number;
  reviewCount: number;
  image?: string;
  certifications?: string[];
  reviews?: HousekeeperReview[];
  services: Service[];
  isActive?: boolean;
  bio?: string;
  experience?: string;
  specialties?: string;
}

interface HousekeeperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  housekeeper: Housekeeper;
  onBookService: (service: Service) => void;
  onViewServiceDetails: (service: Service) => void;
  getProfileImageUrl: (imagePath: string | undefined) => string;
}

const HousekeeperProfileModal: React.FC<HousekeeperProfileModalProps> = ({
  isOpen,
  onClose,
  housekeeper,
  onBookService,
  onViewServiceDetails,
  getProfileImageUrl
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'reviews'>('services');
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-modalEntry">
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-50 overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 hover:scale-105 z-10"
            aria-label="Close modal"
          >
            <FaTimes size={16} />
          </button>
          
          <div className="absolute bottom-0 left-0 w-full transform translate-y-1/3 px-8 flex items-end">
            <div className="relative mr-5">
              <div className="w-32 h-32 rounded-full bg-white shadow-lg p-1 overflow-hidden">
                <img 
                  src={getProfileImageUrl(housekeeper.image)} 
                  alt={housekeeper.name} 
                  className="w-full h-full object-cover rounded-full" 
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
                />
              </div>
              
              {housekeeper.isActive && (
                <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1 border-2 border-white">
                  <FaCheck className="text-white" size={12} />
                </div>
              )}
            </div>
            
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-bold text-gray-900 mt-3">{housekeeper.name}</h2>
              <div className="flex items-center text-amber-500">
                <FaStar className="mr-1" />
                <span className="font-semibold">{housekeeper.rating.toFixed(1)}</span>
                <span className="text-gray-600 ml-1">({housekeeper.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-20 px-8 pb-6">
          {housekeeper.bio && (
            <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
              <div className="flex">
                <FaQuoteLeft className="text-gray-300 text-3xl mr-4 mt-1" />
                <p className="text-gray-700 italic">
                  {housekeeper.bio}
                </p>
              </div>
              
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {housekeeper.experience && (
                  <div className="flex items-start">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                      <FaBriefcase size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Experience</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {housekeeper.experience.split(',').map((exp, i) => (
                          <span key={i} className="text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                            {exp.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {housekeeper.specialties && (
                  <div className="flex items-start">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                      <FaTools size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Specialties</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {housekeeper.specialties.split(',').map((specialty, i) => (
                          <span key={i} className="text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                            {specialty.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {housekeeper.certifications && housekeeper.certifications.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaCertificate className="text-blue-600" /> Certifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {housekeeper.certifications.map(cert => (
                  <span 
                    key={cert} 
                    className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-100"
                  >
                    <FaCheck className="text-blue-500" size={12} />
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="border-b border-gray-200 mb-5">
            <div className="flex space-x-6">
              <button
                className={`pb-3 px-1 ${activeTab === 'services' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                onClick={() => setActiveTab('services')}
              >
                <div className="flex items-center gap-2">
                  <FaTools size={14} />
                  <span>Services</span>
                </div>
              </button>
              <button
                className={`pb-3 px-1 ${activeTab === 'reviews' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                onClick={() => setActiveTab('reviews')}
              >
                <div className="flex items-center gap-2">
                  <FaStar size={14} />
                  <span>Reviews</span>
                  <span className="bg-gray-100 text-gray-700 rounded-full text-xs px-2 py-0.5">
                    {housekeeper.reviewCount}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        <div className="px-8 pb-8 overflow-y-auto max-h-[calc(90vh-22rem)]">
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {housekeeper.services.filter(s => s.isAvailable).map(service => (
                <div key={service._id} className="p-5 border border-gray-100 rounded-xl bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-200 transform hover:-translate-y-1 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.category} • {service.estimatedCompletionTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">₱{service.price}</p>
                    </div>
                  </div>
                  
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                  )}
                  
                  {service.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {service.tags.split(',').map((tag: string, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-auto pt-3">
                    <button
                      onClick={() => onViewServiceDetails(service)}
                      className="flex-1 bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FaInfoCircle size={14} />
                      View Details
                    </button>
                    <button
                      onClick={() => onBookService(service)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FaCalendar size={14} />
                      Book Service
                    </button>
                  </div>
                </div>
              ))}
              
              {housekeeper.services.filter(s => s.isAvailable).length === 0 && (
                <div className="col-span-2 text-center py-10 text-gray-500">
                  This housekeeper has no available services at the moment.
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              {housekeeper.reviews && housekeeper.reviews.length > 0 ? (
                housekeeper.reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900">{review.reviewerName}</p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < review.rating ? "text-amber-400" : "text-gray-200"} 
                            size={16} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                    <p className="text-gray-400 text-xs">{new Date(review.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No reviews yet for this housekeeper.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousekeeperProfileModal;
