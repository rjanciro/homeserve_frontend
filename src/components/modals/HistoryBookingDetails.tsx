import React, { useEffect } from 'react';
import { FaUser, FaCalendarCheck, FaClock, FaMapMarkerAlt, FaCommentAlt, 
  FaPhone, FaInfoCircle, FaTimes, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaCheck, FaBan, FaExclamationTriangle, FaEnvelope, FaComments } from 'react-icons/fa';

const BASE_URL = 'http://localhost:8080';

// Helper function to format image URLs correctly
const formatImageUrl = (profileImage: string | null | undefined): string => {
  if (!profileImage) return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
  
  if (profileImage.startsWith('http')) return profileImage;
  
  // Handle case where full URL might be included in the path
  if (profileImage.includes('/uploads/')) {
    return `${BASE_URL}${profileImage}`;
  }
  
  return `${BASE_URL}/uploads/profile_pictures/${profileImage}`;
};

interface StatusHistoryItem {
  status: string;
  date: string;
  note?: string;
  notes?: string;
}

interface HousekeeperInfo {
  _id: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  profileImage?: string;
  phone?: string;
}

interface ServiceInfo {
  name: string;
  category: string;
  price: number;
}

interface HistoryBookingDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  service: string;
  provider: string;
  providerImage?: string;
  date: string;
  time: string;
  location: string;
  status: string;
  notes?: string;
  statusHistory?: StatusHistoryItem[];
  price?: number;
  serviceName?: string;
  serviceCategory?: string;
  housekeeper?: HousekeeperInfo;
  onMessageClick?: (housekeeper: HousekeeperInfo) => void;
}

