import axios from 'axios';
import { getAdminAuthHeader } from '../utils/auth';

const API_URL = 'http://localhost:8080/api/admin';

interface VerificationParams {
  approved: boolean;
  notes: string;
  documentReview?: Record<string, any>;
}

export const adminService = {
  // Admin login
  async login(username: string, password: string) {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    if (response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
    }
    return response.data;
  },

  // Log out admin
  logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
  },

  // Get current admin
  getCurrentAdmin() {
    const adminStr = localStorage.getItem('admin');
    return adminStr ? JSON.parse(adminStr) : null;
  },

  // Get all housekeepers
  async getAllHousekeepers() {
    try {
      const response = await axios.get(`${API_URL}/housekeepers`, {
        headers: getAdminAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting all housekeepers:', error);
      throw error;
    }
  },

  // Get housekeeper documents
  async getHousekeeperDocuments(userId: string) {
    try {
      console.log("Calling API for housekeeper documents:", userId);
      const response = await axios.get(`${API_URL}/housekeepers/documents/${userId}`, {
        headers: getAdminAuthHeader()
      });
      console.log("API response:", response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error getting housekeeper documents:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },

  // Verify a document
  async verifyDocument(userId: string, docType: string, params: VerificationParams) {
    const response = await axios.post(`${API_URL}/verification/verify-document`, {
      userId,
      docType,
      approved: params.approved,
      notes: params.notes
    }, {
      headers: getAdminAuthHeader()
    });
    return response.data;
  },

  // Verify housekeeper
  async verifyHousekeeper(userId: string, params: VerificationParams) {
    try {
      const response = await axios.post(
        `${API_URL}/verification/verify-housekeeper`,
        {
          userId,
          approved: params.approved,
          notes: params.notes,
          documentReview: params.documentReview
        },
        {
          headers: getAdminAuthHeader()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying housekeeper:', error);
      throw error;
    }
  },

  // Get housekeeper by ID
  async getHousekeeperById(userId: string) {
    try {
      const response = await axios.get(`${API_URL}/housekeepers/${userId}`, {
        headers: getAdminAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting housekeeper data:', error);
      throw error;
    }
  },

  // Update housekeeper status
  updateHousekeeperStatus: async (housekeeperId: string, data: { isActive: boolean, notes: string }) => {
    try {
      const response = await axios.put(
        `${API_URL}/housekeepers/status/${housekeeperId}`,
        data,
        {
          headers: getAdminAuthHeader()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating housekeeper status: ', error);
      throw error;
    }
  }
}; 