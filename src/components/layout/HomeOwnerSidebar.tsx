import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { FaHome, FaSearch, FaHistory, FaComments, FaCog, FaSignOutAlt, FaBars, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';
import { authService } from '../services/auth.service';
import { User } from '../../types';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { profileEvents } from '../../utils/events';
import { profileService } from '../services/profile.service';

const HomeOwnerSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const loadCurrentUser = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    loadCurrentUser();
    
    const unsubscribe = profileEvents.onProfileUpdate(() => {
      console.log("Profile updated event received, refreshing user data");
      loadCurrentUser();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#133E87',
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
      { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
      { path: '/one-time-booking', icon: FaCalendarAlt, label: 'One-Time Bookings' },
      { path: '/job-posts', icon: FaClipboardList, label: 'Job Posts' },
      { path: '/history', icon: FaHistory, label: 'History' },
      { path: '/messages', icon: FaComments, label: 'Messages' },
      { path: '/profile', icon: FaCog, label: 'Profile' }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 h-screen fixed left-0 transition-all duration-500 ease-in-out flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo and toggle button */}
        <div className="border-b border-gray-200 h-[73px]">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full h-full hover:bg-gray-100 text-[#133E87] flex items-center ${
              isCollapsed ? 'justify-center' : 'px-4'
            }`}
          >
            <FaBars size={20} />
            {!isCollapsed && (
              <span className="ml-3 font-semibold text-[#133E87]">HomeServe</span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="pt-6 pb-2 flex-1">
          <ul className="space-y-1">
            {getNavItems().map(({ path, icon: Icon, label }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center py-3 transition-all duration-300
                    ${isCollapsed ? 'justify-center px-0' : 'px-7'} 
                    ${location.pathname === path 
                      ? 'bg-[#E6EBF4] text-[#133E87]'
                      : 'text-gray-600 hover:bg-[#F0F4FA] hover:text-[#133E87]'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span className="ml-3 font-medium">{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout */}
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

      {/* Main content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="bg-white h-[73px] border-b border-gray-200">
          <div className="h-full flex justify-end items-center px-6">
            <div className="flex items-center space-x-4">
              <img
                src={user?.profileImage 
                  ? profileService.getFullImageUrl(user.profileImage) 
                  : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                alt="Profile"
                className="w-10 h-10 rounded-full ring-2 ring-[#133E87]"
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
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HomeOwnerSidebar;