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
  housekeeperName: string;
  formData?: {
    selectedServiceId: string;
    date: string;
    time: string;
    duration: number;
    location: string;
    notes: string;
    housekeeperId: string;
    housekeeperName: string;
  };
  estimatedPrice?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit?: (e: React.FormEvent) => void;
  getProfileImageUrl?: (imagePath: string | undefined) => string;
  getServiceImageUrl?: (imagePath: string | undefined) => string | null;
  housekeeper?: Housekeeper | null;
}

// Fix the API URL to ensure it has the correct format
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onClose, 
  service, 
  housekeeperName,
  formData,
  estimatedPrice,
  onChange,
  onSubmit,
  getProfileImageUrl,
  housekeeper
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

  if (!isOpen || !service) return null;

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

    if (!date && !formData?.date) {
      newErrors.date = 'Please select a date';
      isValid = false;
    }

    if (!time && !formData?.time) {
      newErrors.time = 'Please select a time';
      isValid = false;
    }

    if (!location && !formData?.location) {
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

  const handleDefaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== BOOKING SUBMISSION STARTED ===');
    console.log('Form submission started');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      toast.error('Please fill in all required fields correctly.');
      return;
    }
    
    // Double check the contact phone before submitting
    if (!contactPhone) {
      alert('Contact phone number is required!');
      return;
    }
    
    // Check authentication token
    const authHeaders = getAuthHeader();
    console.log('Auth headers:', authHeaders);
    const token = localStorage.getItem('token');
    console.log('Token in localStorage:', token ? 'Present' : 'Missing');
    
    if (!authHeaders.Authorization) {
      toast.error('You must be logged in to book a service');
      console.error('Missing authentication token');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the serviceId from the service object
      const serviceId = service._id;
      console.log('Service ID:', serviceId);
      
      if (!serviceId) {
        throw new Error('Service ID is missing');
      }
      
      // Prepare the booking payload
      const bookingPayload = {
        serviceId,
        date: formData?.date || date,
        time: formData?.time || time,
        location: formData?.location || location,
        contactPhone, // This is critical - must have a value
        notes: formData?.notes || notes
      };
      
      console.log('Submitting booking to API:', bookingPayload);
      console.log('API URL being used:', `${API_URL}/bookings`);
      console.log('Full request:', {
        url: `${API_URL}/bookings`,
        method: 'POST',
        headers: authHeaders,
        data: bookingPayload
      });
      
      // Send booking request to the backend API
      console.log('Sending axios request now...');
      const response = await axios.post(`${API_URL}/bookings`, bookingPayload, { 
        headers: authHeaders
      });
      
      console.log('Booking response received:', response.status);
      console.log('Booking response data:', response.data);
      
      toast.success('Booking request sent successfully!');
      onClose();
      
      // Reset form
      setDate('');
      setTime('');
      setLocation('');
      setContactPhone('');
      setNotes('');
      console.log('=== BOOKING SUBMISSION COMPLETED SUCCESSFULLY ===');
    } catch (error: any) {
      console.error('=== BOOKING SUBMISSION FAILED ===');
      console.error('Error booking service:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      console.error('Error status:', error.response?.status);
      
      if (error.response?.data?.message) {
        toast.error(`Booking failed: ${error.response.data.message}`);
      } else {
        toast.error('Failed to book service. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get default profile image if needed
  const getDefaultProfileImage = () => {
    if (getProfileImageUrl && housekeeper?.image) {
      return getProfileImageUrl(housekeeper.image);
    }
    return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
  };

  // ALWAYS use our own submit handler first, then call the parent onSubmit if provided
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First handle the submission internally with our API call
    await handleDefaultSubmit(e);
    
    // Then call the parent's onSubmit if provided (for state updates, etc.)
    if (onSubmit) {
      onSubmit(e);
    }
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

        <form onSubmit={handleSubmitForm}>
          <div className="p-6 max-h-[calc(90vh-10rem)] overflow-y-auto">
            <div className="bg-blue-50 p-4 rounded-md mb-4 border border-blue-200">
              <div className="flex items-start mb-2">
                {housekeeper && (
                  <img
                    src={getDefaultProfileImage()}
                    alt={housekeeper.name}
                    className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
                  />
                )}
                <div>
                  <p className="font-medium text-blue-800">{service?.name}</p>
                  <p className="text-sm text-blue-700">By: {housekeeperName || (housekeeper?.name || 'Service Provider')}</p>
                  <p className="text-sm text-blue-700">{service?.category} • {service?.estimatedCompletionTime}</p>
                  <p className="text-lg font-semibold text-blue-900 mt-1">₱{estimatedPrice || service?.price}</p>
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
                  name="date"
                  value={formData?.date || date}
                  onChange={onChange || ((e) => setDate(e.target.value))}
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
                  name="time"
                  value={formData?.time || time}
                  onChange={onChange || ((e) => setTime(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87] ${
                    errors.time ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.time && <p className="mt-1 text-xs text-red-500">{errors.time}</p>}
              </div>
            </div>
            
            {/* Location input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMapMarkerAlt className="inline mr-2 text-blue-500" />
                Service Location*
              </label>
              <input
                type="text"
                name="location"
                value={formData?.location || location}
                onChange={onChange || ((e) => setLocation(e.target.value))}
                placeholder="Enter the complete address"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87] ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
            </div>
            
            {/* Contact Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaPhone className="inline mr-2 text-blue-500" />
                Contact Number*
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
            
            {/* Notes textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCommentAlt className="inline mr-2 text-blue-500" />
                Special Instructions (Optional)
              </label>
              <textarea
                name="notes"
                value={formData?.notes || notes}
                onChange={onChange || ((e) => setNotes(e.target.value))}
                rows={3}
                placeholder="Any special instructions or requests..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              ></textarea>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#133E87] text-white font-medium py-3 px-4 rounded-md hover:bg-[#0f2f66] transition-colors focus:outline-none focus:ring-2 focus:ring-[#133E87] focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Submitting...
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