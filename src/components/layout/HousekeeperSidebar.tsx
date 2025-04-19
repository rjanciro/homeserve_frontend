import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { FaHome, FaBriefcase, FaClipboardList, FaComments, FaUser, FaBars, FaSignOutAlt, FaCalendarCheck, FaTools } from 'react-icons/fa';
import { authService } from '../services/auth.service';
import { User } from '../../types';
import Swal from 'sweetalert2';
import { profileEvents } from '../../utils/events';
import { profileService } from '../services/profile.service';
import toast from 'react-hot-toast';

const HousekeeperSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

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
    
    // Clean up the subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

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
    }).then((result) => {
      if (result.isConfirmed) {
        authService.logout();
        navigate('/login');
        toast.success('Successfully logged out');
      }
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-white border-r border-gray-200 h-screen fixed left-0 transition-all duration-500 ease-in-out flex flex-col ${
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
        <nav className="pt-6 pb-2 flex-1">
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
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="bg-white h-[73px] border-b border-gray-200 sticky top-0 z-50 shadow-md">
          <div className="h-full flex justify-end items-center px-6">
            <div className="flex items-center space-x-4">
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
              <span className="font-medium text-gray-700">
                {user ? `${user.firstName} ${user.lastName}` : ''}
              </span>
            </div>
          </div>
        </header>
        <main className="p-6 overflow-y-auto" style={{ height: 'calc(100vh - 73px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HousekeeperSidebar;