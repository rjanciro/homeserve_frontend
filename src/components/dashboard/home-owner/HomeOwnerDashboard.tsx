import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaClipboardList, FaHistory, FaComments, FaPlus, FaBriefcase, FaUserCircle, FaSpinner, FaRegCalendarCheck, FaClock } from 'react-icons/fa';
import axios from 'axios';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { authService } from '../../services/auth.service';
import { profileService } from '../../services/profile.service';
import { User } from '../../../types';
import toast from 'react-hot-toast';

// Fix the API URL definition to avoid adding /api twice
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Define booking interface
interface Booking {
  _id: string;
  service: {
    _id: string;
    name: string;
    category: string;
    image?: string;
  };
  housekeeper: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    businessName?: string;
  };
  date: string;
  time: string;
  location: string;
  status: string;
  createdAt: string;
}

// Define job post interface
interface JobPost {
  _id: string;
  title: string;
  description: string;
  status: string;
  serviceType: string;
  budget: number;
  location: string;
  applicantsCount: number;
  createdAt: string;
}

// Mock data for fallback when API calls fail
const mockBookings: Booking[] = [
  {
    _id: 'booking1',
    service: {
      _id: 'service1',
      name: 'House Cleaning',
      category: 'Cleaning'
    },
    housekeeper: {
      _id: 'housekeeper1',
      firstName: 'Maria',
      lastName: 'Santos',
      businessName: 'Clean Pro Services'
    },
    date: new Date().toISOString(),
    time: '10:00 AM',
    location: 'Quezon City',
    status: 'pending',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'booking2',
    service: {
      _id: 'service2',
      name: 'Gardening',
      category: 'Outdoor'
    },
    housekeeper: {
      _id: 'housekeeper2',
      firstName: 'Juan',
      lastName: 'Dela Cruz'
    },
    date: new Date().toISOString(),
    time: '2:00 PM',
    location: 'Makati City',
    status: 'accepted',
    createdAt: new Date().toISOString()
  }
];

const mockJobPosts: JobPost[] = [
  {
    _id: 'job1',
    title: 'Weekly House Cleaning',
    description: 'Looking for someone to clean my 3-bedroom house once a week.',
    status: 'open',
    serviceType: 'Cleaning',
    budget: 2500,
    location: 'Quezon City',
    applicantsCount: 3,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'job2',
    title: 'Garden Maintenance',
    description: 'Need help with garden maintenance twice a month.',
    status: 'open',
    serviceType: 'Gardening',
    budget: 1800,
    location: 'Makati City',
    applicantsCount: 1,
    createdAt: new Date().toISOString()
  }
];

