import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaTools, FaClipboardList, FaMoneyBillWave, 
  FaUserCog, FaHome, FaStar, FaCalendarCheck
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

// Define types for our metrics
interface DashboardMetrics {
  totalUsers: number;
  homeowners: number;
  serviceProviders: number;
  totalServices: number;
  activeServices: number;
  pendingRequests: number;
  completedJobs: number;
  totalRevenue: number;
}

const AdminDashboard: React.FC = () => {
  useDocumentTitle('Admin Dashboard | HomeServe');
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    homeowners: 0,
    serviceProviders: 0,
    totalServices: 0,
    activeServices: 0,
    pendingRequests: 0,
    completedJobs: 0,
    totalRevenue: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, you would fetch this data from your API
        // For now, using placeholder data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Set mock data (replace with actual API calls later)
        setMetrics({
          totalUsers: 128,
          homeowners: 84,
          serviceProviders: 44,
          totalServices: 97,
          activeServices: 82,
          pendingRequests: 15,
          completedJobs: 63,
          totalRevenue: 15420
        });
        
        setRecentUsers([
          { id: 1, name: 'John Doe', email: 'john@example.com', type: 'homeowner', joinDate: '2023-06-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', type: 'provider', joinDate: '2023-06-14' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', type: 'homeowner', joinDate: '2023-06-12' },
          { id: 4, name: 'Alice Brown', email: 'alice@example.com', type: 'provider', joinDate: '2023-06-10' }
        ]);
        
        setRecentServices([
          { id: 1, name: 'Plumbing Repair', provider: 'Jane Smith', category: 'Plumbing', status: 'active' },
          { id: 2, name: 'Lawn Mowing', provider: 'Mike Wilson', category: 'Gardening', status: 'active' },
          { id: 3, name: 'House Cleaning', provider: 'Alice Brown', category: 'Cleaning', status: 'inactive' },
          { id: 4, name: 'Electrical Work', provider: 'Tom Harris', category: 'Electrical', status: 'active' }
        ]);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return `₱${formatNumber(amount)}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users Card */}
            <div className="bg-white rounded-lg shadow p-6 flex items-start">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-800">{formatNumber(metrics.totalUsers)}</p>
                </div>
                <div className="mt-1 flex items-center text-xs">
                  <span className="text-gray-500">
                    {formatNumber(metrics.homeowners)} homeowners · {formatNumber(metrics.serviceProviders)} providers
                  </span>
                </div>
              </div>
            </div>

            {/* Services Card */}
            <div className="bg-white rounded-lg shadow p-6 flex items-start">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <FaTools className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Services</p>
                <p className="text-2xl font-semibold text-gray-800">{formatNumber(metrics.totalServices)}</p>
                <div className="mt-1 flex items-center text-xs">
                  <span className="text-gray-500">
                    {formatNumber(metrics.activeServices)} active · {formatNumber(metrics.totalServices - metrics.activeServices)} inactive
                  </span>
                </div>
              </div>
            </div>

            {/* Pending Requests Card */}
            <div className="bg-white rounded-lg shadow p-6 flex items-start">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <FaClipboardList className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-800">{formatNumber(metrics.pendingRequests)}</p>
                <div className="mt-1 flex items-center text-xs">
                  <span className="text-gray-500">
                    {formatNumber(metrics.completedJobs)} completed jobs
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-white rounded-lg shadow p-6 flex items-start">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <FaMoneyBillWave className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-800">{formatCurrency(metrics.totalRevenue)}</p>
                <div className="mt-1 flex items-center text-xs">
                  <span className="text-green-500">↑ 8.3% compared to last month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Recent Users */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Recent Users</h2>
                <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
              </div>
              <div className="divide-y divide-gray-200">
                {recentUsers.map(user => (
                  <div key={user.id} className="px-6 py-4 flex items-center">
                    <div className="rounded-full bg-gray-100 p-2 mr-4">
                      {user.type === 'homeowner' ? (
                        <FaHome className="h-5 w-5 text-gray-500" />
                      ) : (
                        <FaUserCog className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.type === 'homeowner' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.type === 'homeowner' ? 'Homeowner' : 'Provider'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Joined {user.joinDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Services */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Recent Services</h2>
                <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
              </div>
              <div className="divide-y divide-gray-200">
                {recentServices.map(service => (
                  <div key={service.id} className="px-6 py-4 flex items-center">
                    <div className="rounded-full bg-gray-100 p-2 mr-4">
                      <FaTools className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{service.name}</p>
                      <p className="text-sm text-gray-500">By {service.provider}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {service.category}
                      </span>
                      <p className={`text-xs mt-1 ${
                        service.status === 'active' ? 'text-green-500' : 'text-gray-500'
                      }`}>
                        {service.status === 'active' ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <button className="flex items-center justify-center py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors">
              <FaUsers className="mr-2" /> Manage Users
            </button>
            <button className="flex items-center justify-center py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors">
              <FaTools className="mr-2" /> Review Services
            </button>
            <button className="flex items-center justify-center py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow transition-colors">
              <FaClipboardList className="mr-2" /> View Reports
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
