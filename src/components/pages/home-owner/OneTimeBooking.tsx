import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUser, FaCertificate, FaCheck, FaCalendar, FaStar, FaCalendarAlt, FaFileAlt, FaTools, FaMoneyBillWave, FaSpinner, FaTag, FaClock, FaInfoCircle, FaCommentAlt, FaTimes, FaFilter, FaChevronUp } from 'react-icons/fa';
import { Service } from '../../services/service.service';
import { browseService } from '../../services/browse.service';
import toast from 'react-hot-toast';
import { profileService } from '../../services/profile.service';
import HousekeeperProfileModal from '../../modals/HousekeeperProfileModal';
import ServiceDetailsModal from '../../modals/ServiceDetailsModal';
import BookingModal from '../../modals/BookingModal';
import { useNavigate } from 'react-router-dom';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

// Define types
interface HousekeeperReview {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  date: string;
}

export interface Housekeeper {
  id: string;
  name: string;
  location: string;
  availability: string;
  rating: number;
  reviewCount: number;
  image?: string;
  certifications?: string[];
  reviews?: HousekeeperReview[];
  services: Service[];
  isActive?: boolean;
}

interface BookingFormData {
  selectedServiceId: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  notes: string;
  housekeeperId: string;
  housekeeperName: string;
}

// ImageModal component for displaying full-size images
interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, altText }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[90vh] animate-scaleIn" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white bg-black/30 backdrop-blur-sm hover:bg-black/50 rounded-full p-2 transition-all duration-300 hover:rotate-90"
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>
        <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border border-white/20">
          <img 
            src={imageUrl} 
            alt={altText} 
            className="max-h-[80vh] w-auto mx-auto object-contain p-2"
          />
          <div className="px-4 py-3 bg-gradient-to-r from-[#133E87]/10 to-[#1a4c9e]/10 backdrop-blur-sm">
            <p className="text-center text-gray-800 font-medium">{altText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OneTimeBooking: React.FC = () => {
  useDocumentTitle('One-Time Booking');
  // Add the navigate hook for redirecting to messages
  const navigate = useNavigate();

  // State for housekeepers, filters, selected housekeeper for profile, booking
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [filteredHousekeepers, setFilteredHousekeepers] = useState<Housekeeper[]>([]);
  const [selectedHousekeeper, setSelectedHousekeeper] = useState<Housekeeper | null>(null);
  const [serviceToBook, setServiceToBook] = useState<Service | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{url: string, alt: string}>({url: '', alt: ''});
  const [bookingData, setBookingData] = useState<BookingFormData>({
    selectedServiceId: '',
    date: '',
    time: '',
    duration: 0,
    location: '',
    notes: '',
    housekeeperId: '',
    housekeeperName: ''
  });

  // Mobile filter drawer state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    serviceCategory: '',
    serviceName: '',
    location: '',
    minRating: 0,
    maxPrice: 5000,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get the full profile image URL
  // Option 1: Reuse from profileService if it exists and is suitable
  // const getProfileImageUrl = profileService.getFullImageUrl; 

  // Option 2: Define a local helper if profileService isn't available/suitable here
  const getProfileImageUrl = (imagePath: string | undefined): string => {
    const defaultImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
    if (!imagePath) {
      return defaultImage;
    }
    // Assuming imagePath is like '/uploads/profile_pictures/...'
    const apiBaseUrl = 'http://localhost:8080';
    // Ensure no double slashes
    const fullUrl = `${apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    // Removed console.log for performance
    return fullUrl;
  };

  // Helper function for Service Image URL
  const getServiceImageUrl = (imagePath: string | undefined): string | null => {
    if (!imagePath) {
      return null; // No image path provided
    }
    // Assuming imagePath is like '/uploads/services_pictures/service-...'
    const apiBaseUrl = 'http://localhost:8080'; 
    // Ensure no double slashes
    const fullUrl = `${apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    // Removed console.log for performance
    return fullUrl;
  };

  // Handle opening the image modal with full-size image
  const handleImageClick = (imageUrl: string, altText: string) => {
    if (!imageUrl) return;
    setSelectedImage({ url: imageUrl, alt: altText });
    setShowImageModal(true);
  };

  // Fetch real data on component mount
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await browseService.getAvailableHousekeeperServices();
        console.log("Fetched housekeepers with services:", data);
        setHousekeepers(data);
        setFilteredHousekeepers(data);
      } catch (err) {
        console.error("Failed to fetch housekeeper services:", err);
        setError('Failed to load available services. Please try again later.');
        toast.error('Failed to load available services.');
        setHousekeepers([]);
        setFilteredHousekeepers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.serviceCategory) count++;
    if (filters.serviceName) count++;
    if (filters.location) count++;
    if (filters.minRating > 0) count++;
    if (filters.maxPrice < 5000) count++;
    setActiveFilterCount(count);
  }, [filters]);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...housekeepers].filter(hk => hk.isActive);

    // --- Updated Service Category Filter ---
    if (filters.serviceCategory) {
      const categoryQuery = filters.serviceCategory.toLowerCase();
      filtered = filtered.filter(hk => 
        hk.services.some(s => 
          s.category.toLowerCase().includes(categoryQuery) && s.isAvailable
        )
      );
    }
    // --- End Updated Service Category Filter ---

    if (filters.serviceName) {
        const query = filters.serviceName.toLowerCase();
        filtered = filtered.filter(hk => 
            hk.services.some(s => 
                (s.name.toLowerCase().includes(query) || 
                 (s.tags && s.tags.toLowerCase().includes(query))) && 
                s.isAvailable
            )
        );
    }

    // --- Updated Location Filter to use service.serviceLocation ---
    if (filters.location) {
      const locationQuery = filters.location.toLowerCase();
      filtered = filtered.filter(hk => 
        hk.services.some(s => 
          s.isAvailable && 
          s.serviceLocation && 
          s.serviceLocation.toLowerCase().includes(locationQuery)
        )
      );
    }
    // --- End Updated Location Filter ---
    
    filtered = filtered.filter(hk => hk.rating >= filters.minRating);
    
    filtered = filtered.filter(hk => 
        hk.services.some(s => s.price <= filters.maxPrice && s.isAvailable)
    );
    
    setFilteredHousekeepers(filtered);
  };

  // Effect to apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, housekeepers]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: name === 'minRating' || name === 'maxPrice' ? Number(value) : value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      serviceCategory: '',
      serviceName: '',
      location: '',
      minRating: 0,
      maxPrice: 5000,
    });
    setShowMobileFilters(false);
  };

  // Handle viewing profile
  const handleViewProfile = (housekeeper: Housekeeper) => {
    console.log("Selected housekeeper data:", housekeeper);
    setSelectedHousekeeper(housekeeper);
    setShowProfile(true);
  };

  // Handle book now
  const handleBookNow = (housekeeper: Housekeeper, service: Service) => {
    if (!service.isAvailable) {
        alert("This specific service is currently unavailable.");
        return;
    }
    setSelectedHousekeeper(housekeeper);
    setServiceToBook(service);
    setBookingData(prev => ({
      ...prev,
      selectedServiceId: service._id || '',
      duration: service.estimatedCompletionTime ? parseInt(service.estimatedCompletionTime) : 0,
      location: prev.location,
      notes: '',
      housekeeperId: housekeeper.id,
      housekeeperName: housekeeper.name,
    }));
    setShowBookingForm(true);
  };

  // Handle booking service from profile modal
  const handleBookFromProfile = (service: Service) => {
    if (!selectedHousekeeper) return;
    setShowProfile(false);
    handleBookNow(selectedHousekeeper, service);
  };

  // Handle booking form input changes
  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value, 10) : value
    }));
  };

  // Handle booking submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceToBook || !selectedHousekeeper) return;

    try {
      // The actual submission will be handled by the BookingModal component now
      // Just close the modal and reset booking data after the submission from BookingModal
      setShowBookingForm(false);
      
      // Reset booking data after submission
      setBookingData({
        selectedServiceId: '',
        date: '',
        time: '',
        duration: 0,
        location: '',
        notes: '',
        housekeeperId: '',
        housekeeperName: ''
      });
      
      setServiceToBook(null);
      // Don't display success message here - it should come from BookingModal after actual API success
    } catch (error) {
      console.error('Error preparing booking:', error);
      toast.error('There was a problem with your booking. Please try again.');
    }
  };

  // Calculate estimated price
  const calculateEstimatedPrice = () => {
    return serviceToBook ? serviceToBook.price : 0;
  };

  // Add handleSeeDetails function
  const handleSeeDetails = (housekeeper: Housekeeper, service: Service) => {
    setSelectedHousekeeper(housekeeper);
    setServiceToBook(service);
    setShowServiceDetails(true);
  };

  // Add handleMessage function to redirect to messages
  const handleMessage = (housekeeper: Housekeeper) => {
    // Navigate to messages page with housekeeper ID as a query parameter
    navigate(`/messages?providerId=${housekeeper.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">Find a Housekeeper Service</h1>
      <p className="text-gray-600 mb-5">Browse available services and book directly.</p>
      
      {/* Mobile Filter Toggle Button */}
      <div className="sticky top-[73px] z-20 lg:hidden mb-4">
        <button 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 text-left"
        >
          <div className="flex items-center">
            <FaFilter className="text-[#133E87] mr-2" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-[#133E87] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          <FaChevronUp className={`transform transition-transform duration-300 ${showMobileFilters ? '' : 'rotate-180'}`} />
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content - Service list */}
        <div className="lg:w-3/4 order-2 lg:order-1">
          {/* Results count */}
          {!loading && !error && (
            <div className="mb-4 text-gray-600 text-sm">
              Showing {filteredHousekeepers.flatMap(hk => hk.services.filter(s => s.isAvailable)).length} services
            </div>
          )}
          
          {/* Housekeepers List */}
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <FaSpinner className="animate-spin text-4xl text-[#133E87]" />
              <p className="ml-3 text-gray-600">Loading services...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded border border-red-200">
              <p>{error}</p>
            </div>
          ) : filteredHousekeepers.length === 0 ? (
            <p className="md:col-span-2 text-center text-gray-500 py-10">No housekeepers match the current filters.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredHousekeepers.flatMap(housekeeper => 
                housekeeper.services
                  .filter(s => s.isAvailable)
                  .map(service => {
                    const serviceImageUrl = getServiceImageUrl(service.image);
                    return (
                      <div key={`${housekeeper.id}-${service._id}`} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 overflow-hidden flex flex-col">
                        {/* Image with skeleton loader */}
                        {serviceImageUrl && (
                          <div className="w-full h-36 sm:h-48 bg-gray-100 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                            <img
                              src={serviceImageUrl} alt={service.name}
                              className="w-full h-full object-cover relative z-10 cursor-pointer hover:opacity-90 transition-opacity"
                              onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                              style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              onClick={() => handleImageClick(serviceImageUrl, service.name)}
                            />
                            {service.featured && (
                              <span className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow z-20">Featured</span>
                            )}
                          </div>
                        )}
                        
                        {/* Content Area */}
                        <div className="p-3 sm:p-4 flex flex-col flex-grow">
                          {/* Housekeeper Info */}
                          <div className="flex items-center mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-100">
                            <img
                              src={getProfileImageUrl(housekeeper.image)}
                              alt={housekeeper.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover mr-2 sm:mr-3 border border-gray-200"
                              onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; }}
                            />
                            <div className="flex-grow">
                              <p className="text-sm font-semibold text-gray-800 leading-tight cursor-pointer hover:text-[#133E87]" onClick={() => handleViewProfile(housekeeper)}>{housekeeper.name}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                <FaStar className="text-amber-400 mr-1" size={12}/>
                                {housekeeper.rating?.toFixed(1) || 'N/A'}
                                <span className="ml-1">({housekeeper.reviewCount || 0} reviews)</span>
                              </div>
                            </div>
                            {/* Simple Verification Badge Example */}
                            {housekeeper.certifications && housekeeper.certifications.length > 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full ml-2">Verified</span>
                            )}
                          </div>

                          {/* Service Title */}
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight mb-1.5">{service.name}</h4>
                      
                          {/* Tags/Badges (Category, Time) */}
                          <div className="flex items-center flex-wrap gap-2 text-xs mb-2 sm:mb-3">
                            <span className='inline-flex items-center bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full'>
                              <FaTag className="mr-1 text-gray-500" size={10}/> {service.category}
                            </span>
                            <span className='inline-flex items-center bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full'>
                              <FaClock className="mr-1" size={10}/> {service.estimatedCompletionTime}
                            </span>
                          </div>
                      
                          {/* Short Description */}
                          {service.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 leading-relaxed line-clamp-2">{service.description}</p>
                          )}
                      
                          {/* Price & Location Row */}
                          <div className="flex justify-between items-center text-sm mb-3 sm:mb-4 mt-auto pt-2 sm:pt-3 border-t border-gray-100">
                            <span className="flex items-center text-green-600 font-semibold text-sm sm:text-base">
                              <FaMoneyBillWave className="mr-1.5" />
                              ₱{service.price}
                            </span>
                            <span className="flex items-center text-gray-500 text-xs" title={`Service offered in ${service.serviceLocation || 'N/A'}`}>
                              <FaMapMarkerAlt className="mr-1 text-gray-400" size={12} />
                              {service.serviceLocation || 'Location N/A'} 
                            </span>
                          </div>

                          {/* Action Buttons - Updated to include See Details and Message */}
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleSeeDetails(housekeeper, service)}
                              className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-2 py-2 rounded-md font-medium text-xs sm:text-sm flex items-center justify-center"
                              title="See more details"
                            >
                              <FaInfoCircle className="mr-1" size={14} />
                              <span className="hidden sm:inline">Details</span>
                            </button>
                            
                            <button
                              onClick={() => handleMessage(housekeeper)}
                              className="bg-green-500 text-white hover:bg-green-600 px-2 py-2 rounded-md font-medium text-xs sm:text-sm flex items-center justify-center"
                              title="Message the service provider"
                            >
                              <FaCommentAlt className="mr-1" size={14} />
                              <span className="hidden sm:inline">Message</span>
                            </button>
                            
                            <button
                              onClick={() => handleBookNow(housekeeper, service)}
                              className="bg-[#133E87] text-white hover:bg-[#0f2f66] px-2 py-2 rounded-md font-medium text-xs sm:text-sm flex items-center justify-center"
                              title="Book this service"
                              disabled={!service.isAvailable}
                            >
                              <FaCalendarAlt className="mr-1" size={14} />
                              <span className="hidden sm:inline">Book</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
              
              {filteredHousekeepers.flatMap(hk => hk.services.filter(s => s.isAvailable)).length === 0 && (
                <p className="md:col-span-2 text-center text-gray-500 py-10">No available services found.</p>
              )}
            </div>
          )}
        </div>
        
        {/* Desktop Filters sidebar */}
        <div className="lg:w-1/4 order-1 lg:order-2 hidden lg:block">
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200 sticky top-20">
            <h2 className="text-lg font-semibold mb-4 text-[#133E87]">Filter Services</h2>
            
            <div className="space-y-4">
              {/* --- Service Category Input --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Category</label>
                <input
                  type="text"
                  name="serviceCategory"
                  placeholder="e.g., Cleaning, Laundry"
                  value={filters.serviceCategory}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name / Keyword</label>
                <input
                  type="text"
                  name="serviceName"
                  placeholder="e.g., Deep Clean, Pet, Garden"
                  value={filters.serviceName}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                />
              </div>
              
              {/* --- Location Input --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., Quezon City, Makati"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
                <select
                  name="minRating"
                  value={filters.minRating}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="range"
                  name="maxPrice"
                  min="500"
                  max="10000"
                  step="100"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>₱500</span>
                  <span>₱{filters.maxPrice}</span>
                  <span>₱10000</span>
                </div>
              </div>

              <button
                onClick={resetFilters}
                className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-150"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Filter Drawer */}
      <div className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-in-out transform lg:hidden ${showMobileFilters ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="bg-white/95 backdrop-blur-sm rounded-t-xl shadow-lg border-t border-gray-200 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-200/70 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <h3 className="font-semibold text-lg text-[#133E87]">Filters</h3>
            <button 
              onClick={() => setShowMobileFilters(false)}
              className="text-gray-400 hover:text-gray-600 transition duration-150"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {/* --- Service Category Input --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Category</label>
              <input
                type="text"
                name="serviceCategory"
                placeholder="e.g., Cleaning, Laundry"
                value={filters.serviceCategory}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name / Keyword</label>
              <input
                type="text"
                name="serviceName"
                placeholder="e.g., Deep Clean, Pet, Garden"
                value={filters.serviceName}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              />
            </div>
            
            {/* --- Location Input --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                placeholder="e.g., Quezon City, Makati"
                value={filters.location}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
              <select
                name="minRating"
                value={filters.minRating}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              >
                <option value={0}>Any Rating</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price: ₱{filters.maxPrice}</label>
              <input
                type="range"
                name="maxPrice"
                min="500"
                max="10000"
                step="100"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full accent-[#133E87]"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>₱500</span>
                <span>₱10000</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={resetFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-md transition duration-150"
              >
                Reset
              </button>
              
              <button
                onClick={() => setShowMobileFilters(false)}
                className="bg-[#133E87] hover:bg-[#0f2f66] text-white font-medium py-3 px-4 rounded-md transition duration-150"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background overlay when filter drawer is open */}
      {showMobileFilters && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-30 lg:hidden transition-opacity duration-300 ease-in-out"
          onClick={() => setShowMobileFilters(false)}
        ></div>
      )}
      
      {/* Modals */}
      <HousekeeperProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        housekeeper={selectedHousekeeper || {} as Housekeeper}
        onBookService={handleBookFromProfile}
        onViewServiceDetails={(service) => handleSeeDetails(selectedHousekeeper!, service)}
        getProfileImageUrl={getProfileImageUrl}
      />
      
      <ServiceDetailsModal
        isOpen={showServiceDetails}
        onClose={() => setShowServiceDetails(false)}
        service={serviceToBook}
        housekeeper={selectedHousekeeper ? {
          id: selectedHousekeeper.id,
          name: selectedHousekeeper.name,
          image: selectedHousekeeper.image,
          rating: selectedHousekeeper.rating,
          reviewCount: selectedHousekeeper.reviewCount
        } : null}
        getProfileImageUrl={getProfileImageUrl}
        getServiceImageUrl={getServiceImageUrl}
        onBookService={() => {
          setShowServiceDetails(false);
          if (selectedHousekeeper && serviceToBook) {
            handleBookNow(selectedHousekeeper, serviceToBook);
          }
        }}
      />
      
      <BookingModal
        isOpen={showBookingForm}
        onClose={() => setShowBookingForm(false)}
        onSubmit={handleSubmitBooking}
        onChange={handleBookingChange}
        formData={bookingData}
        estimatedPrice={calculateEstimatedPrice()}
        service={serviceToBook}
        housekeeperName={selectedHousekeeper?.name || ''}
        housekeeper={selectedHousekeeper}
        getProfileImageUrl={getProfileImageUrl}
        getServiceImageUrl={getServiceImageUrl}
      />
      
      <ImageModal 
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={selectedImage.url}
        altText={selectedImage.alt}
      />
    </div>
  );
};

export default OneTimeBooking;
