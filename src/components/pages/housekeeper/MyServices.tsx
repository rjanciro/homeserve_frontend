import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaTools, FaMoneyBillWave, FaSpinner, FaIdCard, FaExclamationCircle, FaIdBadge, FaExclamationTriangle, FaUserClock, FaCheckCircle, FaLock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { serviceService, Service } from '../../services/service.service';
import ServiceFormModal from '../../modals/ServiceFormModal';
import { authService } from '../../services/auth.service';
import { documentService } from '../../services/document.service';
import axios from 'axios';

const MyServicesPage: React.FC = () => {
  useDocumentTitle('My Services');

  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [verificationNotes, setVerificationNotes] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  // Fetch services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceService.getMyServices();
        setServices(data.map((service: any) => ({
          ...service,
          id: service._id || service.id
        })));
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      try {
        // First fetch user profile
        const user = await authService.fetchUserProfile();
        console.log('User profile verification status:', user.verificationStatus);
        
        // Check if user is active
        const isActive = user.isActive !== false; // If undefined, treat as active
        
        // Then fetch document status
        const docStatus = await documentService.getDocumentStatus();
        console.log('Document status response:', docStatus);
        
        // Determine verification status - prioritize document status over user profile
        const status = docStatus.status || user.verificationStatus || 'not submitted';
        console.log('Combined status:', status);
        
        setVerificationStatus(status);
        
        // Set isVerified based on the combined status and active status
        const verified = 
          (status === 'approved' || 
          status === 'verified' || 
          user.isVerified === true) && 
          isActive &&
          status !== 'pending';
        
        setIsVerified(verified);
        
        // If user is disabled, show the reason
        if (!isActive) {
          setVerificationNotes(user.statusNotes || 'Your account has been disabled by an administrator.');
        } else if (docStatus.verificationHistory && docStatus.verificationHistory.length > 0) {
          // Get verification notes if available
          const latestEntry = docStatus.verificationHistory[docStatus.verificationHistory.length - 1];
          setVerificationNotes(latestEntry.notes || '');
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error fetching verification status:', error);
      }
    };

    // Fetch all data
    fetchData();
    fetchServices();
  }, []);

  // Get status badge based on verificationStatus
  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium inline-flex items-center">
            <FaUserClock className="mr-1.5" size={12} />
            Pending Verification
          </span>
        );
      case 'approved':
        return (
          <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium inline-flex items-center">
            <FaCheckCircle className="mr-1.5" size={12} />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium inline-flex items-center">
            <FaExclamationTriangle className="mr-1.5" size={12} />
            Verification Rejected
          </span>
        );
      case 'not submitted':
        return (
          <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium inline-flex items-center">
            <FaIdBadge className="mr-1.5" size={12} />
            Not Submitted
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium inline-flex items-center">
            <FaIdBadge className="mr-1.5" size={12} />
            Not Verified
          </span>
        );
    }
  };

  // Add a refresh function to check verification status again
  const refreshVerificationStatus = async () => {
    try {
      // Fetch user profile
      const user = await authService.fetchUserProfile();
      
      // Fetch document status
      const docStatus = await documentService.getDocumentStatus();
      
      // Determine verification status
      const status = docStatus.status || user.verificationStatus || 'not submitted';
      setVerificationStatus(status);
      
      // Set isVerified based on the combined status
      // Important: Consider "approved" status as verified even if isVerified flag is false
      const verified = 
        (status === 'approved' || 
        status === 'verified' || 
        user.isVerified === true) &&
        status !== 'pending';
      
      console.log('Verification check:', {
        status,
        userIsVerified: user.isVerified,
        finalVerified: verified
      });
      
      setIsVerified(verified);
      
      return verified;
    } catch (error) {
      console.error('Error refreshing verification status:', error);
      return false;
    }
  };

  // Modify handleAddService to refresh verification status first
  const handleAddService = () => {
    // If user is not verified or not active, don't allow adding services
    if (!isVerified) {
      toast.error('Your account is disabled or not verified. You cannot add services at this time.');
      return;
    }
    
    setCurrentService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setCurrentService(service);
    setIsModalOpen(true);
  };

  const handleSaveService = async (formData: any) => {
    setSubmitting(true);
    
    try {
      // Refresh verification status before attempting to save
      const verified = await refreshVerificationStatus();
      
      if (!verified) {
        toast.error('Your account needs to be verified before you can create or update services');
        setIsModalOpen(false);
        return;
      }
      
      if (currentService) {
        // Update existing service - use _id if available
        const serviceId = currentService._id || currentService.id || '';
        const updatedService = await serviceService.updateService(serviceId, formData);
        
        // Map services and update the correct one
        setServices(services.map(service => {
          const serviceId = service._id || service.id || '';
          const currentId = currentService._id || currentService.id || '';
          return serviceId === currentId ? { 
            ...updatedService, 
            id: updatedService._id || updatedService.id // Ensure it has an id property
          } : service;
        }));
        
        toast.success('Service updated successfully!');
      } else {
        // Add new service
        const newService = await serviceService.createService(formData);
        setServices([...services, {
          ...newService,
          id: newService._id || newService.id // Ensure it has an id property
        }]);
        
        toast.success('New service added successfully!');
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Display more specific error message if available
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || 'Failed to save service. Please try again.';
        toast.error(errorMessage);
        
        // If the error is due to verification, update the verification status
        if (error.response.status === 403 && error.response.data?.verificationStatus) {
          setVerificationStatus(error.response.data.verificationStatus);
          setIsVerified(false);
          setIsModalOpen(false); // Close the modal if verification failed
        }
      } else {
        toast.error('Failed to save service. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = (id: string | undefined) => {
    if (!id) return; // Don't proceed if id is undefined
    
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await serviceService.deleteService(id);
          setServices(services.filter(service => 
            (service.id || service._id || '') !== id
          ));
          toast.success('Service deleted successfully!');
        } catch (error) {
          console.error('Error deleting service:', error);
          toast.error('Failed to delete service');
        }
      }
    });
  };

  const handleToggleAvailability = async (id: string | undefined, currentStatus: boolean) => {
    if (!id) return; // Don't proceed if id is undefined
    
    try {
      await serviceService.toggleServiceAvailability(id, !currentStatus);
      setServices(services.map(service => 
        (service.id || service._id || '') === id ? { ...service, isAvailable: !currentStatus } : service
      ));
      
      toast.success(`Service ${!currentStatus ? 'is now available' : 'is now unavailable'}`);
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update service availability');
    }
  };

  // Helper function to get the full image URL
  const getServiceImageUrl = (imagePath: string | undefined): string | null => {
    if (!imagePath) {
      return null; // No image path provided
    }
    // Assuming imagePath is like '/uploads/services_pictures/service-...'
    const apiBaseUrl = 'http://localhost:8080'; 
    return `${apiBaseUrl}${imagePath}`;
  };

  const renderVerificationStatus = () => {
    // If user is disabled
    if (!isVerified && user?.isActive === false) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-4 sm:mb-6 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-2 sm:mr-3">
              <FaLock className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-red-800">Account Disabled</h3>
              <p className="text-red-700 mt-1 text-sm sm:text-base">
                Your account has been disabled by an administrator. You cannot add or manage services at this time.
              </p>
              {verificationNotes && (
                <div className="mt-2 p-2 bg-white rounded border border-red-200">
                  <p className="text-xs sm:text-sm text-gray-700"><strong>Reason:</strong> {verificationNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // If not verified and not disabled, show verification needed message
    if (!isVerified) {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mb-4 sm:mb-6 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-2 sm:mr-3">
              <FaIdCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-blue-800">Verification Required</h3>
              <p className="text-blue-700 mt-1 text-sm sm:text-base">
                {verificationStatus === 'pending' 
                  ? 'Your documents are under review. You will be able to add services once verified.' 
                  : 'You need to submit verification documents to add services.'}
              </p>
              {verificationStatus !== 'pending' && (
                <div className="mt-3">
                  <Link 
                    to="/housekeeper/verification-documents" 
                    className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <FaIdCard className="mr-1.5 sm:mr-2" /> Submit Documents Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // If verified, show success message
    if (isVerified) {
      return (
        <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 mb-4 sm:mb-6 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-2 sm:mr-3">
              <FaCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-green-800">Account Verified!</h3>
              <p className="text-green-700 mt-1 text-sm sm:text-base">
                Your account is verified. You can now add and manage your services.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
      {/* Display verification status message */}
      {renderVerificationStatus()}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">My Services</h1>
          <p className="text-gray-600 mt-0.5 sm:mt-1 text-xs sm:text-sm">Manage your service offerings</p>
        </div>
        
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {/* Verification Status Badge */}
          {verificationStatus !== 'approved' && verificationStatus !== 'verified' && (
            <div className="mr-0 sm:mr-2 md:mr-4">
              {getStatusBadge()}
            </div>
          )}
          
          <button
            onClick={() => handleAddService()}
            className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto justify-center ${
              !isVerified ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!isVerified}
          >
            <FaPlus className="mr-1.5" /> Add New Service
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-48 sm:h-64">
          <FaSpinner className="animate-spin text-blue-500 text-3xl sm:text-4xl" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg border border-gray-200 text-center">
          <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-2">No services yet</h3>
          <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm">Get started by adding your first service.</p>
          <div className="flex justify-center">
            <button
              onClick={() => handleAddService()}
              className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-600 transition-colors ${
                !isVerified ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isVerified}
            >
              <FaPlus className="mr-1.5" /> Add Service
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {services.map((service) => {
            // Get the full image URL for this service
            const imageUrl = getServiceImageUrl(service.image); 
            
            return (
              <div key={service.id || service._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md flex flex-col h-full">
                {/* Service Image Display */}
                {imageUrl ? (
                  <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={`Image for ${service.name}`} 
                      className="w-full h-full object-cover" // Use object-cover to fill the container
                      onError={(e) => {
                        console.error(`Failed to load image: ${imageUrl}`);
                        (e.target as HTMLImageElement).style.display = 'none'; 
                      }}
                    />
                  </div>
                ) : (
                  // Optional: Placeholder if no image exists
                  <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                    <FaTools size={24} className="sm:text-3xl md:text-4xl" />
                  </div>
                )}

                {/* Service card content */}
                <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-1.5 sm:mb-2 md:mb-3">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 flex items-center">
                      {service.name}
                    </h3>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleToggleAvailability(service.id || service._id, service.isAvailable)}
                        className={`p-1 sm:p-1.5 md:p-2 rounded-lg transition-colors ${
                          service.isAvailable 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={service.isAvailable ? 'Set as Unavailable' : 'Set as Available'}
                        aria-label={service.isAvailable ? 'Set as Unavailable' : 'Set as Available'}
                      >
                        {service.isAvailable ? <FaToggleOn size={16} className="sm:text-lg md:text-xl" /> : <FaToggleOff size={16} className="sm:text-lg md:text-xl" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-1.5 sm:mb-2 md:mb-3 flex flex-wrap gap-1">
                    <span className="inline-block bg-gray-100 text-gray-800 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
                      {service.category}
                    </span>
                    <span className="inline-block bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
                      {service.pricingType}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-[11px] sm:text-xs md:text-sm mb-1.5 sm:mb-2 md:mb-3 line-clamp-2 flex-grow">{service.description}</p>
                  
                  <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-1.5 sm:mb-2 md:mb-3 text-[10px] sm:text-xs">
                    <div className="flex items-center text-gray-700">
                      <FaMoneyBillWave className="mr-1 sm:mr-1.5 md:mr-2 text-green-500" size={12} />
                      <span>₱{service.price} {service.pricingType === 'Hourly' ? '/hr' : ''}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaTools className="mr-1 sm:mr-1.5 md:mr-2 text-blue-500" size={12} />
                      <span>{service.estimatedCompletionTime}</span>
                    </div>
                  </div>
                  
                  <div className="text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2 md:mb-3">
                    <strong>Location:</strong> {service.serviceLocation}
                  </div>

                  {/* Buttons should be at the bottom */}
                  <div className="flex space-x-2 pt-1.5 sm:pt-2 md:pt-3 border-t border-gray-100 mt-auto">
                    <button
                      onClick={() => handleEditService(service)}
                      className="text-blue-500 hover:bg-blue-50 px-2 sm:px-2.5 md:px-3 py-1 rounded-md transition-colors flex items-center text-[10px] sm:text-xs"
                    >
                      <FaEdit className="mr-1" size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id || service._id)}
                      className="text-red-500 hover:bg-red-50 px-2 sm:px-2.5 md:px-3 py-1 rounded-md transition-colors flex items-center text-[10px] sm:text-xs"
                    >
                      <FaTrash className="mr-1" size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Use the new modal component */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentService={currentService}
        onSave={handleSaveService}
        submitting={submitting}
      />
    </div>
  );
};

export default MyServicesPage;