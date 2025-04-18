import axios from 'axios';
import { User, UserType } from '../../types';

const API_URL = 'http://localhost:8080/api';

export const authService = {
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userType: UserType;
  }) {
    // Only allow homeowner or housekeeper registrations
    if (userData.userType !== 'homeowner' && userData.userType !== 'housekeeper') {
      throw new Error('Invalid user type');
    }
    
    try {
      // Map "housekeeper" to "provider" for the backend
      const backendUserData = {
        ...userData,
        // Convert housekeeper to provider for the backend API
        userType: userData.userType === 'housekeeper' ? 'housekeeper' : userData.userType
      };
      
      console.log('Registering user with data:', {
        ...backendUserData, 
        password: '[REDACTED]',
        originalUserType: userData.userType
      });
      
      // Add more detailed error handling for network issues
      try {
        const response = await axios.post(`${API_URL}/auth/register`, backendUserData);
        
        // Store email for verification process
        localStorage.setItem('pendingVerificationEmail', userData.email);
        
        if (response.data.token) {
          // When storing in localStorage, use the original userType
          // This ensures frontend still knows it's a housekeeper
          const userToStore = {
            ...response.data.user,
            userType: userData.userType // keep the frontend terminology
          };
          
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(userToStore));
        }
        return response.data;
      } catch (axiosError) {
        if (axios.isAxiosError(axiosError)) {
          console.error('Registration network error:', axiosError.message);
          console.error('Request details:', axiosError.config);
          if (axiosError.response) {
            console.error('Server response status:', axiosError.response.status);
            console.error('Server response:', axiosError.response.data);
          }
        }
        throw axiosError;
      }
    } catch (error) {
      console.error('Registration error details:', error);
      throw error;
    }
  },

  async login(email: string, password: string, userType: UserType) {
    // Map userType for backend
    const backendUserType = userType === 'housekeeper' ? 'housekeeper' : userType;
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        userType: backendUserType
      });
      
      // Check if server indicates this is an unverified account
      if (response.data.needsVerification) {
        throw {
          response: {
            data: {
              message: 'Please verify your email before logging in',
              needsVerification: true,
              email: email
            }
          }
        };
      }
      
      // Store the token
      localStorage.setItem('token', response.data.token);
      
      // Get complete user profile with all fields after successful login
      const userProfile = await this.fetchUserProfile();
      
      // Ensure the frontend user type is preserved
      if (userProfile && backendUserType === 'housekeeper') {
        userProfile.userType = 'housekeeper';
        localStorage.setItem('user', JSON.stringify(userProfile));
      }
      
      return userProfile;
    } catch (error) {
      // If the server directly returned needsVerification, propagate it
      if (axios.isAxiosError(error) && error.response?.data?.needsVerification) {
        throw error;
      }
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!token && !!user;
  },

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  async adminLogin(username: string, password: string) {
    const response = await axios.post(`${API_URL}/auth/admin/login`, { 
      username, 
      password
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        ...response.data.user,
        userType: 'admin'
      }));
    }
    return response.data;
  },

  async fetchUserProfile() {
    try {
      // Make a request to get the full user profile
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Store the complete user data
      localStorage.setItem('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async changePassword(oldPassword: string, newPassword: string) {
    try {
      const response = await axios.post(
        `${API_URL}/auth/change-password`,
        { oldPassword, newPassword },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  async verifyPin(email: string, pin: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-pin`, { email, pin });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      throw error;
    }
  },

  async resendVerificationEmail(email: string) {
    try {
      // Store email in localStorage to retain it across page refreshes
      localStorage.setItem('pendingVerificationEmail', email);
      
      const response = await axios.post(`${API_URL}/auth/resend-verification`, { email });
      return response.data;
    } catch (error) {
      console.error('Error resending verification email:', error);
      throw error;
    }
  },

  async verifyEmail(token: string) {
    try {
      const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  },

  async requestPasswordChangePin(email: string) {
    try {
      const response = await axios.post(
        `${API_URL}/auth/request-password-change-pin`, 
        { email },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error requesting password change PIN:', error);
      throw error;
    }
  },

  async verifyPasswordChangePin(email: string, pin: string, newPassword: string) {
    try {
      const response = await axios.post(
        `${API_URL}/auth/verify-password-change-pin`, 
        { email, pin, newPassword },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying password change PIN:', error);
      throw error;
    }
  }
}