import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUser, FaCertificate, FaCheck, FaCalendar, FaStar, FaCalendarAlt, FaFileAlt, FaTools, FaMoneyBillWave, FaSpinner, FaTag, FaClock, FaInfoCircle, FaCommentAlt } from 'react-icons/fa';
import { Service } from '../../services/service.service';
import { browseService } from '../../services/browse.service';
import toast from 'react-hot-toast';
import { profileService } from '../../services/profile.service';
import HousekeeperProfileModal from '../../modals/HousekeeperProfileModal';
import ServiceDetailsModal from '../../modals/ServiceDetailsModal';
import BookingModal from '../../modals/BookingModal';
import { useNavigate } from 'react-router-dom';

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

const OneTimeBooking: React.FC = () => {
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
  const [bookingData, setBookingData] = useState<BookingFormData>({
    selectedServiceId: '',
    date: '',
    time: '',
    duration: 0,
    location: '123 Sample St, Quezon City',
    notes: '',
    housekeeperId: '',
    housekeeperName: ''
  });

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
    console.log("Constructed Profile Image URL:", fullUrl); // Log for debugging
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
    console.log("Constructed Service Image URL:", fullUrl); // Log for debugging
    return fullUrl;
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
      duration: 0,
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
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceToBook || !selectedHousekeeper) return;

    alert(`Booking submitted for "${serviceToBook.name}" with ${selectedHousekeeper.name}.`);
    setShowBookingForm(false);
    // In a real app, you would submit this to your backend
    console.log('Booking data:', {
      housekeeperId: selectedHousekeeper.id,
      serviceId: serviceToBook._id,
      serviceName: serviceToBook.name,
      date: bookingData.date,
      time: bookingData.time,
      duration: bookingData.duration,
      location: bookingData.location,
      notes: bookingData.notes,
      price: serviceToBook.price,
    });
    setServiceToBook(null);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Find a Housekeeper Service</h1>
      <p className="text-gray-600 mb-6">Browse available services and book directly.</p>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content - Service list */}
        <div className="lg:w-3/4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredHousekeepers.flatMap(housekeeper => 
                housekeeper.services
                  .filter(s => s.isAvailable)
                  .map(service => {
                    const serviceImageUrl = getServiceImageUrl(service.image);
                    return (
                      <div key={`${housekeeper.id}-${service._id}`} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 overflow-hidden flex flex-col">
                        {/* Image with skeleton loader */}
                        {serviceImageUrl && (
                          <div className="w-full h-48 bg-gray-100 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                            <img
                              src={serviceImageUrl} alt={service.name}
                              className="w-full h-full object-cover relative z-10"
                              onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                              style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {service.featured && (
                              <span className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow z-20">Featured</span>
                            )}
                          </div>
                        )}
                        
                        {/* Content Area */}
                        <div className="p-4 flex flex-col flex-grow">
                          {/* Housekeeper Info */}
                          <div className="flex items-center mb-3 pb-3 border-b border-gray-100">
                            <img
                              src={getProfileImageUrl(housekeeper.image)}
                              alt={housekeeper.name}
                              className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200"
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
                          <h4 className="text-lg font-semibold text-gray-900 leading-tight mb-1.5">{service.name}</h4>
                      
                          {/* Tags/Badges (Category, Time) */}
                          <div className="flex items-center flex-wrap gap-2 text-xs mb-3">
                            <span className='inline-flex items-center bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full'>
                              <FaTag className="mr-1 text-gray-500" size={10}/> {service.category}
                            </span>
                            <span className='inline-flex items-center bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full'>
                              <FaClock className="mr-1" size={10}/> {service.estimatedCompletionTime}
                            </span>
                          </div>
                      
                          {/* Short Description */}
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2">{service.description}</p>
                          )}
                      
                          {/* Price & Location Row */}
                          <div className="flex justify-between items-center text-sm mb-4 mt-auto pt-3 border-t border-gray-100">
                            <span className="flex items-center text-green-600 font-semibold text-base">
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
                              className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-2 py-2 rounded-md font-medium text-sm flex items-center justify-center"
                              title="See more details"
                            >
                              <FaInfoCircle className="mr-1" size={14} />
                              <span className="hidden sm:inline">Details</span>
                            </button>
                            
                            <button
                              onClick={() => handleMessage(housekeeper)}
                              className="bg-green-500 text-white hover:bg-green-600 px-2 py-2 rounded-md font-medium text-sm flex items-center justify-center"
                              title="Message this housekeeper"
                            >
                              <FaCommentAlt className="mr-1" size={14} />
                              <span className="hidden sm:inline">Message</span>
                            </button>
                            
                            <button
                              onClick={() => handleBookNow(housekeeper, service)}
                              className="bg-gradient-to-r from-[#133E87] to-[#1a4c9e] text-white hover:from-[#0f2f66] hover:to-[#1a4c9e] px-2 py-2 rounded-md font-medium text-sm flex items-center justify-center"
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
        
        {/* Right sidebar - Filters */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200 sticky top-4">
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
            </div>
          </div>
        </div>
      </div>
      
      {/* Use the imported HousekeeperProfileModal component */}
      {selectedHousekeeper && (
        <HousekeeperProfileModal 
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          housekeeper={selectedHousekeeper}
          onBookService={handleBookFromProfile}
          getProfileImageUrl={getProfileImageUrl}
        />
      )}
      
      {/* New ServiceDetailsModal */}
      {selectedHousekeeper && serviceToBook && (
        <ServiceDetailsModal
          isOpen={showServiceDetails}
          onClose={() => setShowServiceDetails(false)}
          service={serviceToBook}
          housekeeper={{
            id: selectedHousekeeper.id,
            name: selectedHousekeeper.name,
            image: selectedHousekeeper.image,
            rating: selectedHousekeeper.rating,
            reviewCount: selectedHousekeeper.reviewCount
          }}
          getProfileImageUrl={getProfileImageUrl}
          getServiceImageUrl={getServiceImageUrl}
          onBookService={() => {
            setShowServiceDetails(false);
            handleBookNow(selectedHousekeeper, serviceToBook);
          }}
        />
      )}
      
      {/* Replace the inline booking form with BookingModal component */}
      {showBookingForm && selectedHousekeeper && serviceToBook && (
        <BookingModal
          isOpen={showBookingForm}
          onClose={() => setShowBookingForm(false)}
          service={serviceToBook}
          housekeeper={selectedHousekeeper}
          getProfileImageUrl={getProfileImageUrl}
          getServiceImageUrl={getServiceImageUrl}
        />
      )}
    </div>
  );
};

export default OneTimeBooking;
