import React, { useState } from 'react';
import { FaTimes, FaStar, FaMapMarkerAlt, FaPhone, FaClock, FaCommentAlt, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface ServiceProvider {
  id: string;
  _id?: string;
  providerId?: string;
  name: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  image: string;
  category: string;
  description: string;
  serviceLocation: string;
  providerName: string;
  businessName?: string;
  contactNumber?: string;
  estimatedCompletionTime?: string;
  pricingType: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ServiceProvider;
  onBookNow: () => void;
}

const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  provider,
  onBookNow 
}) => {
  const navigate = useNavigate();
  
  // Mock reviews data - in a real app, this would come from the API
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      userName: 'John Smith',
      rating: 5,
      comment: 'Excellent service! Very professional and completed the job quickly.',
      date: '2023-10-15'
    },
    {
      id: '2',
      userName: 'Maria Garcia',
      rating: 4,
      comment: 'Good work overall. Would hire again for future projects.',
      date: '2023-09-28'
    },
    {
      id: '3',
      userName: 'David Wong',
      rating: 5,
      comment: 'Very responsive and skilled. Highly recommended!',
      date: '2023-09-05'
    }
  ]);

  const handleMessageProvider = () => {
    // Close the modal
    onClose();
    
    // Use the providerId property if available, otherwise fall back to id
    const providerId = provider.providerId || provider._id || provider.id;
    
    if (!providerId) {
      console.error('Provider ID not found:', provider);
      return;
    }
    
    // Navigate to messages with the provider pre-selected
    navigate(`/messages?providerId=${providerId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">{provider.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Service image and category tag */}
          <div className="relative mb-5">
            <img 
              src={provider.image} 
              alt={provider.name} 
              className="w-full h-72 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400';
              }}
            />
            <span className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
              {provider.category}
            </span>
          </div>
          
          {/* Pricing and time */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="text-3xl font-bold text-green-600">
                ${provider.hourlyRate}
              </span>
              <span className="text-gray-500 ml-2">
                ({provider.pricingType})
              </span>
            </div>
            {provider.estimatedCompletionTime && (
              <div className="flex items-center text-gray-600">
                <FaClock className="mr-2 text-green-500" />
                <span>Est. time: {provider.estimatedCompletionTime}</span>
              </div>
            )}
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-gray-700">{provider.description}</p>
          </div>
          
          {/* Service Provider Info */}
          <div className="bg-gray-50 p-5 rounded-lg mb-6">
            <h3 className="font-semibold text-lg mb-3">Service Provider</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <FaUser className="w-4 h-4 text-green-500 mr-2" />
                <span className="font-medium">{provider.providerName}</span>
              </div>
              
              {provider.businessName && (
                <div className="flex items-center">
                  <div className="w-4 mr-2"></div> {/* Spacer for alignment */}
                  <span className="text-gray-700">Business: {provider.businessName}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <div className="flex items-center">
                  <FaStar className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="font-medium">{provider.rating.toFixed(1)}</span>
                </div>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600">{provider.reviews} reviews</span>
              </div>
              
              <div className="flex items-center">
                <FaMapMarkerAlt className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-gray-700">{provider.serviceLocation}</span>
              </div>
              
              {provider.contactNumber && (
                <div className="flex items-center">
                  <FaPhone className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-700">{provider.contactNumber}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 mb-8">
            <button 
              onClick={onBookNow}
              className="flex-1 px-4 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              Book Now
            </button>
            <button 
              onClick={handleMessageProvider}
              className="flex-1 px-4 py-3 flex items-center justify-center border border-green-500 text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors"
            >
              <FaCommentAlt className="mr-2" />
              Message Provider
            </button>
          </div>
        </div>
        
        {/* Reviews section */}
        <div className="border-t">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Reviews & Ratings</h3>
            
            {reviews.length > 0 ? (
              <div className="space-y-5">
                {reviews.map(review => (
                  <div key={review.id} className="pb-5 border-b border-gray-100 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{review.userName}</div>
                        <div className="flex mt-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(review.date).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reviews yet for this service.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsModal; 