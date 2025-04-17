import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:8080/api';
const SERVER_URL = 'http://localhost:8080';

export const profileService = {
  async uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    try {
      // Log file details for debugging
      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      });
      
      const response = await axios.post(`${API_URL}/profile/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Upload error details:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
        // Check if error is about file size
        if (error.response.data.includes('File too large')) {
          throw new Error('File is too large. Maximum size is 10MB.');
        }
      }
      throw error;
    }
  },
  
  async updateProfile(profileData: any) {
    console.log('Sending profile data to server:', profileData);
    
    try {
      const response = await axios.put(
        `${API_URL}/profile`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log('Server response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error in updateProfile service:', error.response?.data || error.message);
      } else {
        console.error('Error in updateProfile service:', error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  },
  
  async getProfileImage(userId: string) {
    const response = await axios.get(`${API_URL}/profile/image/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    });
    
    return URL.createObjectURL(response.data);
  },
  
  // Helper to ensure complete image URL
  getFullImageUrl(imagePath: string | undefined): string {
    if (!imagePath) {
      return "";
    }
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Otherwise prepend the API base URL
    const apiBaseUrl = 'http://localhost:8080'; // Your API URL
    return `${apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  },
  
  // Add a similar method for document URLs if not already present
  getFullDocumentUrl(documentPath: string | undefined): string {
    if (!documentPath) {
      return "";
    }
    
    // If it's already a full URL, return it
    if (documentPath.startsWith('http')) {
      return documentPath;
    }
    
    // Otherwise prepend the API base URL
    const apiBaseUrl = 'http://localhost:8080'; // Your API URL
    return `${apiBaseUrl}${documentPath.startsWith('/') ? '' : '/'}${documentPath}`;
  }
}; 