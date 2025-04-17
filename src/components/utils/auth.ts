// Helper function to get the JWT token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to get auth headers for API requests
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper function for admin authentication
export const getAdminAuthHeader = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { 'x-auth-token': token } : {};
}; 