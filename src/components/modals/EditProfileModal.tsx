import React, { useState, useEffect, KeyboardEvent } from 'react';
import { FaTimes, FaSpinner, FaTools, FaPhone, FaEnvelope, FaTimes as FaClose } from 'react-icons/fa';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    houseNumber: string;
    streetName: string;
    barangay: string;
    cityMunicipality: string;
    province: string;
    zipCode: string;
    bio: string;
    // Make all type-specific fields optional
    specialties?: string;
  };
  onSave: (data: EditProfileModalProps['formData']) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, formData, onSave }) => {
  const [editFormData, setEditFormData] = useState({ ...formData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tags state
  const [specialtyTags, setSpecialtyTags] = useState<string[]>([]);
  
  // Tag input state
  const [specialtyInput, setSpecialtyInput] = useState('');

  // Update local form data when parent formData changes
  useEffect(() => {
    if (isOpen) {
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
      
      setEditFormData({
        ...formData,
        phone: updatedPhone
      });
      
      // Initialize tags from string values if they exist
      if (formData.specialties) {
        const specTags = formData.specialties.split(',').map(tag => tag.trim()).filter(tag => tag);
        setSpecialtyTags(specTags);
      } else {
        setSpecialtyTags([]);
      }
    }
  }, [formData, isOpen]);
  
  // Update string form data fields when tags change
  useEffect(() => {
    setEditFormData(prev => ({
      ...prev,
      specialties: specialtyTags.join(', ')
    }));
  }, [specialtyTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        
        setEditFormData(prev => ({
          ...prev,
          [name]: formattedNumber
        }));
      } else {
        // Just keep the +63 prefix if everything else was deleted
        setEditFormData(prev => ({
          ...prev,
          [name]: '+63'
        }));
      }
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };
  
  // Tag handling functions
  const handleSpecialtyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpecialtyInput(e.target.value);
  };
  
  const addSpecialtyTag = () => {
    if (specialtyInput.trim() !== '') {
      setSpecialtyTags([...specialtyTags, specialtyInput.trim()]);
      setSpecialtyInput('');
    }
  };
  
  const removeSpecialtyTag = (index: number) => {
    setSpecialtyTags(specialtyTags.filter((_, i) => i !== index));
  };
  
  const handleSpecialtyKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSpecialtyTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!editFormData.firstName || !editFormData.lastName || !editFormData.email) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSave(editFormData);
      // onClose is called by the parent component after successful save
    } catch (error) {
      console.error('Error saving profile:', error);
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Check what type of user form we're displaying based on properties
  const isHousekeeper = 'specialties' in formData;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-green-700 opacity-30 backdrop-blur-sm"></div>
      
      {/* Modal Container */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="bg-green-600 text-white py-4 px-6 rounded-t-lg flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {isHousekeeper ? 'Edit Housekeeper Profile' : 'Edit Profile'}
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="text-left">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaEnvelope className="mr-2 text-green-600" size={14} /> Email Address*
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="text-left">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaPhone className="mr-2 text-green-600" size={14} /> Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.phone}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">Philippine mobile format: +63 9XX XXX XXXX</p>
              </div>
            </div>
            
            {/* Conditional fields based on user type */}
            {isHousekeeper && (
              <>
                <div className="text-left">
                  <label htmlFor="specialties" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaTools className="mr-2 text-green-600" /> Specialties
                  </label>
                  <div className="flex items-center">
                    <input
                      id="specialties"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={specialtyInput}
                      onChange={handleSpecialtyInputChange}
                      onKeyDown={handleSpecialtyKeyDown}
                      placeholder="Add specialty and press Enter"
                    />
                    <button
                      type="button"
                      onClick={addSpecialtyTag}
                      className="ml-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {specialtyTags.map((tag, index) => (
                      <div key={index} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeSpecialtyTag(index)}
                          className="ml-1 text-green-700 hover:text-green-900"
                        >
                          <FaClose size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left">
                <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-1">House/Building Number</label>
                <input
                  id="houseNumber"
                  type="text"
                  name="houseNumber"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.houseNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="text-left">
                <label htmlFor="streetName" className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                <input
                  id="streetName"
                  type="text"
                  name="streetName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.streetName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left">
                <label htmlFor="barangay" className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                <input
                  id="barangay"
                  type="text"
                  name="barangay"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.barangay}
                  onChange={handleInputChange}
                />
              </div>
              <div className="text-left">
                <label htmlFor="cityMunicipality" className="block text-sm font-medium text-gray-700 mb-1">City/Municipality</label>
                <input
                  id="cityMunicipality"
                  type="text"
                  name="cityMunicipality"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.cityMunicipality}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left">
                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <input
                  id="province"
                  type="text"
                  name="province"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.province}
                  onChange={handleInputChange}
                />
              </div>
              <div className="text-left">
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  id="zipCode"
                  type="text"
                  name="zipCode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editFormData.zipCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="text-left">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={editFormData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
              ></textarea>
            </div>
            
            <div className="flex justify-end mt-6 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
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

export default EditProfileModal; 