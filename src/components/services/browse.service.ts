import axios from 'axios';
import { getAuthHeader } from '../utils/auth'; // Use regular user auth
import { Housekeeper } from '../pages/home-owner/OneTimeBooking'; // Import the interface

const API_URL = 'http://localhost:8080/api/browse';

export const browseService = {
  async getAvailableHousekeeperServices(): Promise<Housekeeper[]> {
    try {
      const response = await axios.get(`${API_URL}/services`, {
        headers: getAuthHeader() 
      });

      // --- Add Log Before Map ---
      console.log("[Browse Service] Raw API response data:", response.data);
      // --- End Log ---

      // Map _id to id if your frontend uses 'id' primarily and exclude the bio field
      const mappedData = response.data.map((hk: any) => {
        // Create a new object without the bio field
        const { bio, ...hkWithoutBio } = hk;
        
        return {
          ...hkWithoutBio,
          id: hk._id || hk.id, // Handle if ID is already mapped or not
          services: hk.services.map((s: any) => ({ ...s, id: s._id || s.id })) // Also handle service ID
        };
      });

      // --- Add Log After Map ---
      console.log("[Browse Service] Mapped data being returned:", mappedData);
      // --- End Log ---

      return mappedData; // Return the mapped data
    } catch (error) {
      console.error('[Browse Service] Error fetching available services:', error);
      // Handle specific errors if needed
      throw error; // Re-throw to be caught by the component
    }
  }
}; 