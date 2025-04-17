import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

interface EditHomeOwnerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    phone: string;
    houseNumber: string;
    streetName: string;
    barangay: string;
    cityMunicipality: string;
    province: string;
    zipCode: string;
  };
  onSave: (data: EditHomeOwnerProfileModalProps['formData']) => Promise<void>;
}

const EditHomeOwnerProfileModal: React.FC<EditHomeOwnerProfileModalProps> = ({ isOpen, onClose, formData, onSave }) => {
  const [form, setForm] = useState({ ...formData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form when formData prop changes
  useEffect(() => {
    // Ensure the phone number starts with +63 if it's not empty
    let updatedPhone = formData.phone;
    
    if (updatedPhone && !updatedPhone.startsWith('+63')) {
      // If it has digits but doesn't start with +63, add the prefix
      if (/\d/.test(updatedPhone)) {
        // Remove any non-digit characters
        const digits = updatedPhone.replace(/\D/g, '');
        updatedPhone = `+63${digits}`;
      } else {
        updatedPhone = '+63';
      }
    } else if (!updatedPhone) {
      // If it's empty, initialize with +63
      updatedPhone = '+63';
    }
    
    setForm({
      ...formData,
      phone: updatedPhone
    });
  }, [formData]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      // Ensure it always starts with +63
      let phoneValue = value;
      
      // If user tried to delete the +63 prefix, keep it
      if (!phoneValue.startsWith('+63')) {
        phoneValue = '+63' + phoneValue.replace(/\D/g, '');
      }
      
      // Extract just the digits after +63
      const digitsAfterPrefix = phoneValue.substring(3).replace(/\D/g, '');
      
      // Philippine mobile numbers have 10 digits after the country code
      // Format: +63 XXX XXX XXXX (where the first X after +63 is 9)
      if (digitsAfterPrefix.length > 0) {
        // Ensure first digit is 9
        const firstDigit = digitsAfterPrefix.charAt(0);
        let formattedNumber = '+63';
        
        if (firstDigit !== '9' && digitsAfterPrefix.length > 0) {
          // If first digit isn't 9, make it 9
          formattedNumber += '9' + digitsAfterPrefix.substring(Math.min(1, digitsAfterPrefix.length));
        } else {
          formattedNumber += digitsAfterPrefix;
        }
        
        // Limit to the correct length (country code + 10 digits)
        if (digitsAfterPrefix.length > 10) {
          formattedNumber = formattedNumber.substring(0, 13); // +63 (3 chars) + 10 digits = 13 chars
        }
        
        setForm(prev => ({
          ...prev,
          [name]: formattedNumber
        }));
      } else {
        // Just keep the +63 prefix if everything else was deleted
        setForm(prev => ({
          ...prev,
          [name]: '+63'
        }));
      }
    } else {
      // Normal handling for other fields
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#133E87] opacity-30 backdrop-blur-sm"></div>
      
      {/* Modal Container */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
          {/* Header - Fixed */}
          <div className="bg-[#133E87] text-white py-4 px-6 rounded-t-lg flex justify-between items-center">
            <h2 className="text-xl font-semibold">Edit Profile</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Personal Information */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <FaUser className="text-[#133E87] mr-2" />
                  <h3 className="text-lg font-medium">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name (Optional)</label>
                  <input
                    type="text"
                    name="middleName"
                    value={form.middleName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <FaEnvelope className="text-[#133E87] mr-2" size={14} />
                        <span>Email</span>
                      </div>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <FaPhone className="text-[#133E87] mr-2" size={14} />
                        <span>Phone</span>
                      </div>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Philippine mobile format: +63 9XX XXX XXXX</p>
                  </div>
                </div>
              </div>
              
              {/* Address Information */}
              <div>
                <div className="flex items-center mb-4">
                  <FaMapMarkerAlt className="text-[#133E87] mr-2" />
                  <h3 className="text-lg font-medium">Address Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">House/Building Number</label>
                    <input
                      type="text"
                      name="houseNumber"
                      value={form.houseNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                    <input
                      type="text"
                      name="streetName"
                      value={form.streetName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                  <input
                    type="text"
                    name="barangay"
                    value={form.barangay}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City/Municipality</label>
                    <input
                      type="text"
                      name="cityMunicipality"
                      value={form.cityMunicipality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <input
                      type="text"
                      name="province"
                      value={form.province}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={form.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer - Fixed */}
            <div className="py-3 px-6 bg-gray-50 border-t flex justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#133E87] text-white font-medium rounded-md hover:bg-[#3A80D2] transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditHomeOwnerProfileModal; 