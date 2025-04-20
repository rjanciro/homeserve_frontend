import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaLock, FaQuestionCircle, FaCamera, FaSpinner, FaEdit, FaMapMarkerAlt, FaEnvelope, FaPhone, FaHome, FaCity, FaMapPin, FaBriefcase, FaTools } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { profileService } from '../../services/profile.service';
import { authService } from '../../services/auth.service';
import { profileEvents } from '../../../utils/events';
import ChangePasswordModal from '../../modals/ChangePasswordModal';
import EditProfileModal, { EditProfileModalProps } from '../../modals/EditProfileModal';
import { User } from '../../../types';
import axios from 'axios';

// Define the housekeeper profile data structure
interface HousekeeperProfileData {
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
  experience?: string;
  specialties?: string;
  bio: string;
  isAvailable?: boolean;
}

const HousekeeperProfileSettings: React.FC = () => {
  useDocumentTitle('Profile');

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  
  // State for profile data
  const [formData, setFormData] = useState<HousekeeperProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    houseNumber: '',
    streetName: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    zipCode: '',
    experience: '',
    specialties: '',
    bio: ''
  });

  // State for profile image
  const [profileImage, setProfileImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Load user data when component mounts
  useEffect(() => {
    // First, load data from localStorage for immediate display
    const user = authService.getCurrentUser();
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        houseNumber: user.houseNumber || '',
        streetName: user.streetName || '',
        barangay: user.barangay || '',
        cityMunicipality: user.cityMunicipality || '',
        province: user.province || '',
        zipCode: user.zipCode || '',
        experience: user.experience || '',
        specialties: user.specialties || '',
        bio: user.bio || '',
        isAvailable: user.isAvailable !== undefined ? user.isAvailable : true
      });
      
      // Set availability from user data
      setIsAvailable(user.isAvailable !== undefined ? user.isAvailable : true);
      
      if (user.profileImage) {
        // Ensure we have a complete URL
        setProfileImage(profileService.getFullImageUrl(user.profileImage) || '');
      }
    }
    
    // Then, fetch the latest data from the server
    const fetchProfile = async () => {
      try {
        const updatedUser = await authService.fetchUserProfile();
        if (updatedUser) {
          setFormData({
            firstName: updatedUser.firstName || '',
            lastName: updatedUser.lastName || '',
            email: updatedUser.email || '',
            phone: updatedUser.phone || '',
            houseNumber: updatedUser.houseNumber || '',
            streetName: updatedUser.streetName || '',
            barangay: updatedUser.barangay || '',
            cityMunicipality: updatedUser.cityMunicipality || '',
            province: updatedUser.province || '',
            zipCode: updatedUser.zipCode || '',
            experience: updatedUser.experience || '',
            specialties: updatedUser.specialties || '',
            bio: updatedUser.bio || '',
            isAvailable: updatedUser.isAvailable !== undefined ? updatedUser.isAvailable : true
          });
          
          // Set availability from updated user data
          setIsAvailable(updatedUser.isAvailable !== undefined ? updatedUser.isAvailable : true);
          
          if (updatedUser.profileImage) {
            setProfileImage(profileService.getFullImageUrl(updatedUser.profileImage) || '');
          }
          setUser(updatedUser);
        }
      } catch (error) {
        toast.error('Failed to load profile data');
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  // Open file picker when profile image is clicked
  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
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

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      const response = await profileService.uploadProfileImage(selectedFile);
      
      // Update profileImage URL in state
      if (response.imageUrl) {
        setProfileImage(response.imageUrl);
        
        // Update user in localStorage
        const user = authService.getCurrentUser();
        if (user) {
          const updatedUser = {
            ...user,
            profileImage: response.imageUrl
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          profileEvents.emitProfileUpdate();
        }
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

  const handleChangePasswordClick = () => {
    setIsPasswordModalOpen(true);
  };

  const handleEditProfileClick = () => {
    setIsEditProfileModalOpen(true);
  };

  // Handle profile update from modal
  const handleProfileUpdate = async (updatedData: EditProfileModalProps['formData']) => {
    try {
      // Ensure all fields are included
      const dataToUpdate = {
        ...updatedData,
        houseNumber: updatedData.houseNumber || '',
        streetName: updatedData.streetName || '',
        barangay: updatedData.barangay || '',
        cityMunicipality: updatedData.cityMunicipality || '',
        province: updatedData.province || '',
        zipCode: updatedData.zipCode || '',
        specialties: updatedData.specialties || ''
      };
      
      const response = await profileService.updateProfile(dataToUpdate);
      
      // Update local state with the new data
      setFormData({
        ...formData,
        ...dataToUpdate
      });
      
      // Update user in localStorage
      const user = authService.getCurrentUser();
      if (user) {
        const updatedUser = {
          ...user,
          ...dataToUpdate
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        profileEvents.emitProfileUpdate();
      }
      
      toast.success('Profile updated successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Update error:', error);
      
      if (axios.isAxiosError(error)) {
        toast.error(`Failed to update profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      } else {
        toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return Promise.reject(error);
    }
  };

  // Handle availability toggle
  const handleAvailabilityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAvailability = e.target.checked;
    setIsAvailable(newAvailability);
    
    try {
      // Update availability in backend
      await profileService.updateProfile({
        isAvailable: newAvailability
      });
      
      // Update user in localStorage
      const user = authService.getCurrentUser();
      if (user) {
        const updatedUser = {
          ...user,
          isAvailable: newAvailability
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        profileEvents.emitProfileUpdate();
      }
      
      toast.success(`You are now ${newAvailability ? 'available' : 'unavailable'} for work`);
    } catch (error) {
      console.error('Error updating availability:', error);
      setIsAvailable(!newAvailability); // Revert UI state on error
      toast.error('Failed to update availability. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <FaSpinner className="text-green-600 text-3xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full text-left max-w-5xl mx-auto">
      <header className="relative mb-10">
        {/* Profile section with decorative background and card-like design */}
        <div className="bg-gradient-to-r from-[#f2f9f2] to-[#e5f5e5] rounded-xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/5 rounded-full transform -translate-x-12 translate-y-12"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-green-500/10 rounded-full"></div>
          
          <div className="flex flex-col md:flex-row items-center">
            {/* Profile picture section */}
            <div className="flex flex-col items-center mb-6 md:mb-0 md:mr-8 relative z-10">
              <div className="relative group transition-all duration-300 animate-scaleIn">
                <div 
                  className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer group-hover:border-green-500 transition-all duration-300"
                  onClick={handleProfileImageClick}
                >
                  <img 
                    src={profileImage || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
                    alt="Profile" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-white/90 p-2 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <FaCamera className="text-green-600 text-xl" />
                    </div>
                  </div>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                
                {/* Confirm upload button repositioned */}
                {selectedFile && !isUploading && (
                  <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 w-full flex justify-center">
                    <button
                      onClick={handleImageUpload}
                      className="px-2 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:shadow-lg transition-all duration-300 flex items-center animate-fadeIn"
                    >
                      <FaCamera className="mr-2" />
                      Confirm Upload
                    </button>
                  </div>
                )}
              </div>
              
              {/* Upload status indicators - only keep loading indicator */}
              <div className="mt-2 h-8 flex items-center justify-center">
                {isUploading && (
                  <div className="flex items-center justify-center text-green-600 bg-white px-4 py-2 rounded-full shadow animate-pulse">
                    <FaSpinner className="animate-spin mr-2" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* User info summary section */}
            <div className="flex flex-col items-center md:items-start md:ml-4 relative z-10">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{formData.firstName} {formData.lastName}</h2>
              <p className="text-green-600 mb-3 flex items-center">
                <FaEnvelope className="mr-2" /> {formData.email}
              </p>
              <div className="flex space-x-3 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Housekeeper
                </span>
                {user?.isEmailVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified Account
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4">Click on profile image to upload a new photo. Max size: 10MB.</p>
              <button 
                className="px-4 py-2 bg-white text-green-600 border border-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all duration-300 flex items-center shadow-sm"
                onClick={handleEditProfileClick}
              >
                <FaEdit className="mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Personal and contact info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 rounded-full bg-green-500/10 mr-3">
                <FaUser className="text-green-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
            </div>
            
            <div className="space-y-6">
              {/* Name Information */}
              <div>
                <h3 className="font-medium mb-3 text-gray-700 text-left border-b border-gray-100 pb-2">Name Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem 
                    label="First Name" 
                    value={formData.firstName} 
                    icon={<FaUser className="text-green-600" />} 
                  />
                  <InfoItem 
                    label="Last Name" 
                    value={formData.lastName} 
                    icon={<FaUser className="text-green-600" />} 
                  />
                </div>
              </div>
              
              {/* Contact Information */}
              <div>
                <h3 className="font-medium mb-3 text-gray-700 text-left border-b border-gray-100 pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem 
                    label="Email" 
                    value={formData.email} 
                    icon={<FaEnvelope className="text-green-600" />}
                    badge={user?.isEmailVerified ? {
                      text: "Verified",
                      color: "green"
                    } : {
                      text: "Not Verified",
                      color: "yellow"
                    }}
                  />
                  <InfoItem 
                    label="Phone Number" 
                    value={formData.phone} 
                    icon={<FaPhone className="text-green-600" />} 
                  />
                </div>
              </div>
              
              {/* Professional Information */}
              <div>
                <h3 className="font-medium mb-3 text-gray-700 text-left border-b border-gray-100 pb-2">Professional Information</h3>
                <div className="space-y-4">
                  
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                    <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors flex flex-wrap gap-2">
                      {formData.specialties ? (
                        formData.specialties.split(',').map((specialty, index) => (
                          specialty.trim() && (
                            <span key={index} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full inline-block">
                              {specialty.trim()}
                            </span>
                          )
                        ))
                      ) : (
                        <span className="text-gray-500">Not provided</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors min-h-[100px] whitespace-pre-wrap">
                      {formData.bio || 'No bio provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 rounded-full bg-green-500/10 mr-3">
                <FaMapMarkerAlt className="text-green-600 text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <InfoItem 
                label="House/Building Number" 
                value={formData.houseNumber} 
                icon={<FaHome className="text-green-600" />} 
              />
              <InfoItem 
                label="Street Name" 
                value={formData.streetName} 
                icon={<FaMapPin className="text-green-600" />} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <InfoItem 
                label="Barangay" 
                value={formData.barangay} 
                icon={<FaMapMarkerAlt className="text-green-600" />} 
              />
              <InfoItem 
                label="City/Municipality" 
                value={formData.cityMunicipality} 
                icon={<FaCity className="text-green-600" />} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem 
                label="Province" 
                value={formData.province} 
                icon={<FaMapMarkerAlt className="text-green-600" />} 
              />
              <InfoItem 
                label="ZIP Code" 
                value={formData.zipCode} 
                icon={<FaMapMarkerAlt className="text-green-600" />} 
              />
            </div>
          </div>
        </div>
        
        {/* Right column - Security section */}
        <div className="lg:col-span-1">
          {/* Security Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-full bg-green-500/10">
                <FaLock className="text-green-600 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Security</h2>
                <p className="text-sm text-gray-600">Manage your security settings</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-[#f2f9f2] rounded-lg">
                <div className="flex items-start">
                  <FaQuestionCircle className="text-green-600 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-800">Why is security important?</h3>
                    <p className="text-sm text-gray-600 mt-1">Keeping your account secure ensures that your personal information and bookings are protected.</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleChangePasswordClick}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow transform hover:-translate-y-0.5"
              >
                <FaLock className="mr-2" />
                Change Password
              </button>
            </div>
          </div>
          
          {/* Additional info card */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl shadow-md p-6 mt-6">
            <h3 className="font-semibold text-xl mb-3">Need Help?</h3>
            <p className="text-white/90 mb-4">If you have any questions about your account settings, please email our support team at:</p>
            <a 
              href="mailto:rjanciro@gmail.com"
              className="block w-full text-center bg-white text-green-600 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              rjanciro@gmail.com
            </a>
          </div>
        </div>
      </div>
      
      {/* Password Change Modal */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
      
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        formData={formData}
        onSave={handleProfileUpdate}
      />
    </div>
  );
};

// Helper component for displaying information items
interface InfoItemProps {
  label: string;
  value: string | number | undefined;
  icon: React.ReactNode;
  badge?: {
    text: string;
    color: "blue" | "green" | "red" | "yellow" | "gray"
  };
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon, badge }) => {
  const badgeColors = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200"
  };
  
  return (
    <div className="text-left">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors flex items-center">
        <div className="mr-3 opacity-70">
          {icon}
        </div>
        <div className="flex-grow">
          <span className="text-gray-800">{value || 'Not provided'}</span>
          
          {badge && (
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[badge.color]} border`}>
              {badge.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousekeeperProfileSettings;
