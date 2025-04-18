import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaCommentAlt, FaSpinner, FaPhone } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getAuthHeader } from '../utils/auth';
import axios from 'axios';
import { Service } from '../services/service.service';
import { Housekeeper } from '../pages/home-owner/OneTimeBooking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  housekeeper: Housekeeper | null;
  getProfileImageUrl?: (imagePath: string | undefined) => string;
  getServiceImageUrl?: (imagePath: string | undefined) => string | null;
}

// Fix the API URL to ensure it has the correct format
const API_URL = 'http://localhost:8080';

const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onClose, 
  service, 
  housekeeper,
  getProfileImageUrl
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    date: '',
    time: '',
    location: '',
    contactPhone: ''
  });

  if (!isOpen || !service || !housekeeper) return null;

  // Format the phone number as it's being typed
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Strip all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Format the number
    if (numericValue.length > 0) {
      // For numbers starting with 0 or 63
      if (numericValue.startsWith('0') && numericValue.length <= 11) {
        // Format as 09XX XXX XXXX
        if (numericValue.length > 4 && numericValue.length <= 7) {
          value = `${numericValue.slice(0, 4)} ${numericValue.slice(4)}`;
        } else if (numericValue.length > 7) {
          value = `${numericValue.slice(0, 4)} ${numericValue.slice(4, 7)} ${numericValue.slice(7, 11)}`;
        } else {
          value = numericValue;
        }
      } else if (numericValue.startsWith('63') && numericValue.length <= 12) {
        // Format as +63 9XX XXX XXXX
        const remainingDigits = numericValue.slice(2);
        if (remainingDigits.length > 3 && remainingDigits.length <= 6) {
          value = `+63 ${remainingDigits.slice(0, 3)} ${remainingDigits.slice(3)}`;
        } else if (remainingDigits.length > 6) {
          value = `+63 ${remainingDigits.slice(0, 3)} ${remainingDigits.slice(3, 6)} ${remainingDigits.slice(6, 10)}`;
        } else {
          value = `+63 ${remainingDigits}`;
        }
      } else if (numericValue.startsWith('9') && numericValue.length <= 10) {
        // Handle if user starts with 9 (without 0)
        if (numericValue.length > 3 && numericValue.length <= 6) {
          value = `09${numericValue.slice(0, 2)} ${numericValue.slice(2)}`;
        } else if (numericValue.length > 6) {
          value = `09${numericValue.slice(0, 2)} ${numericValue.slice(2, 5)} ${numericValue.slice(5, 9)}`;
        } else {
          value = `09${numericValue}`;
        }
      } else {
        // If it doesn't match our expected formats, just use the numeric value
        value = numericValue;
      }
    }
    
    setContactPhone(value);
  };

  const validateForm = () => {
    const newErrors = {
      date: '',
      time: '',
      location: '',
      contactPhone: ''
    };
    let isValid = true;

    if (!date) {
      newErrors.date = 'Please select a date';
      isValid = false;
    }

    if (!time) {
      newErrors.time = 'Please select a time';
      isValid = false;
    }

    if (!location) {
      newErrors.location = 'Please enter a location';
      isValid = false;
    }

    // Validate Philippine phone number
    if (!contactPhone) {
      newErrors.contactPhone = 'Please enter your contact phone number';
      isValid = false;
    } else {
      // Remove spaces and other formatting characters
      const strippedPhone = contactPhone.replace(/\s+|-|\(|\)/g, '');
      
      // Check for valid Philippine mobile number format
      const isValidPhilippineMobile = 
        /^(09\d{9}|\+639\d{9}|639\d{9})$/.test(strippedPhone);
      
      if (!isValidPhilippineMobile) {
        newErrors.contactPhone = 'Please enter a valid Philippine mobile number (e.g., 09XX XXX XXXX or +63 9XX XXX XXXX)';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get the serviceId from the service object
      const serviceId = service._id || service.id;
      
      // Send booking request to the backend API - simplified payload to match backend expectations
      await axios.post(`${API_URL}/api/bookings`, {
        serviceId,
        date,
        time,
        location,
        contactPhone,
        notes
      }, { headers: getAuthHeader() });
      
      toast.success('Booking request sent successfully!');
      onClose();
      
      // Reset form
      setDate('');
      setTime('');
      setLocation('');
      setContactPhone('');
      setNotes('');
    } catch (error) {
      console.error('Error booking service:', error);
      toast.error('Failed to book service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get default profile image if needed
  const getDefaultProfileImage = () => {
    if (getProfileImageUrl && housekeeper.image) {
      return getProfileImageUrl(housekeeper.image);
    }
    return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Book Service</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[calc(90vh-10rem)] overflow-y-auto">
            <div className="bg-blue-50 p-4 rounded-md mb-4 border border-blue-200">
              <div className="flex items-start mb-2">
                <img
                  src={getDefaultProfileImage()}
                  alt={housekeeper.name}
                  className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
                />
                <div>
                  <p className="font-medium text-blue-800">{service.name}</p>
                  <p className="text-sm text-blue-700">By: {housekeeper.name}</p>
                  <p className="text-sm text-blue-700">{service.category} • {service.estimatedCompletionTime}</p>
                  <p className="text-lg font-semibold text-blue-900 mt-1">₱{service.price}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-2 text-blue-500" />
                  Date*
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87] ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaClock className="inline mr-2 text-blue-500" />
                  Time*
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87] ${
                    errors.time ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.time && <p className="mt-1 text-xs text-red-500">{errors.time}</p>}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMapMarkerAlt className="inline mr-2 text-blue-500" />
                Your Location*
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Your full address for the service"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87] ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaPhone className="inline mr-2 text-blue-500" />
                Contact Phone Number*
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={handlePhoneChange}
                placeholder="09XX XXX XXXX"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87] ${
                  errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>}
              <p className="mt-1 text-xs text-gray-500">Format: 09XX XXX XXXX or +63 9XX XXX XXXX</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCommentAlt className="inline mr-2 text-blue-500" />
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                placeholder="Special instructions, e.g., 'Focus on the kitchen', 'We have a friendly dog'"
              ></textarea>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center font-medium mb-2">
              <span>Total Price:</span>
              <span className="text-xl text-[#133E87]">₱{service.price}</span>
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#133E87] text-white py-2 rounded-lg hover:bg-[#0f2f66] font-semibold flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal; 