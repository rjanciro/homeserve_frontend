import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  FaHome, FaUsers, FaTools, FaChartBar, FaCog, FaBars, 
  FaSignOutAlt, FaClipboardList, FaUserTie, FaUserCheck,
  FaClock, FaCheckCircle, FaMoneyBillWave, FaExchangeAlt,
  FaChartLine, FaCommentDots, FaFlag, FaUserEdit,
  FaChevronRight, FaChevronDown
} from 'react-icons/fa';
import { adminService } from '../services/admin.service';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { profileService } from '../services/profile.service';

// Define Admin type
interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  phone?: string;
  profileImage?: string;
}

// Navigation item interfaces
interface SubNavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{className?: string}>;
  subItems?: SubNavItem[];
}

const AdminSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const currentAdmin = adminService.getCurrentAdmin();
        if (currentAdmin) {
          setAdmin(currentAdmin);
          
          // Set default profile image or use one from currentAdmin if available
          if (currentAdmin.profileImage) {
            // Use the same helper function we're using in other components
            const imageUrl = profileService.getFullImageUrl(currentAdmin.profileImage);
            setProfileImage(imageUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png");
          } else {
            setProfileImage("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png");
          }
        } else {
          // If no admin user is found in localStorage, redirect to login
          navigate('/admin-login');
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
        toast.error('Failed to load admin profile');
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [navigate]);

  const getNavItems = (): NavItem[] => {
    return [
      { 
        path: '/admin/dashboard', 
        icon: FaHome, 
        label: 'Dashboard' 
      },
      { 
        path: '/admin/users', 
        icon: FaUsers, 
        label: 'User Management',
        subItems: [
          { path: '/admin/users/homeowners', icon: FaUserEdit, label: 'Homeowners' },
          { path: '/admin/users/housekeepers', icon: FaUserCheck, label: 'Housekeepers' },
          { path: '/admin/users/admins', icon: FaUserTie, label: 'Admins' }
        ]
      },
      {
        path: '/admin/service-requests',
        icon: FaTools,
        label: 'Service Requests',
        subItems: [
          { path: '/admin/service-requests/pending', icon: FaClock, label: 'Pending Requests' },
          { path: '/admin/service-requests/ongoing', icon: FaClipboardList, label: 'Ongoing Services' },
          { path: '/admin/service-requests/completed', icon: FaCheckCircle, label: 'Completed Services' }
        ]
      },
      {
        path: '/admin/transactions',
        icon: FaMoneyBillWave,
        label: 'Transactions',
        subItems: [
          { path: '/admin/transactions/payments', icon: FaMoneyBillWave, label: 'Payments & Earnings' },
          { path: '/admin/transactions/payouts', icon: FaExchangeAlt, label: 'Payouts' }
        ]
      },
      {
        path: '/admin/reports',
        icon: FaChartBar,
        label: 'Reports & Analytics',
        subItems: [
          { path: '/admin/reports/user-growth', icon: FaChartLine, label: 'User Growth' },
          { path: '/admin/reports/service-trends', icon: FaChartLine, label: 'Service Trends' },
          { path: '/admin/reports/revenue', icon: FaMoneyBillWave, label: 'Revenue Reports' }
        ]
      },
      {
        path: '/admin/reviews',
        icon: FaCommentDots,
        label: 'Reviews & Complaints',
        subItems: [
          { path: '/admin/reviews/user-reviews', icon: FaCommentDots, label: 'User Reviews' },
          { path: '/admin/reviews/reported', icon: FaFlag, label: 'Reported Issues' }
        ]
      },
      { 
        path: '/admin/settings', 
        icon: FaCog, 
        label: 'Settings' 
      }
    ];
  };

  const toggleSubMenu = (path: string) => {
    if (expandedItem === path) {
      setExpandedItem(null);
    } else {
      setExpandedItem(path);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        adminService.logout();
        navigate('/admin-login');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-slate-800 text-white h-screen fixed left-0 transition-all duration-500 ease-in-out flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo and toggle button */}
        <div className="border-b border-slate-700 h-[73px]">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full h-full hover:bg-slate-700 text-white flex items-center ${
              isCollapsed ? 'justify-center' : 'px-4'
            }`}
          >
            <FaBars size={20} />
            {!isCollapsed && (
              <span className="ml-3 font-semibold text-white">Admin Panel</span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col py-4 overflow-y-auto">
          <div className="mt-2">
            {getNavItems().map((item) => (
              <div key={item.path} className="mb-1">
                {/* Main menu item */}
                <div 
                  className={`flex items-center py-3 cursor-pointer transition-colors ${
                    isCollapsed ? 'px-4 justify-center' : 'px-6'
                  } ${
                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  onClick={() => {
                    if (item.subItems) {
                      toggleSubMenu(item.path);
                    } else {
                      navigate(item.path);
                    }
                  }}
                >
                  <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                  {!isCollapsed && (
                    <>
                      <span className="ml-3 font-medium flex-1">{item.label}</span>
                      {item.subItems && (
                        <span className="text-xs">
                          {expandedItem === item.path ? 
                            <FaChevronDown className="w-3 h-3 text-gray-300" /> : 
                            <FaChevronRight className="w-3 h-3 text-gray-300" />
                          }
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                {/* Sub-menu items */}
                {!isCollapsed && item.subItems && expandedItem === item.path && (
                  <div className="ml-6 mt-1 border-l border-slate-700 pl-2">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`flex items-center py-2 px-4 text-sm transition-colors ${
                          location.pathname === subItem.path
                            ? 'text-blue-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <subItem.icon className="w-4 h-4 mr-2" />
                        <span>{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logout button */}
        <div className="border-t border-slate-700 p-4">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center py-2 px-2 text-gray-300 hover:bg-red-700 hover:text-white rounded-lg transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <FaSignOutAlt className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </div>
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="bg-white h-[73px] border-b border-gray-200">
          <div className="h-full flex justify-end items-center px-6">
            <div className="flex items-center space-x-4">
              <img
                src={profileImage}
                alt="Admin Profile"
                className="w-10 h-10 rounded-full ring-2 ring-gray-100"
              />
              <span className="font-medium text-gray-700">
                {admin ? `${admin.firstName} ${admin.lastName}` : 'Admin'}
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

export default AdminSidebar;
