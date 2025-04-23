import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// General Components
import LandingPage from './components/pages/LandingPage';
import AboutUsPage from './components/pages/AboutUsPage';
import Register from './components/authentication/register/Register';
import Login from './components/authentication/login/Login';
import PrivateRoute from './components/guards/PrivateRoute';
import NotFound from './components/pages/NotFound';

// Home Owner Components
import HomeOwnerSidebar from './components/layout/HomeOwnerSidebar';
import HomeOwnerDashboard from './components/dashboard/home-owner/HomeOwnerDashboard';
import Messaging from './components/pages/home-owner/HomeOwnerMessaging';
import History from './components/pages/home-owner/History';
import HomeOwnerProfileSettings from './components/pages/home-owner/HomeOwnerProfileSettings';
import JobPosts from './components/pages/home-owner/JobPosts';
import CreateJobPost from './components/pages/home-owner/CreateJobPost';
import OneTimeBooking from './components/pages/home-owner/OneTimeBooking';

// Housekeeper Components
import HousekeeperDashboard from './components/dashboard/housekeeper/HousekeeperDashboard';
import HousekeeperMessaging from './components/pages/housekeeper/HousekeeperMessaging';
import HousekeeperProfileSettings from './components/pages/housekeeper/HousekeeperProfileSettings';
import HousekeeperSidebar from './components/layout/HousekeeperSidebar';
import BookingRequests from './components/pages/housekeeper/BookingRequests';
import MyServices from './components/pages/housekeeper/MyServices';
import JobApplications from './components/pages/housekeeper/JobApplications';

// Admin Components
import AdminLogin from './components/authentication/login/AdminLogin';
import AdminSidebar from './components/layout/AdminSidebar';
import AdminDashboard from './components/dashboard/admin/AdminDashboard';
import PrivateAdminRoute from './components/routes/PrivateAdminRoute';
import UsersHousekeepersPage from './components/pages/admin/user-management/UsersHousekeepers';
import HousekeeperVerificationDetails from './components/pages/admin/user-management/HousekeeperVerificationDetails';

// Both Components
import VerificationPending from './components/authentication/VerificationPending';


// Undecided Components
import { MessagingProvider } from './contexts/MessagingContext';
import VerificationDocumentsPage from './components/pages/housekeeper/VerificationDocuments';


const App: React.FC = () => {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px'
          },
          success: {
            style: {
              background: '#22c55e',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#22c55e',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: 'white',
              secondary: '#ef4444',
            },
          },
        }}
      />
      <MessagingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/signup" element={<Register />} />
            
            {/* Home Owner routes */}
            <Route element={<PrivateRoute element={<HomeOwnerSidebar />} userType="homeowner" />}>
              <Route path="/dashboard" element={<HomeOwnerDashboard />} />
              <Route path="/job-posts" element={<JobPosts />} />
              <Route path="/create-job-post" element={<CreateJobPost />} />
              <Route path="/edit-job-post/:id" element={<CreateJobPost />} />
              <Route path="/history" element={<History />} />
              <Route path="/messages" element={<Messaging />} />
              <Route path="/profile" element={<HomeOwnerProfileSettings />} />
              <Route path="/one-time-booking" element={<OneTimeBooking />} />
            </Route>

            {/* Housekeeper routes */}
            <Route element={<PrivateRoute element={<HousekeeperSidebar />} userType="housekeeper" />}>
              <Route path="/housekeeper-dashboard" element={<HousekeeperDashboard />} />
              <Route path="/housekeeper/my-services" element={<MyServices />} />
              <Route path="/housekeeper/booking-requests" element={<BookingRequests />} />
              <Route path="/housekeeper/messages" element={<HousekeeperMessaging />} />
              <Route path="/housekeeper/profile" element={<HousekeeperProfileSettings />} />
              <Route path="/housekeeper/job-applications" element={<JobApplications />} />
              <Route path="/housekeeper/verification-documents" element={<VerificationDocumentsPage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<PrivateAdminRoute element={<AdminSidebar />} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users/housekeepers" element={<UsersHousekeepersPage />} />
              <Route path="/admin/housekeepers/:userId" element={<HousekeeperVerificationDetails />} />
            </Route>

            {/* Email verification routes */}
            <Route path="/verification-pending" element={<VerificationPending />} />

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </MessagingProvider>
    </>
  );
};

export default App;
