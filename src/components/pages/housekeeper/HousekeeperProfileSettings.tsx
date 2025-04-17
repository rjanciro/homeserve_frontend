import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaCheck, FaShieldAlt, FaCreditCard, FaBell, FaCalendarAlt, FaLock, FaQuestionCircle, FaCamera, FaSpinner, FaEdit, FaBriefcase, FaTools } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { profileService } from '../../services/profile.service';
import { authService } from '../../services/auth.service';
import { profileEvents } from '../../../utils/events';
import ChangePasswordModal from '../../modals/ChangePasswordModal';
import EditProfileModal, { EditProfileModalProps } from '../../modals/EditProfileModal';
import { User } from '../../../types';
import axios from 'axios';

// Define a type for notification keys
type NotificationType = 'email' | 'push' | 'sms';

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
  experience?: string;  // Make optional
  specialties?: string; // Make optional
  bio: string;
}

const HousekeeperProfileSettings: React.FC = () => {
  useDocumentTitle('Profile');

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
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
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
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
        bio: user.bio || ''
      });
      
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
            bio: updatedUser.bio || ''
          });
          
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

  const handleNotificationChange = (type: NotificationType) => {
    setNotifications({
      ...notifications,
      [type]: !notifications[type]
    });
  };

  // Open file picker when profile image is clicked
  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      
      // Show preview of selected image
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
      
      // Remove auto-upload - let user confirm with button instead
      // handleImageUpload(e.target.files[0]);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const response = await profileService.uploadProfileImage(file);
      console.log('Upload successful:', response);
      
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

  const handleUpdatePassword = () => {
    setIsPasswordModalOpen(true);
  };

  // Handle profile update from modal
  const handleProfileUpdate = async (updatedData: EditProfileModalProps['formData']) => {
    try {
      console.log('About to update profile with data:', updatedData);
      
      // Ensure all address fields are included
      const dataToUpdate = {
        ...updatedData,
        // Make sure these are explicitly included if they might be undefined
        houseNumber: updatedData.houseNumber || '',
        streetName: updatedData.streetName || '',
        barangay: updatedData.barangay || '',
        cityMunicipality: updatedData.cityMunicipality || '',
        province: updatedData.province || '',
        zipCode: updatedData.zipCode || '',
        experience: updatedData.experience || '',
        specialties: updatedData.specialties || ''
      };
      
      const response = await profileService.updateProfile(dataToUpdate);
      console.log('Update successful, response:', response);
      
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
      
      // Close the modal
      setIsEditProfileModalOpen(false);
    } catch (error) {
      console.error('Update error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response?.data);
        toast.error(`Failed to update profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      } else {
        toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="w-full px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 text-left">Profile Settings</h1>
      
      {/* Profile Image Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 transition-all hover:shadow-lg">
        <h2 className="text-xl font-semibold mb-6 text-left">Profile Image</h2>
        
        <div className="flex flex-col items-start">
          <div className="relative mb-4">
            <div 
              className="w-28 h-28 rounded-full overflow-hidden border-4 border-green-500/20 bg-gray-100 flex items-center justify-center cursor-pointer group transition-transform hover:scale-105"
              onClick={handleProfileImageClick}
            >
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser className="text-gray-400 text-5xl" />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <FaCamera className="text-white text-2xl" />
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <FaSpinner className="text-white text-2xl animate-spin" />
                </div>
              )}
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-sm text-gray-500 mb-4 text-left">
            Click on the image to upload a new profile picture. Max size: 5MB.
          </p>
        </div>
      </div>
      
      {/* Profile Image Preview Section */}
      {selectedFile && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-left">Profile Image Preview</h2>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-500/20 bg-gray-100 mb-4">
              <img 
                src={profileImage} 
                alt="Profile Preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => handleImageUpload(selectedFile)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <FaSpinner className="animate-spin mr-2" /> Uploading...
                </span>
              ) : (
                <span className="flex items-center">
                  <FaCamera className="mr-2" /> Upload Image
                </span>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Profile Information Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 transition-all hover:shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <FaUser className="text-green-600 mr-2" />
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </div>
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all flex items-center gap-2 shadow-sm hover:shadow"
            onClick={() => setIsEditProfileModalOpen(true)}
          >
            <FaEdit /> Edit Profile
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <FaSpinner className="text-green-500 text-3xl animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                  {formData.firstName}
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                  {formData.lastName}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                  {formData.email}
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                  {formData.phone || 'Not provided'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaBriefcase className="mr-2 text-green-600" /> Experience
                </label>
                <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner min-h-[50px]">
                  {formData.experience ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.experience.split(',').map((tag, index) => (
                        tag.trim() && (
                          <span key={index} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full inline-block">
                            {tag.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  ) : (
                    'Not provided'
                  )}
                </div>
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaTools className="mr-2 text-green-600" /> Specialties
                </label>
                <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner min-h-[50px]">
                  {formData.specialties ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.split(',').map((tag, index) => (
                        tag.trim() && (
                          <span key={index} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full inline-block">
                            {tag.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  ) : (
                    'Not provided'
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-left">
              <h3 className="font-medium mb-2 text-gray-700">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">House/Building Number</label>
                  <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                    {formData.houseNumber || 'Not provided'}
                  </div>
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Name</label>
                  <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                    {formData.streetName || 'Not provided'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                  <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                    {formData.barangay || 'Not provided'}
                  </div>
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">City/Municipality</label>
                  <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                    {formData.cityMunicipality || 'Not provided'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                  <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                    {formData.province || 'Not provided'}
                  </div>
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                    {formData.zipCode || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 min-h-[100px] whitespace-pre-wrap shadow-inner">
                {formData.bio || 'No bio provided'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Security Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center mb-4 text-left">
          <FaShieldAlt className="text-green-500 mr-2" />
          <h2 className="text-xl font-semibold">Security</h2>
        </div>
        <p className="text-gray-600 mb-6 text-left">Manage your account security settings</p>
        
        <div className="space-y-6">
          <div className="text-left">
            <h3 className="font-medium mb-4">Password</h3>
            <button 
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={handleUpdatePassword}
            >
              Change Password
            </button>
          </div>
          
          <div className="text-left">
            <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              Setup 2FA
            </button>
          </div>
        </div>
      </div>
      
      {/* Notifications Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center mb-4 text-left">
          <FaBell className="text-green-500 mr-2" />
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>
        <p className="text-gray-600 mb-6 text-left">Control how you receive notifications</p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="text-left">
              <h3 className="font-medium">Email Notifications</h3>
              <p className="text-gray-500 text-sm">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notifications.email}
                onChange={() => handleNotificationChange('email')}
              />
              <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="text-left">
              <h3 className="font-medium">Push Notifications</h3>
              <p className="text-gray-500 text-sm">Receive notifications on your device</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notifications.push}
                onChange={() => handleNotificationChange('push')}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="font-medium">SMS Notifications</h3>
              <p className="text-gray-500 text-sm">Receive notifications via text message</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notifications.sms}
                onChange={() => handleNotificationChange('sms')}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Help & Support Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4 text-left">
          <FaQuestionCircle className="text-green-500 mr-2" />
          <h2 className="text-xl font-semibold">Help & Support</h2>
        </div>
        <p className="text-gray-600 mb-6 text-left">Get help with your account</p>
        
        <div className="space-y-4 text-left">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium mb-2">FAQs</h3>
            <p className="text-gray-500 text-sm mb-2">Find answers to common questions</p>
            <a href="#" className="text-green-500 hover:text-green-600 text-sm">View FAQs</a>
          </div>
          
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium mb-2">Contact Support</h3>
            <p className="text-gray-500 text-sm mb-2">Get help from our support team</p>
            <a href="#" className="text-green-500 hover:text-green-600 text-sm">Contact Us</a>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Report an Issue</h3>
            <p className="text-gray-500 text-sm mb-2">Let us know if you're experiencing problems</p>
            <a href="#" className="text-green-500 hover:text-green-600 text-sm">Report Issue</a>
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

export default HousekeeperProfileSettings;
