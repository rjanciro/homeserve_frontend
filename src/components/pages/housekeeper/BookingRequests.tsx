import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaCalendarTimes, FaClipboardCheck, FaClock, FaMapMarkerAlt, FaUser, FaSpinner, FaInfoCircle, FaPhone, FaCommentAlt, FaSearch, FaFilter, FaCheck, FaTimes, FaEye, FaCalendarAlt } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import axios from 'axios';
import { getAuthHeader } from '../../utils/auth';
import toast from 'react-hot-toast';
import BookingDetails, { Booking } from '../../modals/BookingDetails';

const API_URL = 'http://localhost:8080/api';
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

const BookingRequests: React.FC = () => {
  useDocumentTitle('Booking Requests');
  
  // State for booking requests, filters, selected booking
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Rejection modal state
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [bookingToReject, setBookingToReject] = useState<string | null>(null);

  // Status colors mapping
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800'
  };

  // Fetch booking requests from the server
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        console.log('Using auth header:', getAuthHeader());
        console.log('Fetching from URL:', `${API_URL}/bookings/housekeeper`);
        
        const response = await axios.get(
          `${API_URL}/bookings/housekeeper`, 
          { headers: getAuthHeader() }
        );
        
        console.log('Fetched bookings:', response.data);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Log customer profile images for debugging
          response.data.forEach((booking, index) => {
            if (booking.customer && booking.customer.profileImage) {
              console.log(`Customer ${index} profile image:`, booking.customer.profileImage);
            }
          });
        }
        
        if (!Array.isArray(response.data)) {
          console.error('Expected an array of bookings but got:', typeof response.data);
          setError('Invalid data format received from server');
          setLoading(false);
          return;
        }
        
        setBookings(response.data);
        setFilteredBookings(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        console.error('Error details:', err.response?.data || 'No response data');
        setError('Failed to load booking requests. Please try again later.');
        setLoading(false);
        toast.error('Failed to load booking requests');
      }
    };
    
    fetchBookings();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (bookings.length === 0) return;
    
    let filtered = [...bookings];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.customer.firstName.toLowerCase().includes(term) ||
        booking.customer.lastName.toLowerCase().includes(term) ||
        booking.service.name.toLowerCase().includes(term) ||
        booking.location.toLowerCase().includes(term)
      );
    }
    
    setFilteredBookings(filtered);
  }, [bookings, statusFilter, searchTerm]);

  // Open rejection modal
  const openRejectionModal = (bookingId: string) => {
    setBookingToReject(bookingId);
    setRejectionNote('');
    setShowRejectionModal(true);
  };

  // Handle rejection with note
  const handleReject = () => {
    if (!bookingToReject) return;
    
    if (!rejectionNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    handleStatusChange(bookingToReject, 'rejected', rejectionNote);
    setShowRejectionModal(false);
    setBookingToReject(null);
    setRejectionNote('');
  };

  // Handle updating the booking status
  const handleStatusChange = async (bookingId: string, newStatus: string, note?: string) => {
    try {
      await axios.patch(
        `${API_URL}/bookings/${bookingId}/status`,
        { 
          status: newStatus, 
          note, // Keep 'note' for frontend compatibility
          notes: note // Add 'notes' for backend compatibility
        },
        { headers: getAuthHeader() }
      );
      
      // Update the booking in state
      const updatedBookings = bookings.map(booking => {
        if (booking._id === bookingId) {
          return {
            ...booking,
            status: newStatus,
            statusHistory: [
              ...booking.statusHistory,
              {
                status: newStatus,
                date: new Date().toISOString(),
                note, // Keep 'note' for frontend compatibility
                notes: note // Add 'notes' for backend compatibility
              }
            ]
          };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
      
      // Close modal if needed
      if (newStatus === 'rejected' || newStatus === 'completed') {
        setShowDetailsModal(false);
      }
      
      toast.success(`Booking ${newStatus} successfully`);
    } catch (err) {
      console.error(`Error updating booking status to ${newStatus}:`, err);
      toast.error(`Failed to update booking status`);
    }
  };

  // View booking details
  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
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
  const getClientName = (booking: Booking) => {
    return `${booking.customer.firstName} ${booking.customer.lastName}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="p-8 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
          <FaSpinner className="animate-spin text-[#137D13] text-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Booking Requests</h1>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Search input */}
          <div className="relative flex-grow sm:max-w-xs">
            <input
              type="text"
              placeholder="Search by name, service..."
              className="w-full px-4 py-2 pr-10 border border-gray-300/60 bg-white/80 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137D13] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
          </div>
          
          {/* Status filter */}
          <div className="relative flex-shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full px-4 py-2 pl-10 border border-gray-300/60 bg-white/80 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137D13] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Loading and error states */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
            <FaSpinner className="animate-spin text-4xl text-[#137D13]" />
          </div>
        </div>
      )}
      
      {error && !loading && (
        <div className="bg-red-50/70 backdrop-blur-sm border border-red-100/60 text-red-700 rounded-lg p-4 mb-6">
          {error}
          <button 
            className="ml-2 underline"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      )}
      
      {/* Booking Requests List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-yellow-50/70 backdrop-blur-sm border border-yellow-100/60 text-yellow-700 rounded-lg p-4 text-center">
          No booking requests found. {statusFilter !== 'all' && (
            <span>Try changing the status filter.</span>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div 
              key={booking._id}
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              <div className="p-4 sm:p-6">
                <div className="sm:flex justify-between items-start">
                  {/* Client and Service Info */}
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-gray-200 mr-3 overflow-hidden shadow-sm border-2 border-white">
                        {booking.customer.profileImage ? (
                          <img 
                            src={formatImageUrl(booking.customer.profileImage)} 
                            alt={`${booking.customer.firstName} ${booking.customer.lastName}`}
                            className="w-full h-full object-cover" 
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#137D13] text-white text-lg font-bold">
                            {booking.customer.firstName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{booking.customer.firstName} {booking.customer.lastName}</h3>
                        <p className="text-sm text-gray-500">{booking.contactPhone}</p>
                      </div>
                    </div>
                    <div className="ml-13 sm:ml-0">
                      <h4 className="font-medium">{booking.service.name}</h4>
                      <p className="text-sm text-gray-600">{booking.service.category}</p>
                    </div>
                  </div>
                  
                  {/* Date, Price & Status */}
                  <div className="sm:text-right">
                    <div className="flex items-center sm:justify-end mb-2">
                      <FaCalendarAlt className="text-[#137D13] mr-2" />
                      <span>{formatDate(booking.date)} at {formatTime(booking.time)}</span>
                    </div>
                    <p className="font-bold text-[#137D13] text-lg">₱{booking.service.price}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm border ${statusColors[booking.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Location */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {booking.location}
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="mt-4 sm:mt-6 flex justify-end space-x-2">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(booking._id, 'confirmed')}
                        className="flex items-center px-4 py-2 bg-[#137D13]/90 text-white rounded-lg hover:bg-[#0c5c0c] transition-colors"
                      >
                        <FaCheck className="mr-2" />
                        Accept
                      </button>
                      <button
                        onClick={() => openRejectionModal(booking._id)}
                        className="flex items-center px-4 py-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <FaTimes className="mr-2" />
                        Reject
                      </button>
                    </>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(booking._id, 'completed')}
                      className="flex items-center px-4 py-2 bg-blue-500/90 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <FaCheck className="mr-2" />
                      Complete
                    </button>
                  )}
                  
                  <button
                    onClick={() => viewBookingDetails(booking)}
                    className="flex items-center px-4 py-2 bg-gray-200/90 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <FaEye className="mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Rejection Note Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 transform transition-all">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Provide Reason for Rejection
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason why you are rejecting this booking request. This will be visible to the homeowner.
            </p>
            
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#137D13] focus:border-transparent resize-none h-32"
              required
            ></textarea>
            
            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Reject Booking
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetails
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          booking={selectedBooking}
          onStatusChange={handleStatusChange}
          isHousekeeper={true}
        />
      )}
    </div>
  );
};

export default BookingRequests;
