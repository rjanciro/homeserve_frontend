import axios from 'axios';
import { authService } from './auth.service';

const API_URL = 'http://localhost:8080/api';

// Get token for auth headers
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No authentication token found');
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

export interface Service {
  id?: string;
  _id?: string;
  name: string;
  category: string;
  description: string;
  serviceLocation: string;
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    startTime: string;
    endTime: string;
  };
  estimatedCompletionTime: string;
  pricingType: 'Fixed' | 'Hourly';
  price: number;
  isAvailable: boolean;
  contactNumber: string;
  image?: string;
  housekeeper?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string;
  featured?: boolean;
}

export const serviceService = {
  // Get all services for the logged-in housekeeper
  async getMyServices() {
    const response = await axios.get(`${API_URL}/services/housekeeper`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Add a new service with file upload support
  async createService(serviceData: FormData) {
    // Check if user is active before proceeding
    const user = await authService.fetchUserProfile();
    if (user.isActive === false) {
      throw new Error('Your account has been disabled by an administrator. You cannot create services at this time.');
    }
    
    const response = await axios.post(`${API_URL}/services`, serviceData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update an existing service with file upload support
  async updateService(id: string, serviceData: FormData) {
    const response = await axios.put(`${API_URL}/services/${id}`, serviceData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Delete a service
  async deleteService(id: string) {
    const response = await axios.delete(`${API_URL}/services/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Toggle service availability
  async toggleServiceAvailability(id: string, isAvailable: boolean) {
    const response = await axios.patch(
      `${API_URL}/services/${id}/availability`,
      { isAvailable },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get all services for home owners
  async getAllServices() {
    const response = await axios.get(`${API_URL}/services`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

// Export the getAuthHeader function if needed elsewhere
export { getAuthHeader };