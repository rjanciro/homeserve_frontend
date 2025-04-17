import axios from 'axios';
import { getAuthHeader } from '../utils/auth';

const API_URL = 'http://localhost:8080/api/documents';

export const documentService = {
  // Upload verification document
  async uploadDocument(docType: string, formData: FormData) {
    // Validate docType is one of the allowed types
    const validDocTypes = ['identificationCard', 'certifications'];
    if (!validDocTypes.includes(docType)) {
      throw new Error('Invalid document type');
    }
    
    // Get the file from the original formData
    const file = formData.get('document');
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Create a new FormData with the correct field name that the server expects
    const correctedFormData = new FormData();
    
    // The server expects 'documents' as the field name, not 'document'
    correctedFormData.append('documents', file as Blob);
    
    try {
      const response = await axios.post(`${API_URL}/upload/${docType}`, correctedFormData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error uploading ${docType} document:`, error);
      throw error;
    }
  },
  
  // Get document verification status
  async getDocumentStatus() {
    try {
      const response = await axios.get(`${API_URL}/status`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting document status:', error);
      throw error;
    }
  },
  
  // Resubmit documents after rejection
  async resubmitDocuments() {
    const response = await axios.post(`${API_URL}/resubmit`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  
  // Delete a specific document file
  async deleteDocument(docType: string, fileId: string) {
    const response = await axios.delete(`${API_URL}/${docType}/${fileId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  
  // Submit documents for verification
  async submitDocumentsForVerification() {
    try {
      const response = await axios.post(`${API_URL}/submit`, {}, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting documents for verification:', error);
      throw error;
    }
  }
}; 