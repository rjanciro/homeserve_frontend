import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaLock, FaQuestionCircle, FaCamera, FaSpinner, FaEdit, FaMapMarkerAlt } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { profileService } from '../../services/profile.service';
import { authService } from '../../services/auth.service';
import { profileEvents } from '../../../utils/events';
import ChangePasswordModal from '../../modals/ChangePasswordModal';
import EditHomeOwnerProfileModal from '../../modals/EditHomeOwnerProfileModal';
import { User } from '../../../types';

const Settings: React.FC = () => {
  useDocumentTitle('Profile');
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for profile form with address fields
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    houseNumber: '',
    streetName: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    zipCode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });
  
  // State for profile image
  const [profileImage, setProfileImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user data when component mounts
  useEffect(() => {
    // First, load data from localStorage for immediate display
    const user = authService.getCurrentUser();
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        email: user.email || '',
        phone: user.phone || '',
        houseNumber: user.houseNumber || '',
        streetName: user.streetName || '',
        barangay: user.barangay || '',
        cityMunicipality: user.cityMunicipality || '',
        province: user.province || '',
        zipCode: user.zipCode || '',
        latitude: user.latitude,
        longitude: user.longitude
      });
      
      if (user.profileImage) {
        // Ensure we have a complete URL
        setProfileImage(profileService.getFullImageUrl(user.profileImage) || '');
      }
    }
    
    // Then, fetch the latest data from the server
    const fetchLatestProfile = async () => {
      try {
        const updatedUser = await authService.fetchUserProfile();
        setUser(updatedUser);
        
        if (updatedUser) {
          setProfileForm({
            firstName: updatedUser.firstName || '',
            lastName: updatedUser.lastName || '',
            middleName: updatedUser.middleName || '',
            email: updatedUser.email || '',
            phone: updatedUser.phone || '',
            houseNumber: updatedUser.houseNumber || '',
            streetName: updatedUser.streetName || '',
            barangay: updatedUser.barangay || '',
            cityMunicipality: updatedUser.cityMunicipality || '',
            province: updatedUser.province || '',
            zipCode: updatedUser.zipCode || '',
            latitude: updatedUser.latitude,
            longitude: updatedUser.longitude
          });
          
          if (updatedUser.profileImage) {
            // Ensure we have a complete URL
            setProfileImage(profileService.getFullImageUrl(updatedUser.profileImage) || '');
          }
        }
      } catch (error) {
        console.error('Error fetching latest profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLatestProfile();
  }, []);

  // Handle profile image click
  const handleProfileImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        toast.error('File is too large. Maximum size is 10MB.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      setSelectedFile(file);
      
      // Show preview of selected image
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Upload image using the profileService
      const response = await profileService.uploadProfileImage(selectedFile);
      
      // Update local state with the new image URL
      setProfileImage(response.imageUrl);
      
      // Update user in localStorage with new profile image
      const user = authService.getCurrentUser();
      if (user) {
        user.profileImage = response.imageUrl;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Emit profile update event
        profileEvents.emitProfileUpdate();
      }
      
      toast.success('Profile image updated successfully');
      setSelectedFile(null);
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle opening edit profile modal
  const handleEditProfileClick = () => {
    setIsEditProfileModalOpen(true);
  };

  // Handle change password click
  const handleChangePasswordClick = () => {
    setIsPasswordModalOpen(true);
  };

  // Handle profile update from modal
  const handleProfileUpdate = async (updatedData: {
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
  }) => {
    try {
      // Add latitude and longitude from current state before sending to API
      const dataToUpdate = {
        ...updatedData,
        latitude: profileForm.latitude,
        longitude: profileForm.longitude
      };
      
      // Update profile using the profileService
      const response = await profileService.updateProfile(dataToUpdate);
      
      // Update form data with response
      setProfileForm(prevData => ({
        ...prevData,
        ...updatedData,
        latitude: profileForm.latitude,
        longitude: profileForm.longitude
      }));
      
      // Update user in localStorage
      const user = authService.getCurrentUser();
      if (user) {
        const updatedUser = {
          ...user,
          ...updatedData,
          latitude: profileForm.latitude,
          longitude: profileForm.longitude
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Emit profile update event
        profileEvents.emitProfileUpdate();
      }
      
      toast.success('Profile updated successfully');
      return Promise.resolve();
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
      console.error('Update error:', error);
      return Promise.reject(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <FaSpinner className="text-[#133E87] text-3xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">Profile Settings</h1>
      <p className="text-sm text-gray-600 mb-6">Manage your account settings</p>
      
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center justify-center w-full mb-8">
        <div className="relative group flex flex-col items-center">
          <div 
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md cursor-pointer group-hover:opacity-90 transition-opacity mx-auto"
            onClick={handleProfileImageClick}
          >
            <img 
              src={profileImage || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div className="bg-white p-2 rounded-full">
                <FaCamera className="text-gray-800 text-xl" />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center w-full">
            Click on the image to upload a new profile picture. Max size: 10MB.
          </p>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        
        {/* Add this button to confirm the upload */}
        {selectedFile && !isUploading && (
          <button
            onClick={handleUpload}
            className="mt-4 px-4 py-2 bg-[#133E87] text-white rounded-md hover:bg-[#0f2f66] transition-colors"
          >
            Upload New Picture
          </button>
        )}
        
        {isUploading && (
          <div className="mt-2 flex items-center justify-center text-[#133E87]">
            <FaSpinner className="animate-spin mr-2" />
            <span>Uploading...</span>
          </div>
        )}
      </div>
      
      {/* Personal Information Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <FaUser className="text-[#133E87] mr-2" />
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </div>
          <button 
            className="px-4 py-2 bg-[#133E87] text-white rounded-md hover:bg-[#0f2f66] transition-colors flex items-center"
            onClick={() => setIsEditProfileModalOpen(true)}
          >
            <FaEdit className="mr-2" />
            Edit Profile
          </button>
        </div>
        
        <div className="text-left">
          {/* Name Information */}
          <div>
            <h3 className="font-medium mb-2 text-gray-700 text-left">Name Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.firstName || 'Not provided'}
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.lastName || 'Not provided'}
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.middleName || 'Not provided'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div>
            <h3 className="font-medium mb-2 text-gray-700 text-left">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.email || 'Not provided'}
                  {user?.isEmailVerified ? (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6EBF4] text-[#133E87]">
                      Verified
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Not Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.phone || 'Not provided'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div>
            <h3 className="font-medium mb-2 text-gray-700 text-left">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">House/Building Number</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.houseNumber || 'Not provided'}
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.streetName || 'Not provided'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.barangay || 'Not provided'}
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">City/Municipality</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.cityMunicipality || 'Not provided'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.province || 'Not provided'}
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  {profileForm.zipCode || 'Not provided'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Security Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-[#E6EBF4] p-3 rounded-lg">
            <FaLock className="w-5 h-5 text-[#133E87]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-600">Manage your security settings</p>
          </div>
        </div>
        
        <button
          onClick={handleChangePasswordClick}
          className="px-4 py-2 bg-[#133E87] text-white rounded-md hover:bg-[#0f2f66] transition-colors"
        >
          Change Password
        </button>
      </div>
      
      {/* Password Change Modal */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
      
      {/* Edit Profile Modal - now using the home owner specific one */}
      <EditHomeOwnerProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        formData={profileForm}
        onSave={handleProfileUpdate}
      />
    </div>
  );
};

export default Settings;