const HomeOwnerDashboard: React.FC = () => {
  useDocumentTitle('Dashboard');
  
  const [user, setUser] = useState<User | null>(null);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [recentPosts, setRecentPosts] = useState<JobPost[]>([]);
  const [completedServices, setCompletedServices] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch active bookings
        try {
          const bookingsResponse = await axios.get(`${API_URL}/bookings/customer`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          // Filter for active bookings (pending, accepted)
          const activeBookingsList = bookingsResponse.data.filter(
            (booking: Booking) => ['pending', 'accepted'].includes(booking.status)
          );
          setActiveBookings(activeBookingsList.slice(0, 3)); // Get latest 3
          
          // Calculate completed services count
          const completed = bookingsResponse.data.filter(
            (booking: Booking) => booking.status === 'completed'
          ).length;
          setCompletedServices(completed);
        } catch (bookingError) {
          console.warn('Error fetching bookings, using mock data:', bookingError);
          // Use mock data as fallback
          setActiveBookings(mockBookings);
          setCompletedServices(1);
        }
        
        // Try to fetch recent job posts
        try {
          const jobPostsResponse = await axios.get(`${API_URL}/job-posts/my-posts`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          setRecentPosts(jobPostsResponse.data.slice(0, 3)); // Get latest 3
        } catch (jobPostError) {
          console.warn('Error fetching job posts, using mock data:', jobPostError);
          // Use mock data as fallback
          setRecentPosts(mockJobPosts);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Use mock data as fallback
        setActiveBookings(mockBookings);
        setRecentPosts(mockJobPosts);
        setCompletedServices(1);
        
        // Show error but don't block displaying the dashboard with mock data
        toast.error('Using demo data - Some features may be limited');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Function to format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Helper function to get full image URL
  const getImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) {
      return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
    }
    
    // Use the profileService to get the full URL
    return profileService.getFullImageUrl(imagePath);
  };

  // Dashboard stats cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#133E87]">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-[#133E87] mr-4">
            <FaCalendarAlt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Active Bookings</p>
            <p className="text-2xl font-semibold">{activeBookings.length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#133E87]">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-[#133E87] mr-4">
            <FaClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Job Posts</p>
            <p className="text-2xl font-semibold">{recentPosts.length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#133E87]">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-[#133E87] mr-4">
            <FaRegCalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Completed Services</p>
            <p className="text-2xl font-semibold">{completedServices}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Quick actions section
  const renderQuickActions = () => (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Quick Actions</h3>
      </div>
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/one-time-booking" className="flex flex-col items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-[#133E87] mb-2">
            <FaCalendarAlt className="w-5 h-5" />
          </div>
          <span className="text-sm text-center font-medium text-gray-700">Book a Service</span>
        </Link>
        
        <Link to="/job-posts" className="flex flex-col items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-[#133E87] mb-2">
            <FaPlus className="w-5 h-5" />
          </div>
          <span className="text-sm text-center font-medium text-gray-700">Create Job Post</span>
        </Link>
        
        <Link to="/messages" className="flex flex-col items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-[#133E87] mb-2">
            <FaComments className="w-5 h-5" />
          </div>
          <span className="text-sm text-center font-medium text-gray-700">Messages</span>
        </Link>
        
        <Link to="/history" className="flex flex-col items-center p-4 border rounded-lg hover:bg-blue-50 transition-colors">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-[#133E87] mb-2">
            <FaHistory className="w-5 h-5" />
          </div>
          <span className="text-sm text-center font-medium text-gray-700">View History</span>
        </Link>
      </div>
    </div>
  );

  // Active bookings section
  const renderActiveBookings = () => (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Active Bookings</h3>
      </div>
      <div className="p-6">
        {activeBookings.length === 0 ? (
          <div className="text-center py-6">
            <FaCalendarAlt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">You don't have any active bookings.</p>
            <Link to="/one-time-booking" className="mt-3 inline-block px-4 py-2 bg-[#133E87] text-white rounded-md hover:bg-blue-700 transition-colors">
              Book a Service
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeBookings.map((booking) => (
              <div key={booking._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mr-4">
                    {booking.housekeeper.profileImage ? (
                      <img 
                        src={getImageUrl(booking.housekeeper.profileImage)} 
                        alt={`${booking.housekeeper.firstName} ${booking.housekeeper.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                        }}
                      />
                    ) : (
                      <FaUserCircle className="w-full h-full text-gray-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-800">{booking.service.name}</h4>
                    <p className="text-sm text-gray-500">
                      {booking.housekeeper.businessName || 
                        `${booking.housekeeper.firstName} ${booking.housekeeper.lastName}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center text-xs text-gray-600">
                        <FaCalendarAlt className="mr-1 w-3 h-3" />
                        {formatDate(booking.date)}
                      </span>
                      <span className="inline-flex items-center text-xs text-gray-600 ml-3">
                        <FaClock className="mr-1 w-3 h-3" />
                        {booking.time}
                      </span>
                      <span className={`inline-flex items-center text-xs ${
                        booking.status === 'pending' ? 'text-yellow-600' : 
                        booking.status === 'accepted' ? 'text-green-600' : 
                        booking.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
                      } ml-3`}>
                        <span className={`w-2 h-2 rounded-full mr-1 ${
                          booking.status === 'pending' ? 'bg-yellow-400' : 
                          booking.status === 'accepted' ? 'bg-green-400' : 
                          booking.status === 'rejected' ? 'bg-red-400' : 'bg-gray-400'
                        }`}></span>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <Link to="/history" className="text-[#133E87] text-sm hover:underline">
                View all bookings
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Recent job posts section
  const renderRecentJobPosts = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Recent Job Posts</h3>
      </div>
      <div className="p-6">
        {recentPosts.length === 0 ? (
          <div className="text-center py-6">
            <FaClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">You haven't created any job posts yet.</p>
            <Link to="/job-posts" className="mt-3 inline-block px-4 py-2 bg-[#133E87] text-white rounded-md hover:bg-blue-700 transition-colors">
              Create a Job Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <h4 className="font-medium text-gray-800">{post.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{post.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center text-xs text-gray-600">
                    <FaBriefcase className="mr-1 w-3 h-3" />
                    {post.serviceType}
                  </span>
                  <span className="inline-flex items-center text-xs text-gray-600 ml-3">
                    <span className="mr-1">₱</span>
                    {post.budget.toLocaleString()}
                  </span>
                  <span className={`inline-flex items-center text-xs ${
                    post.status === 'open' ? 'text-green-600' : 
                    post.status === 'closed' ? 'text-red-600' : 'text-gray-600'
                  } ml-3`}>
                    <span className={`w-2 h-2 rounded-full mr-1 ${
                      post.status === 'open' ? 'bg-green-400' : 
                      post.status === 'closed' ? 'bg-red-400' : 'bg-gray-400'
                    }`}></span>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <Link to="/job-posts" className="text-[#133E87] text-sm hover:underline">
                View all job posts
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="w-8 h-8 text-[#133E87] animate-spin mb-2" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Welcome, {user?.firstName}!
      </h1>
      
      {renderStatsCards()}
      {renderQuickActions()}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderActiveBookings()}
        {renderRecentJobPosts()}
      </div>
    </div>
  );
};

export default HomeOwnerDashboard; 