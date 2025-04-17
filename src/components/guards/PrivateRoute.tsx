import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';

interface PrivateRouteProps {
  element: React.ReactElement;
  userType?: 'homeowner' | 'housekeeper';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, userType }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userType && user.userType !== userType) {
    const redirectPath = user.userType === 'housekeeper' ? '/housekeeper-dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return element;
};

export default PrivateRoute;