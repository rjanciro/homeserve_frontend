import React, { useEffect, useState } from 'react';
import { FaCalendar, FaTools, FaStar, FaUserClock, FaSpinner, FaCalendarCheck, FaCalendarAlt, FaArrowRight, FaMapMarkerAlt, FaClock, FaUser, FaComments } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import axios from 'axios';
import { getAuthHeader } from '../../../components/utils/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface User {
  userType: 'homeowner' | 'housekeeper';
  firstName: string;
  lastName: string;
  _id: string;
}

interface Booking {
  _id: string;
  customer: {
    firstName: string;
    lastName: string;
    profileImage?: string;
    _id: string;
  };
  service: {
    name: string;
    price: number;
  };
  date: string;
  time: string;
  location: string;
  status: string;
}

interface DashboardStats {
  pendingRequests: number;
  todayAppointments: number;
  averageRating: number;
}

const HousekeeperDashboard: React.FC = () => {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    todayAppointments: 0,
    averageRating: 0
  });
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch bookings
        const bookingsResponse = await axios.get(
          `${API_URL}/bookings/housekeeper`,
          { headers: getAuthHeader() }
        );
        
        if (Array.isArray(bookingsResponse.data)) {
          const allBookings = bookingsResponse.data;
          
          // Calculate stats
          const pending = allBookings.filter(b => b.status === 'pending').length;
          
          // Check for today's appointments
          const today = new Date().toISOString().split('T')[0];
          const todaysAppointments = allBookings.filter(b => 
            new Date(b.date).toISOString().split('T')[0] === today && 
            (b.status === 'confirmed' || b.status === 'pending')
          ).length;
          
          // Get upcoming bookings (confirmed or pending, sorted by date)
          const upcoming = allBookings
            .filter(b => b.status === 'confirmed' || b.status === 'pending')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5); // Get only the next 5 upcoming bookings
          
          setUpcomingBookings(upcoming);
          
          // Fetch ratings (could be a separate endpoint in a real app)
          // For now, let's simulate an average rating
          const averageRating = 4.8; // Placeholder
          
          setStats({
            pendingRequests: pending,
            todayAppointments: todaysAppointments,
            averageRating: averageRating
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
        toast.error('Failed to load dashboard data');
      }
    };
    
    fetchDashboardData();
  }, [API_URL, user]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const bookingDate = new Date(dateString);
    
    if (bookingDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (bookingDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return bookingDate.toLocaleDateString(undefined, options);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  const handleViewBookings = () => {
    navigate('/housekeeper/booking-requests');
  };

  const handleMessageClick = (customerId: string) => {
    navigate(`/housekeeper/messages?customerId=${customerId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-6 rounded-lg flex flex-col items-center">
          <FaSpinner className="animate-spin text-[#137D13] text-4xl mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-700 max-w-4xl mx-auto">
        <h3 className="font-semibold text-lg mb-2">Error Loading Dashboard</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's an overview of your business today
            </p>
          </div>
          <button 
            onClick={handleViewBookings}
            className="flex items-center px-5 py-2.5 bg-[#137D13] text-white rounded-lg hover:bg-[#0c5c0c] transition duration-200 shadow-sm"
          >
            View Booking Requests
            <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUserClock className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Requests</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.pendingRequests}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="bg-[#e8f5e8] p-3 rounded-full">
              <FaCalendarCheck className="text-[#137D13] w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Today's Appointments</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.todayAppointments}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <FaStar className="text-yellow-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Average Rating</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.averageRating.toFixed(1)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            <FaCalendarAlt className="inline-block mr-2 text-[#137D13]" /> 
            Upcoming Appointments
          </h2>
          <button 
            onClick={handleViewBookings}
            className="text-[#137D13] hover:text-[#0c5c0c] font-medium text-sm flex items-center"
          >
            View All <FaArrowRight className="ml-1 text-xs" />
          </button>
        </div>
        
        {upcomingBookings.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <FaCalendar className="text-gray-400 text-4xl mx-auto mb-3" />
            <p className="text-gray-500">No upcoming appointments</p>
            <p className="text-gray-400 text-sm mt-1">New booking requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div 
                key={booking._id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors hover:border-gray-200"
              >
                <div className="flex items-start gap-3 mb-3 sm:mb-0">
                  <div className="bg-[#e8f5e8] p-2.5 rounded-full flex-shrink-0">
                    <FaTools className="text-[#137D13] w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{booking.service.name}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                      <p className="flex items-center">
                        <FaUser className="mr-1 text-xs text-gray-400" />
                        {booking.customer.firstName} {booking.customer.lastName}
                      </p>
                      <p className="flex items-center">
                        <FaMapMarkerAlt className="mr-1 text-xs text-gray-400" />
                        {booking.location.split(',')[0]}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center sm:mr-4">
                    <FaClock className="text-[#137D13] mr-1 text-xs" />
                    <span className="text-sm">
                      {formatTime(booking.time)}, {formatDate(booking.date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    
                    <button
                      onClick={() => booking.customer._id && handleMessageClick(booking.customer._id)}
                      className="p-1.5 text-[#137D13] hover:bg-[#e8f5e8] rounded-full transition-colors"
                      title="Message customer"
                    >
                      <FaComments className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HousekeeperDashboard;