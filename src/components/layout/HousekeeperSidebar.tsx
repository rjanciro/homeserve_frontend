import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { FaHome, FaBriefcase, FaClipboardList, FaComments, FaUser, FaBars, FaSignOutAlt, FaCalendarCheck, FaTools, FaChevronDown, FaCog } from 'react-icons/fa';
import { authService } from '../services/auth.service';
import { User } from '../../types';
import Swal from 'sweetalert2';
import { profileEvents } from '../../utils/events';
import { profileService } from '../services/profile.service';
import toast from 'react-hot-toast';

const HousekeeperSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(window.innerWidth < 1024);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Function to load current user data
  const loadCurrentUser = () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        // Your form fields
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    // Load user data immediately when component mounts
    loadCurrentUser();
    
    // Subscribe to profile update events
    const unsubscribe = profileEvents.onProfileUpdate(() => {
      console.log("Profile updated event received in HousekeeperSidebar, refreshing user data");
      loadCurrentUser();
    });
    
    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    // Clean up the subscription when component unmounts
    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile nav when location changes
  useEffect(() => {
    setIsProfileDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#137D13',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // First logout from the auth service (this will handle setting offline status)
          await authService.logout();
          // Then navigate to login page
          navigate('/login');
          toast.success('Successfully logged out');
        } catch (error) {
          console.error('Error during logout:', error);
          // Still navigate to login even if the API call fails
          navigate('/login');
          toast.success('Successfully logged out');
        }
      }
    });
  };

  const navigateToProfile = () => {
    navigate('/housekeeper/profile');
    setIsProfileDropdownOpen(false);
  };

  const getNavItems = () => {
    return [
      { path: '/housekeeper-dashboard', icon: FaHome, label: 'Dashboard' },
      { path: '/housekeeper/my-services', icon: FaTools, label: 'My Services' },
      { path: '/housekeeper/booking-requests', icon: FaCalendarCheck, label: 'Booking Requests' },
      { path: '/housekeeper/job-applications', icon: FaClipboardList, label: 'Job Applications' },
      { path: '/housekeeper/messages', icon: FaComments, label: 'Messages' },
      { path: '/housekeeper/profile', icon: FaUser, label: 'Profile' },
    ];
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Top Navigation Bar for Mobile */}
      <header className="bg-white h-[60px] sm:h-[73px] border-b border-gray-200 fixed top-0 left-0 right-0 z-20 shadow-sm transition-all duration-300">
        <div className="h-full flex justify-between items-center px-4 sm:px-6">
          {/* Mobile: App name with styling */}
          <div className="flex items-center lg:hidden">
            <span className="text-[#137D13] font-bold text-xl tracking-tight bg-gradient-to-r from-[#137D13] to-[#54B054] bg-clip-text text-transparent">
              HomeServe
            </span>
          </div>

          {/* Desktop: Page title or welcome message */}
          <div className="hidden lg:flex items-center ml-16">
            <h1 className="text-xl font-semibold text-gray-800">
              {location.pathname === '/housekeeper-dashboard' ? 'Dashboard' : 
               location.pathname === '/housekeeper/my-services' ? 'My Services' : 
               location.pathname === '/housekeeper/booking-requests' ? 'Booking Requests' : 
               location.pathname === '/housekeeper/job-applications' ? 'Job Applications' : 
               location.pathname === '/housekeeper/messages' ? 'Messages' : 
               location.pathname === '/housekeeper/profile' ? 'Profile' : 'HomeServe'}
            </h1>
          </div>

          {/* Mobile: Profile avatar with dropdown */}
          <div className="relative lg:hidden" ref={dropdownRef}>
            <button 
              className="flex items-center space-x-2 focus:outline-none group"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            >
              {/* Mobile-specific avatar container with improved styling */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-transform duration-200 ${isProfileDropdownOpen ? 'border-[#137D13] scale-105' : 'border-gray-200'}`}>
                  <img
                    src={user?.profileImage 
                      ? profileService.getFullImageUrl(user.profileImage) 
                      : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                      console.log("Failed to load image:", user?.profileImage);
                    }}
                  />
                </div>
                <FaChevronDown className={`ml-1 text-gray-500 w-3 h-3 transition-transform duration-200 ${isProfileDropdownOpen ? 'transform rotate-180 text-[#137D13]' : ''}`} />
              </div>
            </button>
            
            {/* Mobile-only Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white shadow-lg rounded-md py-1 w-48 z-50 transform origin-top-right transition-all duration-200 ease-out animate-fadeIn">
                {/* Mobile-only user info section */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-sm text-gray-800">
                    {user ? `${user.firstName} ${user.lastName}` : ''}
                  </div>
                  <div className="text-xs text-gray-500">Housekeeper</div>
                </div>
                <button
                  onClick={navigateToProfile}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 w-full text-left transition-colors duration-150"
                >
                  <FaCog className="mr-3 text-[#137D13]" />
                  <span className="font-medium text-sm">Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-3 text-red-600 hover:bg-gray-50 w-full text-left transition-colors duration-150"
                >
                  <FaSignOutAlt className="mr-3" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop-only: Simple profile display (no dropdown functionality) */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="text-right mr-2">
              <div className="text-sm font-medium text-gray-900">
                {user ? `${user.firstName} ${user.lastName}` : ''}
              </div>
              <div className="text-xs text-gray-500">Housekeeper</div>
            </div>
            <img
              src={user?.profileImage 
                ? profileService.getFullImageUrl(user.profileImage) 
                : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
              alt="Profile"
              className="w-10 h-10 rounded-full ring-2 ring-[#137D13]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                console.log("Failed to load image:", user?.profileImage);
              }}
            />
          </div>
        </div>
      </header>

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className={`bg-white border-r border-gray-200 h-screen fixed top-0 left-0 transition-all duration-500 ease-in-out flex-col z-30 hidden lg:flex ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="border-b border-gray-200 h-[73px]">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full h-full hover:bg-gray-100 text-[#137D13] flex items-center ${
              isCollapsed ? 'justify-center' : 'px-4'
            }`}
          >
            <FaBars size={20} />
            {!isCollapsed && (
              <span className="ml-3 font-semibold text-[#137D13]">HomeServe</span>
            )}
          </button>
        </div>
        <nav className="pt-6 pb-2 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {getNavItems().map(({ path, icon: Icon, label }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center py-3 transition-all duration-300
                    ${isCollapsed ? 'justify-center px-0' : 'px-7'} 
                    ${isActive(path) 
                      ? 'bg-[#E6F4E6] text-[#137D13]'
                      : 'text-gray-600 hover:bg-[#F0FAF0] hover:text-[#137D13]'
                    }`}
                >
                  <Icon className={`w-5 h-5`} />
                  {!isCollapsed && <span className="ml-3 font-medium">{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full py-4 text-red-600 hover:bg-red-50 flex items-center transition-colors ${
              isCollapsed ? 'justify-center' : 'px-7'
            }`}
          >
            <FaSignOutAlt className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Bottom Mobile Navigation - Enhanced */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 h-16">
          {getNavItems().slice(0, 5).map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center py-1 px-1 transition-colors duration-150 ${
                isActive(path) 
                  ? 'text-[#137D13]'
                  : 'text-gray-500 hover:text-[#137D13]'
              }`}
            >
              <div className={`p-1 rounded-full ${isActive(path) ? 'bg-[#E6F4E6]' : ''}`}>
                <Icon className={`w-4 h-4 ${isActive(path) ? 'text-[#137D13]' : 'text-gray-500'}`} />
              </div>
              <span className="text-[9px] leading-tight mt-0.5 font-medium text-center">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 pt-[60px] sm:pt-[73px] ${
        isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      } pb-20 lg:pb-6`}>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        `}
      </style>
    </div>
  );
};

export default HousekeeperSidebar;