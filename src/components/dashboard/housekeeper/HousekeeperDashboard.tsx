import React, { useEffect, useState } from 'react';
import { FaCalendar, FaTools, FaStar, FaUserClock, FaChartLine } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

interface User {
  userType: 'homeowner' | 'housekeeper';
  firstName: string;
  lastName: string;
}

const HousekeeperDashboard: React.FC = () => {
  useDocumentTitle('Dashboard');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FaUserClock className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pending Requests</p>
              <h3 className="text-2xl font-bold">8</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <FaCalendar className="text-green-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Today's Appointments</p>
              <h3 className="text-2xl font-bold">3</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FaStar className="text-yellow-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Average Rating</p>
              <h3 className="text-2xl font-bold">4.8</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FaChartLine className="text-purple-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">This Month</p>
              <h3 className="text-2xl font-bold">₱15,240</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-6">Upcoming Appointments</h2>
        <div className="space-y-4">
          {[
            { client: 'John Doe', service: 'Plumbing Repair', time: '09:00 AM', date: 'Today', status: 'Confirmed' },
            { client: 'Jane Smith', service: 'Pipe Installation', time: '02:00 PM', date: 'Today', status: 'Pending' },
            { client: 'Mike Johnson', service: 'Leak Fix', time: '11:00 AM', date: 'Tomorrow', status: 'Confirmed' }
          ].map((appointment, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FaTools className="text-green-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium">{appointment.service}</h3>
                  <p className="text-sm text-gray-500">
                    {appointment.client} - {appointment.time}, {appointment.date}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium
                ${appointment.status === 'Confirmed' 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-yellow-50 text-yellow-600'}`}>
                {appointment.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HousekeeperDashboard;