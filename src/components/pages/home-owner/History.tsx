import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaSpinner, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaCheck, FaBan, FaFilter, FaEye, FaSearch, FaInfoCircle, FaComments, FaUser, FaPhone, FaStar } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import axios from 'axios';
import { getAuthHeader } from '../../utils/auth';
import toast from 'react-hot-toast';
import HistoryBookingDetails from '../../modals/HistoryBookingDetails';
import RatingModal from '../../modals/RatingModal';
import { useNavigate } from 'react-router-dom';

// Define booking interface
interface Booking {
  _id: string;
  service: {
    _id: string;
    name: string;
    category: string;
    price?: number;
  };
  housekeeper: {
    _id: string;
    firstName: string;
    lastName: string;
    businessName?: string;
    profileImage?: string;
    phone?: string;
  };
  date: string;
  time: string;
  location: string;
  status: string;
  notes?: string;
  createdAt: string;
  statusHistory?: {
    status: string;
    date: string;
    note?: string;
  }[];
}

interface AppointmentCardProps {
  service: string;
  provider: string;
  providerImage?: string;
  date: string;
  time: string;
  location: string;
  status: 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'rejected';
  bookingId: string;
  serviceId: string;
  housekeeperId: string;
  isRated?: boolean;
  onViewDetails: () => void;
  onCompleteBooking?: () => void;
  onRateService?: () => void;
  isCompleting?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  service, 
  provider, 
  providerImage,
  date, 
  time, 
  location, 
  status,
  bookingId,
  serviceId,
  housekeeperId,
  isRated = false,
  onViewDetails,
  onCompleteBooking,
  onRateService,
  isCompleting = false
}) => {
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

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
          {/* Status Badge */}
          <span className={`inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium border ${statusColors[status]}`}>
            {statusIcons[status]}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          
          {/* Date & Time */}
          <div className="flex items-center text-gray-600 text-xs sm:text-sm">
            <FaCalendar className="text-[#137D13] mr-1.5 sm:mr-2 text-xs sm:text-sm" />
            <span>{date}</span>
            <span className="mx-1">•</span>
            <FaClock className="text-[#137D13] mr-1 text-xs sm:text-sm" />
            <span>{time}</span>
          </div>
        </div>
        
        {/* Service Info */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">{service}</h3>
          <div className="flex items-center text-gray-600">
            <FaUser className="mr-1.5 sm:mr-2 text-xs sm:text-sm text-[#137D13]" />
            <p className="text-xs sm:text-sm">{provider}</p>
          </div>
        </div>
        
        {/* Location */}
        <div className="mb-4 sm:mb-5 flex items-start">
          <FaMapMarkerAlt className="text-[#137D13] mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0 text-xs sm:text-sm" />
          <p className="text-xs sm:text-sm text-gray-700">{location}</p>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 justify-end border-t border-gray-100 pt-3 sm:pt-4">
          {status === 'confirmed' && onCompleteBooking && (
            <button
              onClick={onCompleteBooking}
              disabled={isCompleting}
              className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {isCompleting ? (
                <>
                  <FaSpinner className="animate-spin mr-1.5 sm:mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  <FaCheck className="mr-1.5 sm:mr-2" />
                  Mark Complete
                </>
              )}
            </button>
          )}
          
          {status === 'completed' && !isRated && onRateService && (
            <button
              onClick={onRateService}
              className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-xs sm:text-sm"
            >
              <FaStar className="mr-1.5 sm:mr-2" />
              Leave a Review
            </button>
          )}
          
          <button
            onClick={onViewDetails}
            className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#137D13] text-white rounded-lg hover:bg-[#0c5c0c] transition-colors text-xs sm:text-sm"
          >
            <FaEye className="mr-1.5 sm:mr-2" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Error Boundary component to catch rendering errors
class ErrorBoundary extends Component<{ children: ReactNode, fallback?: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode, fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error in History component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center p-6 bg-red-50 rounded-lg text-red-600">
          <h3 className="font-medium mb-2">Something went wrong</h3>
          <p>There was an error loading your booking history.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MyAppointmentsPage: React.FC = () => {
  useDocumentTitle('History');
  
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Initialize filters from local storage or default values
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const savedFilter = localStorage.getItem('homeowner_history_status_filter');
    return savedFilter || 'all';
  });
  
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    const savedSearch = localStorage.getItem('homeowner_history_search_term');
    return savedSearch || '';
  });
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Add a loading state for the complete booking action
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);
  
  // Add state for rating modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [bookingToRate, setBookingToRate] = useState<{
    bookingId: string;
    serviceId: string;
    housekeeperId: string;
  } | null>(null);
  
  // State to track which bookings have been rated
  const [ratedBookings, setRatedBookings] = useState<string[]>([]);
  
  // Save filters to local storage when they change
  useEffect(() => {
    localStorage.setItem('homeowner_history_status_filter', statusFilter);
  }, [statusFilter]);
  
  useEffect(() => {
    localStorage.setItem('homeowner_history_search_term', searchTerm);
  }, [searchTerm]);
  
  // Function to clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    
    // Clear local storage as well
    localStorage.removeItem('homeowner_history_status_filter');
    localStorage.removeItem('homeowner_history_search_term');
  };
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  
  // Fetch bookings and ratings data
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/bookings/customer`, {
          headers: getAuthHeader()
        });
        
        if (response.data) {
          console.log('Bookings data from API:', response.data);
          
          // Check if the data structure is as expected
          if (Array.isArray(response.data)) {
            if (response.data.length > 0) {
              console.log('First booking sample:', response.data[0]);
              
              // Fetch rated bookings information
              try {
                const ratedBookingsResponse = await axios.get(`${API_URL}/ratings/customer`, {
                  headers: getAuthHeader()
                });
                
                if (ratedBookingsResponse.data && Array.isArray(ratedBookingsResponse.data)) {
                  // Extract bookingIds that have been rated
                  const ratedBookingIds = ratedBookingsResponse.data.map(rating => rating.bookingId);
                  setRatedBookings(ratedBookingIds);
                }
              } catch (ratingError) {
                console.error('Error fetching rated bookings:', ratingError);
                // Continue with the app even if ratings fetch fails
              }
            }
            setBookings(response.data);
            setFilteredBookings(response.data);
          } else {
            console.error('API returned non-array data:', response.data);
            setError('Invalid data format received');
          }
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError('Failed to load your bookings. Please try again later.');
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [API_URL]);
  
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
        (booking.service.name && booking.service.name.toLowerCase().includes(term)) ||
        (booking.housekeeper.firstName && booking.housekeeper.firstName.toLowerCase().includes(term)) ||
        (booking.housekeeper.lastName && booking.housekeeper.lastName.toLowerCase().includes(term)) ||
        (booking.housekeeper.businessName && booking.housekeeper.businessName.toLowerCase().includes(term)) ||
        (booking.location && booking.location.toLowerCase().includes(term))
      );
      console.log('After search filter:', filtered.length);
    }
    
    console.log('Final filtered bookings:', filtered.length);
    setFilteredBookings(filtered);
  }, [bookings, statusFilter, searchTerm]);
  
  // Format date string to a more readable format
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };
  
  // Function to handle booking completion directly from the card
  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setCompletingBookingId(bookingId);
      const response = await axios.patch(
        `${API_URL}/bookings/${bookingId}/complete`,
        {},
        { headers: getAuthHeader() }
      );
      
      // Update local state to reflect the change
      const updatedBookings = bookings.map(booking => {
        if (booking._id === bookingId) {
          return {
            ...booking,
            status: 'completed',
            statusHistory: [
              ...(booking.statusHistory || []),
              {
                status: 'completed',
                date: new Date().toISOString(),
                note: 'Service completed and confirmed by customer'
              }
            ]
          };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
      setFilteredBookings(
        filteredBookings.map(booking => 
          booking._id === bookingId 
            ? {...booking, status: 'completed'} 
            : booking
        )
      );
      
      toast.success('Booking marked as completed successfully!');
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to mark booking as completed. Please try again.');
    } finally {
      setCompletingBookingId(null);
    }
  };

  // Handler for rating a service
  const handleRateService = (bookingId: string, serviceId: string, housekeeperId: string) => {
    setBookingToRate({
      bookingId,
      serviceId,
      housekeeperId
    });
    setShowRatingModal(true);
  };
  
  // Handler for when rating is successfully submitted
  const handleRatingSubmitted = () => {
    if (bookingToRate) {
      // Add the rated booking ID to our local state of rated bookings
      setRatedBookings(prev => [...prev, bookingToRate.bookingId]);
      setBookingToRate(null);
    }
    // Refresh the bookings list to update any status changes
    handleStatusUpdate();
  };

  // In the getAppointmentCards function, add the onRateService prop
  const getAppointmentCards = () => {
    return filteredBookings.map(booking => {
      // Add null checks to prevent errors if data is incomplete
      const serviceName = booking.service?.name || 'Unknown Service';
      
      let providerName = 'Unknown Provider';
      if (booking.housekeeper) {
        providerName = booking.housekeeper.businessName || 
                     `${booking.housekeeper.firstName || ''} ${booking.housekeeper.lastName || ''}`.trim() || 
                     'Unknown Provider';
      }
      
      // Check if this booking has been rated
      const isRated = ratedBookings.includes(booking._id);
      
      return {
        service: serviceName,
        provider: providerName,
        providerImage: booking.housekeeper?.profileImage,
        date: formatDate(booking.date),
        time: booking.time || 'N/A',
        location: booking.location || 'N/A',
        status: (booking.status as 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'rejected') || 'pending',
        bookingId: booking._id,
        serviceId: booking.service?._id || '',
        housekeeperId: booking.housekeeper?._id || '',
        isRated,
        onViewDetails: () => {
          setSelectedBooking(booking);
          setShowDetailsModal(true);
        },
        onCompleteBooking: 
          booking.status === 'confirmed' 
            ? () => handleCompleteBooking(booking._id)
            : undefined,
        onRateService:
          booking.status === 'completed' && !isRated
            ? () => handleRateService(booking._id, booking.service?._id || '', booking.housekeeper?._id || '')
            : undefined,
        isCompleting: completingBookingId === booking._id
      };
    });
  };

  // Handler for message button click
  const handleMessageHousekeeper = (housekeeper: any) => {
    if (!housekeeper || !housekeeper._id) return;
    
    // Navigate to messages page with the provider ID as a query parameter
    navigate(`/messages?providerId=${housekeeper._id}`);
  };

  // Function to refresh bookings after status update
  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/bookings/customer`, {
        headers: getAuthHeader()
      });
      
      if (response.data && Array.isArray(response.data)) {
        setBookings(response.data);
        setFilteredBookings(response.data);
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error);
      toast.error('Failed to refresh bookings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Booking History</h1>
          <p className="text-sm sm:text-base text-gray-600">View your past and upcoming service appointments</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-5 sm:mb-8">
          <div className="flex flex-col space-y-3 sm:space-y-4 md:space-y-0 md:flex-row md:items-start md:gap-3 lg:gap-4">
            {/* Search input */}
            <div className="relative flex-grow w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search by service, provider, location..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-8 sm:pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137D13] focus:border-transparent text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
            
            {/* Status filter */}
            <div className="relative w-full md:w-1/3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-8 sm:pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137D13] focus:border-transparent text-sm sm:text-base"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <FaFilter className="absolute left-3 top-3 text-gray-400" />
            </div>
            
            {/* Clear filters button - only show if filters are applied */}
            {(statusFilter !== 'all' || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center font-medium text-sm sm:text-base w-full md:w-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
              <FaSpinner className="animate-spin text-3xl sm:text-4xl text-[#137D13]" />
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="text-sm sm:text-base">{error}</span>
              <button 
                className="ml-auto px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-xs sm:text-sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-yellow-50 rounded-lg p-4 sm:p-6 text-center border border-yellow-100">
            <FaInfoCircle className="text-yellow-500 text-xl sm:text-2xl mx-auto mb-2" />
            <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-1">No bookings found</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              {statusFilter === 'all' && !searchTerm
                ? "You don't have any bookings yet." 
                : "No bookings match your current filters."}
            </p>
            {(statusFilter !== 'all' || searchTerm) && (
              <button 
                onClick={clearFilters}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-100 text-yellow-700 font-medium rounded-lg hover:bg-yellow-200 transition-colors text-xs sm:text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Filter info - show when filters are applied */}
            {(statusFilter !== 'all' || searchTerm) && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[#e8f5e8] rounded-lg text-[#137D13] flex flex-col sm:flex-row justify-between items-start sm:items-center border border-[#c8e6c8] gap-2 sm:gap-0">
                <div className="text-xs sm:text-sm">
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
                  className="text-[#137D13] hover:text-[#0c5c0c] font-medium text-xs sm:text-sm bg-white px-2 sm:px-3 py-1 rounded-md shadow-sm w-full sm:w-auto text-center"
                >
                  Clear
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              {getAppointmentCards().map((appointment, index) => (
                <AppointmentCard key={filteredBookings[index]._id} {...appointment} />
              ))}
            </div>
          </>
        )}

        {/* Details Modal */}
        {selectedBooking && (
          <HistoryBookingDetails
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            bookingId={selectedBooking._id}
            service={selectedBooking.service?.name || 'Unknown Service'}
            provider={
              selectedBooking.housekeeper?.businessName || 
              `${selectedBooking.housekeeper?.firstName || ''} ${selectedBooking.housekeeper?.lastName || ''}`.trim() || 
              'Unknown Provider'
            }
            providerImage={selectedBooking.housekeeper?.profileImage}
            date={formatDate(selectedBooking.date)}
            time={selectedBooking.time || 'N/A'}
            location={selectedBooking.location || 'N/A'}
            status={selectedBooking.status || 'pending'}
            notes={selectedBooking.notes}
            statusHistory={selectedBooking.statusHistory}
            price={selectedBooking.service?.price}
            housekeeper={selectedBooking.housekeeper}
            onMessageClick={handleMessageHousekeeper}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
        
        {/* Rating Modal */}
        {bookingToRate && (
          <RatingModal
            isOpen={showRatingModal}
            onClose={() => setShowRatingModal(false)}
            bookingId={bookingToRate.bookingId}
            serviceId={bookingToRate.serviceId}
            housekeeperId={bookingToRate.housekeeperId}
            onRatingSubmitted={handleRatingSubmitted}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default function HistoryPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <MyAppointmentsPage />
    </ErrorBoundary>
  );
}
