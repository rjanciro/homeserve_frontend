import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaCalendarTimes, FaClipboardCheck, FaClock, FaMapMarkerAlt, FaUser, FaSpinner, FaInfoCircle, FaPhone, FaCommentAlt } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// Define types
interface BookingRequest {
  id: string;
  clientName: string;
  clientId: string;
  clientImage?: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'canceled';
  totalAmount: number;
  createdAt: string;
  statusHistory: {
    status: string;
    date: string;
    note?: string;
  }[];
}

const BookingRequests: React.FC = () => {
  useDocumentTitle('One Time Book Requests');
  
  // State for booking requests, filters, selected booking
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BookingRequest[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Status colors mapping
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    canceled: 'bg-gray-100 text-gray-800'
  };

  // Fetch booking requests
  useEffect(() => {
    // Simulate API call
    const fetchBookingRequests = async () => {
      setLoading(true);
      try {
        // This would be an actual API call in production
        // const response = await bookingService.getHousekeeperBookingRequests();
        // setBookingRequests(response.data);
        
        // Mock data for development
        setTimeout(() => {
          const mockBookings: BookingRequest[] = [
            {
              id: 'book1',
              clientName: 'Juan Dela Cruz',
              clientId: 'client1',
              clientImage: '',
              clientPhone: '+63 919 123 4567',
              service: 'Deep Cleaning',
              date: '2023-06-15',
              time: '09:00',
              duration: 3,
              location: '123 Sampaguita St., Quezon City',
              notes: 'Please bring your own cleaning supplies. Focus on kitchen and bathrooms.',
              status: 'pending',
              totalAmount: 750, // 250/hr * 3hrs
              createdAt: '2023-06-12T08:30:00Z',
              statusHistory: [
                { status: 'pending', date: '2023-06-12T08:30:00Z' }
              ]
            },
            {
              id: 'book2',
              clientName: 'Maria Santos',
              clientId: 'client2',
              clientImage: '',
              clientPhone: '+63 919 987 6543',
              service: 'Regular Cleaning',
              date: '2023-06-18',
              time: '13:00',
              duration: 4,
              location: '456 Orchid Ave., Makati City',
              notes: 'I have pets (2 cats), please be careful when entering.',
              status: 'accepted',
              totalAmount: 800, // 200/hr * 4hrs
              createdAt: '2023-06-14T10:15:00Z',
              statusHistory: [
                { status: 'pending', date: '2023-06-14T10:15:00Z' },
                { status: 'accepted', date: '2023-06-14T14:30:00Z' }
              ]
            },
            {
              id: 'book3',
              clientName: 'Roberto Reyes',
              clientId: 'client3',
              clientImage: '',
              clientPhone: '+63 919 456 7890',
              service: 'Laundry & Ironing',
              date: '2023-06-20',
              time: '10:00',
              duration: 2,
              location: '789 Rose St., Pasig City',
              notes: 'Approximately 4 loads of laundry.',
              status: 'completed',
              totalAmount: 500, // 250/hr * 2hrs
              createdAt: '2023-06-15T09:00:00Z',
              statusHistory: [
                { status: 'pending', date: '2023-06-15T09:00:00Z' },
                { status: 'accepted', date: '2023-06-15T11:45:00Z' },
                { status: 'completed', date: '2023-06-20T12:30:00Z' }
              ]
            },
            {
              id: 'book4',
              clientName: 'Elena Garcia',
              clientId: 'client4',
              clientImage: '',
              clientPhone: '+63 919 789 0123',
              service: 'Deep Cleaning',
              date: '2023-06-25',
              time: '08:00',
              duration: 5,
              location: '101 Jasmine Rd., Taguig City',
              notes: 'Moving out cleaning, need property to be spotless for inspection.',
              status: 'pending',
              totalAmount: 1250, // 250/hr * 5hrs
              createdAt: '2023-06-17T13:20:00Z',
              statusHistory: [
                { status: 'pending', date: '2023-06-17T13:20:00Z' }
              ]
            },
            {
              id: 'book5',
              clientName: 'Diego Mendoza',
              clientId: 'client5',
              clientImage: '',
              clientPhone: '+63 919 234 5678',
              service: 'Regular Cleaning',
              date: '2023-06-22',
              time: '14:00',
              duration: 3,
              location: '202 Daisy Blvd., Marikina City',
              notes: '',
              status: 'rejected',
              totalAmount: 600, // 200/hr * 3hrs
              createdAt: '2023-06-16T16:45:00Z',
              statusHistory: [
                { status: 'pending', date: '2023-06-16T16:45:00Z' },
                { status: 'rejected', date: '2023-06-17T09:10:00Z', note: 'Schedule conflict' }
              ]
            }
          ];
          
          setBookingRequests(mockBookings);
          setFilteredRequests(mockBookings);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching booking requests:', error);
        toast.error('Failed to load booking requests');
        setLoading(false);
      }
    };
    
    fetchBookingRequests();
  }, []);

  // Filter booking requests
  useEffect(() => {
    let filtered = [...bookingRequests];
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === activeFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.clientName.toLowerCase().includes(term) ||
        booking.service.toLowerCase().includes(term) ||
        booking.location.toLowerCase().includes(term)
      );
    }
    
    setFilteredRequests(filtered);
  }, [activeFilter, searchTerm, bookingRequests]);

  // Handle status change
  const handleStatusChange = (bookingId: string, newStatus: BookingRequest['status'], note?: string) => {
    // In production, this would be an API call
    // Example: await bookingService.updateBookingStatus(bookingId, newStatus, note);
    
    // Update local state
    setBookingRequests(prevBookings => {
      return prevBookings.map(booking => {
        if (booking.id === bookingId) {
          const updatedStatusHistory = [
            ...booking.statusHistory,
            { 
              status: newStatus, 
              date: new Date().toISOString(),
              note 
            }
          ];
          
          return {
            ...booking,
            status: newStatus,
            statusHistory: updatedStatusHistory
          };
        }
        return booking;
      });
    });
    
    setShowDetailsModal(false);
    toast.success(`Booking ${newStatus} successfully`);
  };

  // View booking details
  const viewBookingDetails = (booking: BookingRequest) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-[#137D13] text-3xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">One Time Book Requests</h1>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'all' 
                  ? 'bg-[#137D13] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'pending' 
                  ? 'bg-[#137D13] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter('accepted')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'accepted' 
                  ? 'bg-[#137D13] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'completed' 
                  ? 'bg-[#137D13] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, service, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#137D13]"
            />
          </div>
        </div>
      </div>
      
      {/* Booking Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaCalendarTimes className="text-gray-400 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No booking requests found</h3>
          <p className="text-gray-500">
            {activeFilter !== 'all' 
              ? `You don't have any ${activeFilter} booking requests at the moment.` 
              : 'You don\'t have any booking requests at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((booking) => (
            <div 
              key={booking.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                  <div className="flex items-center mb-2 md:mb-0">
                    <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex-shrink-0 overflow-hidden">
                      {booking.clientImage ? (
                        <img 
                          src={booking.clientImage} 
                          alt={booking.clientName} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-bold">
                          {booking.clientName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{booking.clientName}</h3>
                      <p className="text-sm text-gray-600">{booking.service}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-start">
                    <FaCalendarCheck className="w-4 h-4 mt-1 mr-2 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date & Time</p>
                      <p className="text-sm text-gray-600">{formatDate(booking.date)} at {formatTime(booking.time)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaClock className="w-4 h-4 mt-1 mr-2 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Duration</p>
                      <p className="text-sm text-gray-600">{booking.duration} hour{booking.duration > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Location</p>
                      <p className="text-sm text-gray-600 truncate">{booking.location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-between items-center">
                  <div className="mb-2 md:mb-0">
                    <p className="text-lg font-bold text-[#137D13]">₱{booking.totalAmount}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'accepted')}
                          className="px-4 py-2 bg-[#137D13] text-white rounded-md hover:bg-[#0f670f] transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt('Reason for rejection:');
                            if (note !== null) {
                              handleStatusChange(booking.id, 'rejected', note);
                            }
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'accepted' && (
                      <button
                        onClick={() => handleStatusChange(booking.id, 'completed')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                    
                    <button
                      onClick={() => viewBookingDetails(booking)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Booking Details</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-300 mr-4 flex-shrink-0 overflow-hidden">
                  {selectedBooking.clientImage ? (
                    <img 
                      src={selectedBooking.clientImage} 
                      alt={selectedBooking.clientName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-bold">
                      {selectedBooking.clientName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedBooking.clientName}</h3>
                  <div className="flex mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedBooking.status]}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      Requested on {formatDate(selectedBooking.createdAt.split('T')[0])}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <div className="flex items-start">
                  <FaUser className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Service</p>
                    <p className="text-base">{selectedBooking.service}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaPhone className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact Number</p>
                    <p className="text-base">{selectedBooking.clientPhone}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaCalendarCheck className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Date & Time</p>
                    <p className="text-base">{formatDate(selectedBooking.date)} at {formatTime(selectedBooking.time)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaClock className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Duration</p>
                    <p className="text-base">{selectedBooking.duration} hour{selectedBooking.duration > 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div className="flex items-start md:col-span-2">
                  <FaMapMarkerAlt className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-base">{selectedBooking.location}</p>
                  </div>
                </div>
                
                {selectedBooking.notes && (
                  <div className="flex items-start md:col-span-2">
                    <FaCommentAlt className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Notes</p>
                      <p className="text-base">{selectedBooking.notes}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start md:col-span-2">
                  <FaInfoCircle className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment</p>
                    <p className="text-xl font-bold text-[#137D13]">₱{selectedBooking.totalAmount}</p>
                    <p className="text-xs text-gray-500">
                      To be paid by client after service completion
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Status History */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">Status History</h4>
                <div className="space-y-4">
                  {selectedBooking.statusHistory.map((history, index) => (
                    <div 
                      key={index} 
                      className="flex items-start"
                    >
                      <div className="mr-3 mt-0.5">
                        <div className="w-4 h-4 rounded-full bg-[#137D13]"></div>
                        {index < selectedBooking.statusHistory.length - 1 && (
                          <div className="w-0.5 bg-gray-200 h-full ml-[7px] -mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                          {history.note && <span className="font-normal text-gray-500"> - {history.note}</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(history.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {selectedBooking.status === 'pending' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'accepted')}
                    className="flex-1 bg-[#137D13] text-white py-2 px-4 rounded-md hover:bg-[#0f670f] transition-colors"
                  >
                    Accept Booking
                  </button>
                  <button
                    onClick={() => {
                      const note = prompt('Reason for rejection:');
                      if (note !== null) {
                        handleStatusChange(selectedBooking.id, 'rejected', note);
                      }
                    }}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Reject Booking
                  </button>
                </div>
              )}
              
              {selectedBooking.status === 'accepted' && (
                <button
                  onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                  className="w-full bg-[#137D13] text-white py-2 px-4 rounded-md hover:bg-[#0f670f] transition-colors"
                >
                  Mark as Completed
                </button>
              )}
              
              {(selectedBooking.status === 'completed' || selectedBooking.status === 'rejected' || selectedBooking.status === 'canceled') && (
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingRequests;
