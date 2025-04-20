import React, { useState } from 'react';
import { FaUser, FaCalendarCheck, FaClock, FaMapMarkerAlt, FaCommentAlt, 
  FaPhone, FaInfoCircle, FaTimesCircle, FaCheckCircle, FaSpinner, FaCalendarTimes } from 'react-icons/fa';

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

// Define types for the component
export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  duration?: number;
}

export interface StatusHistory {
  status: string;
  date: string;
  note?: string;
  notes?: string;
}

export interface Booking {
  _id: string;
  customer: Customer;
  service: Service;
  housekeeper?: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  date: string;
  time: string;
  location: string;
  contactPhone: string;
  notes?: string;
  status: string;
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

interface BookingDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onStatusChange: (bookingId: string, status: string, note?: string) => Promise<void>;
  isHousekeeper?: boolean;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({ 
  isOpen, 
  onClose, 
  booking, 
  onStatusChange,
  isHousekeeper = false
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Status colors mapping
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800'
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  // Get client's full name
  const getClientName = () => {
    return `${booking.customer.firstName} ${booking.customer.lastName}`;
  };

  // Handle booking acceptance
  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onStatusChange(booking._id, 'confirmed');
    } catch (error) {
      console.error('Error accepting booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking completion
  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await onStatusChange(booking._id, 'completed');
    } catch (error) {
      console.error('Error completing booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking rejection
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setIsLoading(true);
    try {
      await onStatusChange(booking._id, 'rejected', rejectReason);
      setShowRejectForm(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking cancelation
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancelation');
      return;
    }
    
    setIsLoading(true);
    try {
      await onStatusChange(booking._id, 'cancelled', cancelReason);
      setShowCancelForm(false);
      setCancelReason('');
      onClose(); // Close the modal after successful cancellation
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show date in readable format
  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString();
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
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
          <div className="flex items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-gray-200 mr-4 flex-shrink-0 overflow-hidden shadow-md border-2 border-white">
              {booking.customer.profileImage ? (
                <img 
                  src={formatImageUrl(booking.customer.profileImage)} 
                  alt={getClientName()} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#137D13] text-white text-xl font-bold">
                  {booking.customer.firstName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{getClientName()}</h3>
              <div className="flex mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  Requested on {formatDate(booking.createdAt)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 mb-6 bg-gray-50/70 backdrop-blur-sm p-4 rounded-lg border border-gray-100/60">
            <div className="flex items-start">
              <FaUser className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Service</p>
                <p className="text-base font-medium">{booking.service.name}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaPhone className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Number</p>
                <p className="text-base font-medium">{booking.contactPhone}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaCalendarCheck className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Date & Time</p>
                <p className="text-base font-medium">{formatDate(booking.date)} at {formatTime(booking.time)}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaClock className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Service Type</p>
                <p className="text-base font-medium">{booking.service.category}</p>
              </div>
            </div>
            
            <div className="flex items-start md:col-span-2">
              <FaMapMarkerAlt className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-base font-medium">{booking.location}</p>
              </div>
            </div>
            
            {booking.notes && (
              <div className="flex items-start md:col-span-2 bg-white/80 backdrop-blur-sm p-3 rounded-md border border-gray-100/60">
                <FaCommentAlt className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-base">{booking.notes}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start md:col-span-2 mt-2 bg-[#f0f7f0]/80 backdrop-blur-sm p-4 rounded-md border border-[#dceadc]/70">
              <FaInfoCircle className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
              <div>
                <p className="text-sm font-medium text-gray-500">Payment</p>
                <p className="text-xl font-bold text-[#137D13]">₱{booking.service.price}</p>
                <p className="text-xs text-gray-500">
                  To be paid by client after service completion
                </p>
              </div>
            </div>
          </div>
          
          {/* Status History */}
          {booking.statusHistory && booking.statusHistory.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-800">Status History</h4>
              <div className="space-y-4 pl-2">
                {booking.statusHistory.map((history, index) => {
                  // Get the note from either note or notes field
                  const historyNote = history.note || history.notes;
                  return (
                    <div 
                      key={index} 
                      className="flex items-start"
                    >
                      <div className="mr-3 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-[#137D13] flex items-center justify-center text-white text-xs shadow-md">
                          {index + 1}
                        </div>
                        {index < booking.statusHistory.length - 1 && (
                          <div className="w-0.5 bg-gray-200 h-10 ml-[10px] -mb-1"></div>
                        )}
                      </div>
                      <div className="flex-1 bg-white/80 backdrop-blur-sm p-3 rounded-md shadow-sm border border-gray-100/60">
                        <p className="font-medium text-gray-800">
                          {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                          {historyNote && <span className="font-normal text-gray-500 ml-1">- {historyNote}</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(history.date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Rejection Form */}
          {isHousekeeper && booking.status === 'pending' && !showRejectForm && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="bg-[#137D13] border-none text-white font-medium py-3 rounded-md hover:bg-[#0c5c0c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin inline-block mr-2" />
                ) : (
                  <FaCheckCircle className="inline-block mr-2" />
                )}
                Accept Booking
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isLoading}
                className="bg-red-500 border-none text-white font-medium py-3 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FaTimesCircle className="inline-block mr-2" />
                Reject Booking
              </button>
            </div>
          )}
          
          {isHousekeeper && booking.status === 'pending' && showRejectForm && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => setShowRejectForm(false)}
                disabled={isLoading}
                className="bg-gray-200 text-gray-700 font-medium py-3 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="bg-red-500 border-none text-white font-medium py-3 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin inline-block mr-2" />
                ) : (
                  <FaTimesCircle className="inline-block mr-2" />
                )}
                Confirm Rejection
              </button>
            </div>
          )}
          
          {isHousekeeper && booking.status === 'confirmed' && !showCancelForm && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="bg-[#137D13] border-none text-white font-medium py-3 rounded-md hover:bg-[#0c5c0c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin inline-block mr-2" />
                ) : (
                  <FaCheckCircle className="inline-block mr-2" />
                )}
                Mark as Completed
              </button>
              <button
                onClick={() => setShowCancelForm(true)}
                disabled={isLoading}
                className="bg-red-500 border-none text-white font-medium py-3 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin inline-block mr-2" />
                ) : (
                  <FaCalendarTimes className="inline-block mr-2" />
                )}
                Cancel Booking
              </button>
            </div>
          )}
          
          {isHousekeeper && booking.status === 'confirmed' && showCancelForm && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Please provide a reason for cancellation. This will be visible to the homeowner.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#137D13] focus:border-transparent resize-none h-32 mb-3"
                required
              ></textarea>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setShowCancelForm(false)}
                  disabled={isLoading}
                  className="bg-gray-200 text-gray-700 font-medium py-3 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="bg-red-500 border-none text-white font-medium py-3 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin inline-block mr-2" />
                  ) : (
                    <FaCalendarTimes className="inline-block mr-2" />
                  )}
                  Confirm Cancellation
                </button>
              </div>
            </div>
          )}
          
          {(booking.status === 'completed' || booking.status === 'rejected' || booking.status === 'cancelled' || !isHousekeeper) && (
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 font-medium py-3 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
