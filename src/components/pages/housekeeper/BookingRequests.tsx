import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaCalendarTimes, FaClipboardCheck, FaClock, FaMapMarkerAlt, FaUser, FaSpinner, FaInfoCircle, FaPhone, FaCommentAlt, FaSearch, FaFilter, FaCheck, FaTimes, FaEye, FaCalendarAlt, FaComments, FaTimesCircle } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import axios from 'axios';
import { getAuthHeader } from '../../utils/auth';
import toast from 'react-hot-toast';
import BookingDetails, { Booking } from '../../modals/BookingDetails';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  
  // State for booking requests, filters, selected booking
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state - initialize from local storage
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const savedFilter = localStorage.getItem('housekeeper_bookings_status_filter');
    return savedFilter || 'all';
  });
  
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    const savedSearch = localStorage.getItem('housekeeper_bookings_search_term');
    return savedSearch || '';
  });
  
  // Save filters to local storage when they change
  useEffect(() => {
    localStorage.setItem('housekeeper_bookings_status_filter', statusFilter);
  }, [statusFilter]);
  
  useEffect(() => {
    localStorage.setItem('housekeeper_bookings_search_term', searchTerm);
  }, [searchTerm]);
  
  // Rejection/cancellation modal state
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonNote, setReasonNote] = useState('');
  const [bookingToUpdate, setBookingToUpdate] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'rejected' | 'cancelled'>('rejected');

  // Function to clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    
    // Clear local storage as well
    localStorage.removeItem('housekeeper_bookings_status_filter');
    localStorage.removeItem('housekeeper_bookings_search_term');
  };

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
    console.log('Filters changed - Status:', statusFilter, 'Search:', searchTerm);
    console.log('Total bookings before filtering:', bookings.length);
    
    if (bookings.length === 0) return;
    
    let filtered = [...bookings];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
      console.log(`After status filter (${statusFilter}):`, filtered.length);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        (booking.customer?.firstName && booking.customer.firstName.toLowerCase().includes(term)) ||
        (booking.customer?.lastName && booking.customer.lastName.toLowerCase().includes(term)) ||
        (booking.service?.name && booking.service.name.toLowerCase().includes(term)) ||
        (booking.service?.category && booking.service.category.toLowerCase().includes(term)) ||
        (booking.location && booking.location.toLowerCase().includes(term)) ||
        (booking.contactPhone && booking.contactPhone.includes(term))
      );
      console.log('After search filter:', filtered.length);
    }
    
    console.log('Final filtered bookings:', filtered.length);
    setFilteredBookings(filtered);
  }, [bookings, statusFilter, searchTerm]);

  // Open rejection/cancellation modal
  const openReasonModal = (bookingId: string, type: 'rejected' | 'cancelled') => {
    setBookingToUpdate(bookingId);
    setReasonNote('');
    setActionType(type);
    setShowReasonModal(true);
  };

  // Handle rejection/cancellation with note
  const handleReasonSubmit = () => {
    if (!bookingToUpdate) return;
    
    if (!reasonNote.trim()) {
      toast.error(`Please provide a reason for ${actionType === 'rejected' ? 'rejection' : 'cancellation'}`);
      return;
    }
    
    handleStatusChange(bookingToUpdate, actionType, reasonNote);
    setShowReasonModal(false);
    setBookingToUpdate(null);
    setReasonNote('');
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

  // Handle message click - navigate to messaging interface
  const handleMessageClick = (customerId: string) => {
    navigate(`/housekeeper/messages?customerId=${customerId}`);
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Requests</h1>
        <p className="text-gray-600">Manage your service bookings and appointments</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        <div className="flex flex-col lg:flex-row items-start gap-4">
          {/* Search input */}
          <div className="relative flex-grow w-full lg:w-1/3">
            <input
              type="text"
              placeholder="Search by name, service, location..."
              className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137D13] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
          </div>
          
          {/* Status filter */}
          <div className="relative w-full lg:w-1/3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137D13] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <FaFilter className="absolute left-3 top-3.5 text-gray-400" />
          </div>
          
          {/* Clear filters button - only show if filters are applied */}
          {(statusFilter !== 'all' || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <FaSpinner className="animate-spin text-4xl text-[#137D13]" />
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FaTimesCircle className="text-red-500 mr-3" />
            <span>{error}</span>
            <button 
              className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Booking Requests List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-yellow-50 rounded-lg p-6 text-center border border-yellow-100">
          <FaInfoCircle className="text-yellow-500 text-2xl mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">No bookings found</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter === 'all' && !searchTerm
              ? "You don't have any booking requests yet."
              : "No bookings match your current filters."}
          </p>
          {(statusFilter !== 'all' || searchTerm) && (
            <button 
              onClick={clearFilters}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 font-medium rounded-lg hover:bg-yellow-200 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Filter info - show when filters are applied */}
          {(statusFilter !== 'all' || searchTerm) && (
            <div className="mb-6 p-4 bg-[#e8f5e8] rounded-lg text-[#137D13] flex justify-between items-center border border-[#c8e6c8]">
              <div>
                <span className="font-medium">Filtered results:</span> Showing {filteredBookings.length} of {bookings.length} bookings
                {statusFilter !== 'all' && (
                  <span className="ml-2">• Status: <span className="font-medium capitalize">{statusFilter}</span></span>
                )}
                {searchTerm && (
                  <span className="ml-2">• Search: <span className="font-medium">"{searchTerm}"</span></span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-[#137D13] hover:text-[#0c5c0c] font-medium text-sm bg-white px-3 py-1 rounded-md shadow-sm"
              >
                Clear
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => (
              <div 
                key={booking._id}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    {/* Status Badge */}
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusColors[booking.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    
                    {/* Date & Time */}
                    <div className="flex items-center text-gray-600 text-sm">
                      <FaCalendarAlt className="text-[#137D13] mr-2" />
                      <span>{formatDate(booking.date)}</span>
                      <span className="mx-1">•</span>
                      <FaClock className="text-[#137D13] mr-1" />
                      <span>{formatTime(booking.time)}</span>
                    </div>
                  </div>
                  
                  {/* Client Info */}
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shadow border-2 border-white">
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
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-800">{booking.customer.firstName} {booking.customer.lastName}</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <FaPhone className="mr-1 text-xs" /> {booking.contactPhone}
                      </p>
                    </div>
                  </div>
                  
                  {/* Service Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">{booking.service.name}</h4>
                        <p className="text-sm text-gray-600">{booking.service.category}</p>
                      </div>
                      <p className="font-bold text-[#137D13] text-lg">₱{booking.service.price}</p>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="mb-5 flex items-start">
                    <FaMapMarkerAlt className="text-[#137D13] mr-2 mt-0.5" />
                    <p className="text-sm text-gray-700">{booking.location}</p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 justify-end border-t border-gray-100 pt-4">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking._id, 'confirmed')}
                          className="flex items-center px-4 py-2 bg-[#137D13] text-white rounded-lg hover:bg-[#0c5c0c] transition-colors"
                        >
                          <FaCheck className="mr-2" />
                          Accept
                        </button>
                        <button
                          onClick={() => openReasonModal(booking._id, 'rejected')}
                          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FaTimes className="mr-2" />
                          Reject
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking._id, 'completed')}
                          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <FaCheck className="mr-2" />
                          Complete
                        </button>
                        <button
                          onClick={() => openReasonModal(booking._id, 'cancelled')}
                          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FaCalendarTimes className="mr-2" />
                          Cancel
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handleMessageClick(booking.customer._id)}
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <FaComments className="mr-2" />
                      Message
                    </button>
                    
                    <button
                      onClick={() => viewBookingDetails(booking)}
                      className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <FaEye className="mr-2" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Rejection/Cancellation Note Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {actionType === 'rejected' 
                ? 'Provide Reason for Rejection' 
                : 'Provide Reason for Cancellation'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {actionType === 'rejected'
                ? 'Please provide a reason why you are rejecting this booking request. This will be visible to the homeowner.'
                : 'Please provide a reason why you are cancelling this confirmed booking. This will be visible to the homeowner.'}
            </p>
            
            <textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder={`Enter reason for ${actionType === 'rejected' ? 'rejection' : 'cancellation'}...`}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137D13] focus:border-transparent resize-none h-32"
              required
            ></textarea>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReasonModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReasonSubmit}
                className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                {actionType === 'rejected' ? 'Reject Booking' : 'Cancel Booking'}
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
