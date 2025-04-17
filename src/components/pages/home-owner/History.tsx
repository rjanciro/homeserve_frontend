import React, { useState, useEffect } from 'react';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import axios from 'axios';
import { getAuthHeader } from '../../utils/auth';
import toast from 'react-hot-toast';

// Define booking interface
interface Booking {
  _id: string;
  service: {
    _id: string;
    name: string;
    category: string;
  };
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    businessName?: string;
  };
  date: string;
  time: string;
  location: string;
  status: string;
  createdAt: string;
}

interface AppointmentCardProps {
  service: string;
  provider: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'rejected';
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  service, 
  provider, 
  date, 
  time, 
  location, 
  status 
}) => {
  // Status colors mapping
  const statusColors = {
    upcoming: 'bg-blue-50 text-blue-600',
    pending: 'bg-yellow-50 text-yellow-600',
    confirmed: 'bg-blue-50 text-blue-600',
    completed: 'bg-green-50 text-green-600',
    cancelled: 'bg-red-50 text-red-600',
    rejected: 'bg-red-50 text-red-600'
  };

  const displayStatus = status === 'pending' || status === 'confirmed' ? 'upcoming' : status;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <FaCalendar className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{service}</h3>
            <p className="text-gray-600">{provider}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-50 text-gray-600'}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center text-gray-600">
          <FaClock className="w-4 h-4 mr-2" />
          <span>{date} - {time}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <FaMapMarkerAlt className="w-4 h-4 mr-2" />
          <span>{location}</span>
        </div>
      </div>
    </div>
  );
};

const MyAppointmentsPage: React.FC = () => {
  useDocumentTitle('My Appointments');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/bookings/customer`, {
          headers: getAuthHeader()
        });
        
        if (response.data) {
          setBookings(response.data);
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
  
  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Convert bookings to the format expected by AppointmentCard
  const getAppointmentCards = () => {
    return bookings.map(booking => ({
      service: booking.service.name,
      provider: booking.provider.businessName || 
               `${booking.provider.firstName} ${booking.provider.lastName}`,
      date: formatDate(booking.date),
      time: booking.time,
      location: booking.location,
      status: booking.status as 'upcoming' | 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'rejected'
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">History</h1>
        <p className="text-gray-600">View your service appointments history</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin h-8 w-8 text-green-500" />
        </div>
      ) : error ? (
        <div className="text-center p-6 bg-red-50 rounded-lg text-red-600">
          {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600">You don't have any bookings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getAppointmentCards().map((appointment, index) => (
            <AppointmentCard key={bookings[index]._id} {...appointment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointmentsPage;
