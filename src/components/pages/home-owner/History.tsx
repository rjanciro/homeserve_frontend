import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaSpinner, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaCheck, FaBan, FaFilter, FaEye } from 'react-icons/fa';
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

  // Get status color based on status
  const getStatusColorClass = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <FaCalendar className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{service}</h3>
            <p className="text-gray-600">{provider}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColorClass(status)}`}>
          {statusIcons[status as keyof typeof statusIcons]}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center text-gray-600">
          <FaClock className="w-4 h-4 mr-2 text-gray-500" />
          <span>{date} at {time}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-500" />
          <span>{location}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
        <button 
          onClick={onViewDetails}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <FaEye className="mr-1.5" />
          View Details
        </button>
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
  useDocumentTitle('My Appointments');
  
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
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
  
  // Apply status filter
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === statusFilter));
    }
  }, [statusFilter, bookings]);
  
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
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Booking History</h1>
            <p className="text-gray-600">View your service appointments history</p>
          </div>
          
          <div className="mt-4 md:mt-0 relative">
            <div className="flex items-center">
              <FaFilter className="absolute left-3 top-3 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin h-8 w-8 text-green-500" />
          </div>
        ) : error ? (
          <div className="text-center p-6 bg-red-50 rounded-lg text-red-600">
            {error}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">
              {statusFilter === 'all' 
                ? "You don't have any bookings yet." 
                : `You don't have any ${statusFilter} bookings.`}
            </p>
            {statusFilter !== 'all' && (
              <button 
                onClick={() => setStatusFilter('all')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                View all bookings
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getAppointmentCards().map((appointment, index) => (
              <AppointmentCard key={filteredBookings[index]._id} {...appointment} />
            ))}
          </div>
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
