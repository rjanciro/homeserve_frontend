import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaCommentAlt, FaSpinner, FaPhone } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getAuthHeader } from '../utils/auth';
import axios from 'axios';

interface ServiceProvider {
  id: string;
  _id?: string;
  name: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  image: string;
  category: string;
  description: string;
  providerName?: string;
  businessName?: string;
  contactNumber?: string;
  pricingType?: string;
  estimatedCompletionTime?: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ServiceProvider;
}

// Fix the API URL to ensure it has the correct format
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, provider }) => {
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

  if (!isOpen) return null;

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
      // Use the provider._id or id property for the serviceId
      const serviceId = provider._id || provider.id;
      
      // Send booking request to the backend API
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

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <img src={provider.image} alt={provider.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <h3 className="font-medium text-gray-900">{provider.name}</h3>
              <p className="text-sm text-gray-600">{provider.category}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Rate:</span> ₱{provider.hourlyRate}
              {provider.pricingType === 'Hourly' ? '/hr' : ' fixed'}
            </div>
            {provider.estimatedCompletionTime && (
              <div>
                <span className="font-medium">Est. Time:</span> {provider.estimatedCompletionTime}
              </div>
            )}
            {provider.businessName && (
              <div className="col-span-2">
                <span className="font-medium">Business:</span> {provider.businessName}
              </div>
            )}
            {provider.providerName && (
              <div className="col-span-2">
                <span className="font-medium">Provider:</span> {provider.providerName}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline mr-2 text-green-500" />
                Preferred Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaClock className="inline mr-2 text-green-500" />
                Preferred Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                  errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.time && <p className="mt-1 text-sm text-red-500">{errors.time}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMapMarkerAlt className="inline mr-2 text-green-500" />
                Service Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your address"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaPhone className="inline mr-2 text-green-500" />
                Contact Phone Number
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={handlePhoneChange}
                placeholder="09XX XXX XXXX"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                  errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.contactPhone && <p className="mt-1 text-sm text-red-500">{errors.contactPhone}</p>}
              <p className="mt-1 text-xs text-gray-500">Format: 09XX XXX XXXX or +63 9XX XXX XXXX</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCommentAlt className="inline mr-2 text-green-500" />
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your service needs or any special instructions"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex justify-center items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Booking...
                </>
              ) : (
                'Book Now'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal; 