const HistoryBookingDetails: React.FC<HistoryBookingDetailsProps> = ({
  isOpen,
  onClose,
  service,
  provider,
  providerImage,
  date,
  time,
  location,
  status,
  notes,
  statusHistory = [],
  price = 0,
  housekeeper,
  onMessageClick
}) => {
  if (!isOpen) return null;

  // Status colors mapping
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
  };

  // Status icons
  const statusIcons = {
    pending: <FaHourglassHalf className="mr-1.5" />,
    confirmed: <FaCheckCircle className="mr-1.5" />,
    completed: <FaCheck className="mr-1.5" />,
    cancelled: <FaBan className="mr-1.5" />,
    rejected: <FaTimesCircle className="mr-1.5" />
  };

  // Get status color based on status
  const getStatusColorClass = (statusValue: string) => {
    return statusColors[statusValue as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Format date for history items
  const formatDateTime = (dateTimeString: string) => {
    try {
      return new Date(dateTimeString).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper to get note from history item (handles both 'note' and 'notes' fields)
  const getNoteFromHistory = (historyItem: StatusHistoryItem): string | undefined => {
    return historyItem.note || historyItem.notes;
  };

  // Find rejection note if booking was rejected
  const rejectionInfo = status === 'rejected' ? 
    statusHistory.find(item => item.status === 'rejected') : null;
  
  // Get the rejection reason from the found item (supporting both field names)
  const rejectionReason = rejectionInfo ? getNoteFromHistory(rejectionInfo) : undefined;

  // Debug statusHistory when component mounts
  useEffect(() => {
    if (isOpen) {
      console.log('HistoryBookingDetails - statusHistory:', statusHistory);
      console.log('HistoryBookingDetails - rejection info:', rejectionInfo);
      console.log('HistoryBookingDetails - rejection reason:', rejectionReason);
      console.log('HistoryBookingDetails - booking status:', status);
    }
  }, [isOpen, statusHistory, rejectionInfo, rejectionReason, status]);

  // Handle starting a conversation with the housekeeper
  const startConversation = () => {
    if (!housekeeper) return;
    
    // If an external handler was provided, use it
    if (onMessageClick) {
      onMessageClick(housekeeper);
      onClose();
      return;
    }
    
    // Fallback to direct URL navigation using the correct query parameter
    window.location.href = `/messages?providerId=${housekeeper._id}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 border border-white/40">
        <div className="p-6 border-b border-gray-100/80">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/60 rounded-full p-2 transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
          {/* Rejection Notice (if applicable) */}
          {status === 'rejected' && (
            <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Booking Rejected</h4>
                  <p className="text-red-700">
                    {rejectionReason 
                      ? `Reason: ${rejectionReason}` 
                      : "The housekeeper has rejected this booking."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Service Provider Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-14 h-14 rounded-full bg-gray-200 mr-4 flex-shrink-0 overflow-hidden shadow-md border-2 border-white">
                {providerImage ? (
                  <img 
                    src={formatImageUrl(providerImage)} 
                    alt={provider} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#137D13] text-white text-xl font-bold">
                    {provider.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{provider}</h3>
                <div className="flex mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(status)}`}>
                    {statusIcons[status as keyof typeof statusIcons]}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-800">Status History</h4>
              <div className="space-y-4 pl-2">
                {statusHistory.map((history, index) => {
                  const historyNote = getNoteFromHistory(history);
                  return (
                    <div 
                      key={index} 
                      className="flex items-start"
                    >
                      <div className="mr-3 mt-0.5">
                        <div className={`w-5 h-5 rounded-full ${history.status === 'rejected' ? 'bg-red-500' : 'bg-[#137D13]'} flex items-center justify-center text-white text-xs shadow-md`}>
                          {index + 1}
                        </div>
                        {index < statusHistory.length - 1 && (
                          <div className="w-0.5 bg-gray-200 h-10 ml-[10px] -mb-1"></div>
                        )}
                      </div>
                      <div className={`flex-1 backdrop-blur-sm p-3 rounded-md shadow-sm border ${
                        history.status === 'rejected' 
                          ? 'bg-red-50/80 border-red-100/60' 
                          : 'bg-white/80 border-gray-100/60'
                      }`}>
                        <p className={`font-medium ${history.status === 'rejected' ? 'text-red-800' : 'text-gray-800'}`}>
                          {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                        </p>
                        {historyNote && (
                          <p className={`${history.status === 'rejected' ? 'text-red-700 font-medium' : 'text-gray-500'} ${history.status === 'rejected' ? 'mt-1' : ''}`}>
                            {history.status === 'rejected' ? 'Reason: ' : ''}{historyNote}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(history.date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 mb-6 bg-gray-50/70 backdrop-blur-sm p-4 rounded-lg border border-gray-100/60">
            <div className="flex items-start">
              <FaUser className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Service</p>
                <p className="text-base font-medium">{service}</p>
              </div>
            </div>

            {housekeeper?.phone && (
              <div className="flex items-start">
                <FaPhone className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Number</p>
                  <p className="text-base font-medium">{housekeeper.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start">
              <FaCalendarCheck className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Date & Time</p>
                <p className="text-base font-medium">{date} at {time}</p>
              </div>
            </div>

            <div className="flex items-start md:col-span-2">
              <FaMapMarkerAlt className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-base font-medium">{location}</p>
              </div>
            </div>

            {notes && (
              <div className="flex items-start md:col-span-2 bg-white/80 backdrop-blur-sm p-3 rounded-md border border-gray-100/60">
                <FaCommentAlt className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-base">{notes}</p>
                </div>
              </div>
            )}

            {price > 0 && (
              <div className="flex items-start md:col-span-2 mt-2 bg-[#f0f7f0]/80 backdrop-blur-sm p-4 rounded-md border border-[#dceadc]/70">
                <FaInfoCircle className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment</p>
                  <p className="text-xl font-bold text-[#137D13]">₱{price}</p>
                  <p className="text-xs text-gray-500">
                    To be paid after service completion
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
          >
            Close
          </button>
          
          {/* Add messaging option in footer too */}
          {housekeeper && housekeeper._id && (
            <button
              onClick={startConversation}
              className="flex-1 bg-blue-500 text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <FaComments className="mr-2" />
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryBookingDetails; 