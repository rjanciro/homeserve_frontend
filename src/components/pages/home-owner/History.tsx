import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaSpinner, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaCheck, FaBan, FaFilter, FaEye, FaSearch, FaInfoCircle, FaComments, FaUser, FaPhone } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import axios from 'axios';
import { getAuthHeader } from '../../utils/auth';
import toast from 'react-hot-toast';
import HistoryBookingDetails from '../../modals/HistoryBookingDetails';
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
  onViewDetails: () => void;
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
  onViewDetails
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
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          {/* Status Badge */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[status]}`}>
            {statusIcons[status]}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          
          {/* Date & Time */}
          <div className="flex items-center text-gray-600 text-sm">
            <FaCalendar className="text-[#137D13] mr-2" />
            <span>{date}</span>
            <span className="mx-1">•</span>
            <FaClock className="text-[#137D13] mr-1" />
            <span>{time}</span>
          </div>
        </div>
        
        {/* Service Info */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{service}</h3>
          <div className="flex items-center text-gray-600">
            <FaUser className="mr-2 text-sm text-[#137D13]" />
            <p className="text-sm">{provider}</p>
          </div>
        </div>
        
        {/* Location */}
        <div className="mb-5 flex items-start">
          <FaMapMarkerAlt className="text-[#137D13] mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700">{location}</p>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 justify-end border-t border-gray-100 pt-4">
          <button
            onClick={onViewDetails}
            className="flex items-center px-4 py-2 bg-[#137D13] text-white rounded-lg hover:bg-[#0c5c0c] transition-colors"
          >
            <FaEye className="mr-2" />
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
              
              // Debug statusHistory data
              if (response.data[0].statusHistory && response.data[0].statusHistory.length > 0) {
                console.log('Status History Sample:', response.data[0].statusHistory);
                
                // Helper function to get note from history item (supports both 'note' and 'notes' fields)
                const getNoteFromHistory = (historyItem: any): string | undefined => {
                  return historyItem.note || historyItem.notes;
                };
                
                // Check if there's any rejected status with notes
                const rejectedStatus = response.data.find(booking => 
                  booking.status === 'rejected' && 
                  booking.statusHistory?.some((history: any) => 
                    history.status === 'rejected' && 
                    (history.note || history.notes)
                  )
                );
                
                if (rejectedStatus) {
                  console.log('Found rejected booking with note:', rejectedStatus);
                  const rejectionItem = rejectedStatus.statusHistory.find((h: any) => h.status === 'rejected');
                  console.log('Rejection note:', getNoteFromHistory(rejectionItem));
                } else {
                  console.log('No rejected bookings with notes found');
                }
              } else {
                console.log('No status history found in the first booking');
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
  
  // Convert bookings to the format expected by AppointmentCard
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
      
      return {
        service: serviceName,
        provider: providerName,
        providerImage: booking.housekeeper?.profileImage,
        date: formatDate(booking.date),
        time: booking.time || 'N/A',
        location: booking.location || 'N/A',
        status: (booking.status as 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'rejected') || 'pending',
        bookingId: booking._id,
        onViewDetails: () => {
          setSelectedBooking(booking);
          setShowDetailsModal(true);
        }
      };
    });
  };

  // Handler for message button click
  const handleMessageHousekeeper = (housekeeper: any) => {
    if (!housekeeper || !housekeeper._id) return;
    
    // Navigate to messages page with the provider ID as a query parameter
    navigate(`/messages?providerId=${housekeeper._id}`);
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking History</h1>
          <p className="text-gray-600">View your past and upcoming service appointments</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex flex-col lg:flex-row items-start gap-4">
            {/* Search input */}
            <div className="relative flex-grow w-full lg:w-1/3">
              <input
                type="text"
                placeholder="Search by service, provider, location..."
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
                <option value="all">All Bookings</option>
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <FaSpinner className="animate-spin text-4xl text-[#137D13]" />
            </div>
          </div>
        ) : error ? (
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
        ) : filteredBookings.length === 0 ? (
          <div className="bg-yellow-50 rounded-lg p-6 text-center border border-yellow-100">
            <FaInfoCircle className="text-yellow-500 text-2xl mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No bookings found</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === 'all' && !searchTerm
                ? "You don't have any bookings yet." 
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
