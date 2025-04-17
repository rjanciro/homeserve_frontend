import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { adminService } from '../services/admin.service';

interface PrivateAdminRouteProps {
  element: React.ReactElement;
}

const PrivateAdminRoute: React.FC<PrivateAdminRouteProps> = ({ element }) => {
  const admin = adminService.getCurrentAdmin();
  
  if (!admin) {
    // Redirect to admin login page if not authenticated
    return <Navigate to="/admin-login" replace />;
  }

  // Clone the element and pass the authenticated admin
  return React.cloneElement(element, {}, <Outlet />);
};

export default PrivateAdminRoute; 