import React, { useEffect, useState } from 'react';
import { FaMapMarkerAlt, FaUser, FaCertificate, FaCheck, FaCalendar, FaStar, FaTools } from 'react-icons/fa';
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
}

interface HousekeeperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  housekeeper: Housekeeper;
  onBookService: (service: Service) => void;
  getProfileImageUrl: (imagePath: string | undefined) => string;
}

const HousekeeperProfileModal: React.FC<HousekeeperProfileModalProps> = ({
  isOpen,
  onClose,
  housekeeper,
  onBookService,
  getProfileImageUrl
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-0 border-b border-gray-200">
          <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-400">
            <div className="absolute bottom-0 left-6 transform translate-y-1/2 w-24 h-24 rounded-full bg-white p-1 shadow-md">
              <img 
                src={getProfileImageUrl(housekeeper.image)} 
                alt={housekeeper.name} 
                className="w-full h-full object-cover rounded-full" 
                onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
              />
            </div>
            <div className="absolute top-4 right-4">
              <button 
                onClick={onClose}
                className="text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
          </div>
          <div className="pt-16 pb-4 px-6">
            <h2 className="text-2xl font-bold">{housekeeper.name}</h2>
            <div className="flex items-center text-amber-500">
              <FaStar className="mr-1" />
              <span className="font-semibold">{housekeeper.rating}</span>
              <span className="text-gray-600 ml-1">({housekeeper.reviewCount} reviews)</span>
              <span className="mx-2">•</span>
              <span className="text-gray-600">{housekeeper.location}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-7rem)]">
          <div className="mb-8">
            {housekeeper.certifications && housekeeper.certifications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FaCertificate className="text-blue-600" /> Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {housekeeper.certifications.map(cert => (
                    <span 
                      key={cert} 
                      className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <FaCheck className="text-blue-500" size={12} />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaTools className="text-blue-600" /> Available Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {housekeeper.services.filter(s => s.isAvailable).map(service => (
                <div key={service._id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-50/80 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.category} • {service.estimatedCompletionTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-blue-600">₱{service.price}</p>
                      <button
                        onClick={() => onBookService(service)}
                        className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-all text-sm font-medium flex items-center gap-2"
                      >
                        <FaCalendar size={12} />
                        Book Now
                      </button>
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.description}</p>
                  )}
                  {service.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {service.tags.split(',').map((tag: string) => (
                        <span key={tag} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Reviews section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaStar className="text-blue-600" /> Reviews
            </h3>
            {housekeeper.reviews && housekeeper.reviews.length > 0 ? (
              <div className="space-y-4">
                {housekeeper.reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between">
                      <p className="font-medium">{review.reviewerName}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < review.rating ? "text-amber-400" : "text-gray-200"} 
                            size={14} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{review.comment}</p>
                    <p className="text-gray-400 text-xs mt-1">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousekeeperProfileModal;
