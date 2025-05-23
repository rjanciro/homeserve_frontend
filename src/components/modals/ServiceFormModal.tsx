import React, { useState, useEffect, useRef } from 'react';
import { FaSpinner, FaTimes, FaClock } from 'react-icons/fa';
import { Service } from '../services/service.service';

// Define the props for the modal
interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentService: Service | null;
  onSave: (formData: any) => Promise<void>;
  submitting: boolean;
}

// New suggested categories
const serviceCategories = [
  'General Cleaning',
  'Deep Cleaning',
  'Laundry & Ironing',
  'Home Repairs & Maintenance',
  'Outdoor & Garden Work',
  'Pet Services',
  'Event & Special Occasion Help',
  'Organization & Decluttering',
  'Other Services' // Keep 'Other' for edge cases
];

// Only Fixed pricing
const pricingTypes = ['Fixed'];

// Days of the week
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Time options
const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const periods = ['am', 'pm'];

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ 
  isOpen, 
  onClose, 
  currentService, 
  onSave,
  submitting 
}) => {
  // Updated state to include formatted time components
  const [formData, setFormData] = useState({
    name: '', // This will be the "Custom Service Title"
    category: '',
    description: '',
    tags: '', // New field for tags/keywords
    serviceLocation: '',
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
      startHour: '09',
      startMinute: '00',
      startPeriod: 'am',
      endHour: '05',
      endMinute: '00',
      endPeriod: 'pm'
    },
    estimatedCompletionTime: '',
    pricingType: 'Fixed' as 'Fixed',
    price: 0,
    isAvailable: true,
    image: '',
    contactNumber: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Reset form when modal opens or currentService changes
  useEffect(() => {
    if (isOpen) {
      if (currentService) {
        // Parse existing time format (e.g., "09:00" and "17:00")
        let startHour = '09';
        let startMinute = '00';
        let startPeriod = 'am';
        let endHour = '05';
        let endMinute = '00';
        let endPeriod = 'pm';
        
        if (currentService.availability?.startTime) {
          const startMatch = currentService.availability.startTime.match(/(\d+):(\d+)/);
          if (startMatch) {
            const hour = parseInt(startMatch[1], 10);
            startHour = String(hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)).padStart(2, '0');
            startMinute = startMatch[2];
            startPeriod = hour >= 12 ? 'pm' : 'am';
          }
        }
        
        if (currentService.availability?.endTime) {
          const endMatch = currentService.availability.endTime.match(/(\d+):(\d+)/);
          if (endMatch) {
            const hour = parseInt(endMatch[1], 10);
            endHour = String(hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)).padStart(2, '0');
            endMinute = endMatch[2];
            endPeriod = hour >= 12 ? 'pm' : 'am';
          }
        }
        
        setFormData({
          name: currentService.name, // Service Title
          category: currentService.category,
          description: currentService.description,
          tags: currentService.tags || '', // Set tags, default to empty string
          serviceLocation: currentService.serviceLocation,
          availability: {
            monday: currentService.availability.monday,
            tuesday: currentService.availability.tuesday,
            wednesday: currentService.availability.wednesday,
            thursday: currentService.availability.thursday,
            friday: currentService.availability.friday,
            saturday: currentService.availability.saturday,
            sunday: currentService.availability.sunday,
            startHour,
            startMinute,
            startPeriod,
            endHour,
            endMinute,
            endPeriod
          },
          estimatedCompletionTime: currentService.estimatedCompletionTime,
          pricingType: 'Fixed',
          price: currentService.price,
          isAvailable: currentService.isAvailable,
          contactNumber: currentService.contactNumber,
          image: ''
        });
        
        if (currentService.image) {
          setImagePreview(`http://localhost:8080${currentService.image}`);
        } else {
          setImagePreview(null);
        }
      } else {
        // Reset form for new service
        setFormData({
          name: '',
          category: '',
          description: '',
          tags: '', // Reset tags
          serviceLocation: '',
          availability: {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            startHour: '09',
            startMinute: '00',
            startPeriod: 'am',
            endHour: '05',
            endMinute: '00',
            endPeriod: 'pm'
          },
          estimatedCompletionTime: '',
          pricingType: 'Fixed',
          price: 0,
          isAvailable: true,
          contactNumber: '',
          image: ''
        });
        setImagePreview(null);
      }
      // Reset file selection when modal opens
      setSelectedFile(null); 
    }
  }, [isOpen, currentService]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Keep simplified pricing type handling
    if (name === 'pricingType') {
      setFormData({ ...formData, [name]: 'Fixed' });
    } else if (name === 'price') {
      // Handle price input specially to avoid NaN
      const parsedValue = value === '' ? 0 : parseFloat(value);
      setFormData({
        ...formData,
        [name]: isNaN(parsedValue) ? 0 : parsedValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseFloat(value) : value
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleAvailabilityChange = (day: string) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day.toLowerCase()]: !formData.availability[day.toLowerCase() as keyof typeof formData.availability]
      }
    });
  };

  const handleTimeChange = (timeField: string, value: string) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [timeField]: value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a copy of form data for submission
    const submissionData = { ...formData }; 
    
    // Format the time from individual components to 24-hour format
    const formatTime = (hour: string, minute: string, period: string) => {
      let hourNum = parseInt(hour, 10);
      if (period === 'pm' && hourNum < 12) hourNum += 12;
      if (period === 'am' && hourNum === 12) hourNum = 0;
      return `${String(hourNum).padStart(2, '0')}:${minute}`;
    };
    
    // Create a simplified availability object with formatted time
    const availabilityData = {
      ...submissionData.availability,
      startTime: formatTime(
        submissionData.availability.startHour,
        submissionData.availability.startMinute,
        submissionData.availability.startPeriod
      ),
      endTime: formatTime(
        submissionData.availability.endHour,
        submissionData.availability.endMinute,
        submissionData.availability.endPeriod
      )
    };
    
    const formDataWithFile = new FormData();
    
    // Add all form fields, including tags
    Object.entries(submissionData).forEach(([key, value]) => {
      if (key === 'availability') {
        formDataWithFile.append(key, JSON.stringify(availabilityData));
      } else if (value !== null && value !== undefined) { // Ensure value is not null/undefined
        formDataWithFile.append(key, value.toString());
      }
    });
    
    if (selectedFile) {
      formDataWithFile.append('serviceImage', selectedFile);
    }
    
    await onSave(formDataWithFile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={() => !submitting && onClose()} // Prevent closing while submitting
      ></div>
      {/* Modal Content */}
      <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
        <div 
          className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto" // Added max-height and overflow
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 border-b">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {currentService ? 'Edit Service' : 'Add New Service'}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              disabled={submitting}
              aria-label="Close modal"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
            {/* Service Name (Title) */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Service Title*</label>
              <input
                type="text"
                name="name"
                placeholder="e.g., Post-Construction Cleaning, Dog Walking"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Category*</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
              >
                <option value="" disabled>Select a category</option>
                {serviceCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tags/Keywords */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Tags/Keywords (Optional)</label>
              <input
                type="text"
                name="tags"
                placeholder="e.g., pets, gardening, deep clean, residential"
                value={formData.tags}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <p className="mt-1 text-[10px] sm:text-xs text-gray-500">Separate tags with commas.</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Description*</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
                disabled={submitting}
              ></textarea>
            </div>
            
            {/* Service Location */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Service Location*</label>
              <input
                type="text"
                name="serviceLocation"
                value={formData.serviceLocation}
                onChange={handleFormChange}
                placeholder="City name or service radius"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
              />
            </div>
            
            {/* Availability Section */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Availability*</label>
              
              {/* Days of Week */}
              <div className="mb-2 sm:mb-3">
                <label className="block text-gray-700 text-xs sm:text-sm mb-1 sm:mb-2">Days of Week *</label>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleAvailabilityChange(day)}
                      className={`px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                        formData.availability[day.toLowerCase() as keyof typeof formData.availability]
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                      disabled={submitting}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div>
                  <label className="block text-gray-700 text-xs sm:text-sm mb-1 sm:mb-2">Start Time</label>
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <select
                      value={formData.availability.startHour}
                      onChange={(e) => handleTimeChange('startHour', e.target.value)}
                      className="w-1/3 py-1.5 sm:py-2 px-1 sm:px-3 bg-white text-center appearance-none border-r border-gray-300 focus:outline-none text-xs sm:text-sm"
                      disabled={submitting}
                    >
                      {hours.map(hour => (
                        <option key={`start-hour-${hour}`} value={hour}>{hour}</option>
                      ))}
                    </select>
                    <select
                      value={formData.availability.startMinute}
                      onChange={(e) => handleTimeChange('startMinute', e.target.value)}
                      className="w-1/3 py-1.5 sm:py-2 px-1 sm:px-3 bg-white text-center appearance-none border-r border-gray-300 focus:outline-none text-xs sm:text-sm"
                      disabled={submitting}
                    >
                      {minutes.map(minute => (
                        <option key={`start-minute-${minute}`} value={minute}>{minute}</option>
                      ))}
                    </select>
                    <select
                      value={formData.availability.startPeriod}
                      onChange={(e) => handleTimeChange('startPeriod', e.target.value)}
                      className="w-1/3 py-1.5 sm:py-2 px-1 sm:px-3 bg-white text-center appearance-none focus:outline-none text-xs sm:text-sm"
                      disabled={submitting}
                    >
                      {periods.map(period => (
                        <option key={`start-period-${period}`} value={period}>{period}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs sm:text-sm mb-1 sm:mb-2">End Time</label>
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <select
                      value={formData.availability.endHour}
                      onChange={(e) => handleTimeChange('endHour', e.target.value)}
                      className="w-1/3 py-1.5 sm:py-2 px-1 sm:px-3 bg-white text-center appearance-none border-r border-gray-300 focus:outline-none text-xs sm:text-sm"
                      disabled={submitting}
                    >
                      {hours.map(hour => (
                        <option key={`end-hour-${hour}`} value={hour}>{hour}</option>
                      ))}
                    </select>
                    <select
                      value={formData.availability.endMinute}
                      onChange={(e) => handleTimeChange('endMinute', e.target.value)}
                      className="w-1/3 py-1.5 sm:py-2 px-1 sm:px-3 bg-white text-center appearance-none border-r border-gray-300 focus:outline-none text-xs sm:text-sm"
                      disabled={submitting}
                    >
                      {minutes.map(minute => (
                        <option key={`end-minute-${minute}`} value={minute}>{minute}</option>
                      ))}
                    </select>
                    <select
                      value={formData.availability.endPeriod}
                      onChange={(e) => handleTimeChange('endPeriod', e.target.value)}
                      className="w-1/3 py-1.5 sm:py-2 px-1 sm:px-3 bg-white text-center appearance-none focus:outline-none text-xs sm:text-sm"
                      disabled={submitting}
                    >
                      {periods.map(period => (
                        <option key={`end-period-${period}`} value={period}>{period}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Estimated Completion Time */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Estimated Completion Time*</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 mb-2">
                {['1-2 hours', '2-4 hours', 'Half day', 'Full day', '1-2 days', '3-5 days'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData({...formData, estimatedCompletionTime: option})}
                    className={`py-1 sm:py-2 px-2 sm:px-3 border rounded-lg text-xs sm:text-sm transition-colors ${
                      formData.estimatedCompletionTime === option
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    disabled={submitting}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <input
                type="text"
                name="estimatedCompletionTime"
                value={formData.estimatedCompletionTime}
                onChange={handleFormChange}
                placeholder="Or enter custom time estimate"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
              />
            </div>
            
            {/* Price */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Price (₱)* (Fixed)</label>
              <input
                type="number"
                name="price"
                value={formData.price || 0}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
              />
            </div>
            
            {/* Contact Number */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Contact Number (Philippines)*</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 text-xs sm:text-sm">+63</span>
                </div>
                <input
                  type="tel" // Use type="tel" for phone numbers
                  name="contactNumber"
                  value={formData.contactNumber.startsWith('+63') ? formData.contactNumber.substring(3).trim() : formData.contactNumber.trim()}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    // Limit to 10 digits after +63
                    const formattedNumber = cleaned.slice(0, 10); 
                    setFormData({
                      ...formData,
                      contactNumber: `+63${formattedNumber}`
                    });
                  }}
                  className="w-full pl-10 sm:pl-12 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9xx xxx xxxx"
                  // Use pattern to guide input, but validation happens in onChange
                  pattern="\d{10}" 
                  maxLength={10} // Max length for the number part
                  required
                  disabled={submitting}
                />
              </div>
              <p className="mt-1 text-[10px] sm:text-xs text-gray-500">Enter 10 digits (e.g., 9171234567).</p>
            </div>
            
            {/* Service Image Upload */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1">Service Image</label>
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-2">
                  <div className="w-full h-32 sm:h-48 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
                    <img 
                      src={imagePreview} 
                      alt="Service preview" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp, image/gif" // Be more specific with image types
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Basic size validation (e.g., 5MB)
                    if (file.size > 5 * 1024 * 1024) { 
                      alert("File is too large. Maximum size is 5MB.");
                      e.target.value = ''; // Clear the input
                      return;
                    }
                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    // Clear preview if no file selected
                    setSelectedFile(null);
                    setImagePreview(null);
                  }
                }}
                className="block w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                Optional. Max 5MB (JPG, PNG, GIF, WebP).
              </p>
            </div>
            
            {/* Available for Booking Checkbox */}
            <div className="pt-1 sm:pt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={submitting}
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-700">Available for booking</span>
              </label>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2 sm:space-x-3 pt-3 sm:pt-4 border-t mt-3 sm:mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-3 sm:px-4 rounded-lg transition-colors font-medium text-xs sm:text-sm"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-2 px-3 sm:px-4 rounded-lg transition-colors flex justify-center items-center font-medium text-xs sm:text-sm ${
                  submitting 
                  ? 'bg-blue-300 text-white cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Saving...
                  </>
                ) : (
                  currentService ? 'Save Changes' : 'Add Service'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceFormModal;