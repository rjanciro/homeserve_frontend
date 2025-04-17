import React, { useState, useEffect, useRef } from 'react';
import { FaUpload, FaTrash, FaSpinner, FaIdCard, FaCertificate, FaCheck, FaTimes, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { documentService } from '../../services/document.service';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

// Type definitions
interface DocumentFile {
  id: string;
  file: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
}

interface DocumentStatus {
  files: DocumentFile[];
  verified: boolean;
  uploadDate?: string;
  notes?: string;
}

interface DocumentsStatus {
  identificationCard?: DocumentStatus;
  certifications?: DocumentStatus;
  [key: string]: DocumentStatus | undefined; // Add index signature for dynamic access
}

interface DocumentType {
  id: string;
  label: string;
  description: string;
  maxFiles: number;
  maxSize: number; // in MB
  accepts: string;
  examples: string[];
}

// Document types configuration
const documentTypes: DocumentType[] = [
  {
    id: 'identificationCard',
    label: 'Identification Card',
    description: 'Upload a government-issued ID to verify your identity (e.g., National ID, Driver\'s License, Passport)',
    maxFiles: 2,
    maxSize: 5,
    accepts: 'image/jpeg, image/png, image/jpg, application/pdf',
    examples: ['National ID', 'Driver\'s License', 'Passport', 'Voter\'s ID']
  },
  {
    id: 'certifications',
    label: 'Certifications or Experience Documents',
    description: 'Upload any certificates, training documents, or recommendation letters related to housekeeping',
    maxFiles: 5,
    maxSize: 10,
    accepts: 'image/jpeg, image/png, image/jpg, application/pdf',
    examples: ['Housekeeping Certificates', 'Training Completion', 'Previous Employment Letter', 'Recommendation Letters']
  }
];

const VerificationDocumentsPage: React.FC = () => {
  useDocumentTitle('Verification Documents');
  const navigate = useNavigate();
  
  // States
  const [files, setFiles] = useState<Record<string, DocumentFile[]>>({
    identificationCard: [],
    certifications: []
  });
  
  const [uploading, setUploading] = useState<Record<string, boolean>>({
    identificationCard: false,
    certifications: false
  });
  
  const [status, setStatus] = useState<DocumentsStatus>({});
  const [verificationStatus, setVerificationStatus] = useState<string>('not_submitted');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // Fetch document status on component mount
  useEffect(() => {
    fetchDocumentStatus();
  }, []);
  
  // Fetch document status from backend
  const fetchDocumentStatus = async () => {
    try {
      const response = await documentService.getDocumentStatus();
      console.log('Document status:', response);
      
      setVerificationStatus(response.status || 'not_submitted');
      
      // Process each document type in the response
      const newStatus: DocumentsStatus = {};
      
      documentTypes.forEach(docType => {
        if (response.documents && response.documents[docType.id]) {
          const docStatus = response.documents[docType.id];
          
          // Map files from server format to our format
          const processedFiles: DocumentFile[] = docStatus.files.map((file: any) => ({
            id: file.id,
            url: `http://localhost:8080${file.path}`,
            preview: `http://localhost:8080${file.path}`,
            uploaded: true,
            file: {} as File // Placeholder - we don't need the actual file for already uploaded docs
          }));
          
          newStatus[docType.id] = {
            files: processedFiles,
            verified: docStatus.verified || false,
            uploadDate: docStatus.uploadDate,
            notes: docStatus.notes
          };
        }
      });
      
      setStatus(newStatus);
    } catch (error) {
      console.error('Error fetching document status:', error);
      toast.error('Failed to load document status');
    }
  };
  
  // Handle file selection
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const docTypeInfo = documentTypes.find(dt => dt.id === docType);
    if (!docTypeInfo) return;
    
    const selectedFiles = Array.from(e.target.files);
    const currentFiles = [...(files[docType] || [])];
    
    // Check if adding these files would exceed the maximum
    if (currentFiles.length + selectedFiles.length > docTypeInfo.maxFiles) {
      toast.error(`You can only upload a maximum of ${docTypeInfo.maxFiles} files for ${docTypeInfo.label}`);
      return;
    }
    
    // Process each selected file
    const newFiles = selectedFiles.map(file => {
      // Check file size
      if (file.size > docTypeInfo.maxSize * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds the maximum size of ${docTypeInfo.maxSize}MB`);
        return null;
      }
      
      // Create a preview URL
      const preview = URL.createObjectURL(file);
      
      return {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        uploaded: false
      };
    }).filter(file => file !== null) as DocumentFile[];
    
    setFiles({
      ...files,
      [docType]: [...currentFiles, ...newFiles]
    });
    
    // Reset the file input
    if (e.target) {
      e.target.value = '';
    }
  };
  
  // Remove a file
  const removeFile = (docType: string, fileId: string) => {
    // Check if file is already uploaded to server
    const docStatus = status[docType];
    const isUploaded = docStatus?.files.some(f => f.id === fileId) || false;
    
    if (isUploaded) {
      // If uploaded, call server to delete
      handleDeleteDocument(docType, fileId);
    } else {
      // If not uploaded yet, just remove from state
      const fileToRemove = files[docType]?.find(f => f.id === fileId);
      
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      
      setFiles({
        ...files,
        [docType]: files[docType]?.filter(f => f.id !== fileId) || []
      });
    }
  };
  
  // Handle document upload
  const handleUploadDocument = async (docType: string) => {
    const filesToUpload = files[docType]?.filter(f => !f.uploaded);
    
    if (!filesToUpload || filesToUpload.length === 0) {
      toast.error('No new files to upload');
      return;
    }
    
    setUploading({
      ...uploading,
      [docType]: true
    });
    
    try {
      for (const fileObj of filesToUpload) {
        const formData = new FormData();
        formData.append('document', fileObj.file);
        
        await documentService.uploadDocument(docType, formData);
      }
      
      toast.success(`Files uploaded successfully for ${documentTypes.find(dt => dt.id === docType)?.label}`);
      
      // Refresh document status
      await fetchDocumentStatus();
      
      // Clear the temporary files
      setFiles({
        ...files,
        [docType]: []
      });
    } catch (error) {
      console.error(`Error uploading ${docType} documents:`, error);
      toast.error(`Failed to upload documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading({
        ...uploading,
        [docType]: false
      });
    }
  };
  
  // Submit all documents for verification
  const handleSubmitAllDocuments = async () => {
    setIsSubmitting(true);
    
    try {
      // Check if there are any unsaved files
      let hasUnsavedFiles = false;
      documentTypes.forEach(docType => {
        if (files[docType.id]?.some(f => !f.uploaded)) {
          hasUnsavedFiles = true;
        }
      });
      
      if (hasUnsavedFiles) {
        const confirmUpload = window.confirm('You have files that haven\'t been uploaded yet. Do you want to upload them now?');
        if (confirmUpload) {
          for (const docType of documentTypes) {
            if (files[docType.id]?.some(f => !f.uploaded)) {
              await handleUploadDocument(docType.id);
            }
          }
        }
      }
      
      // Now submit for verification
      await documentService.submitDocumentsForVerification();
      
      toast.success('Documents submitted for verification successfully!');
      setVerificationStatus('pending');
      
      // Redirect back to services page after 2 seconds
      setTimeout(() => {
        navigate('/housekeeper/my-services');
      }, 2000);
    } catch (error) {
      console.error('Error submitting documents for verification:', error);
      toast.error(`Failed to submit documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete document from server
  const handleDeleteDocument = async (docType: string, fileId: string) => {
    try {
      await documentService.deleteDocument(docType, fileId);
      toast.success('Document deleted successfully');
      
      // Refresh document status
      await fetchDocumentStatus();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Get status badge based on verification status
  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <div className="flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
            <FaExclamationCircle className="mr-2" /> Your documents are under review
          </div>
        );
      case 'approved':
      case 'verified':
        return (
          <div className="flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
            <FaCheck className="mr-2" /> Your account is verified
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium">
            <FaTimes className="mr-2" /> Verification rejected. Please resubmit your documents.
          </div>
        );
      default:
        return (
          <div className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
            <FaIdCard className="mr-2" /> Please submit your documents for verification
          </div>
        );
    }
  };
  
  // Render a file preview
  const renderFilePreview = (file: DocumentFile, docType: string) => {
    const isPdf = file.preview?.endsWith('.pdf') || file.url?.endsWith('.pdf');
    
    return (
      <div key={file.id} className="relative border rounded-lg overflow-hidden bg-gray-50">
        {file.uploaded && (
          <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg z-10">
            Uploaded
          </div>
        )}
        
        <div className="h-36 flex items-center justify-center p-2">
          {isPdf ? (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <iframe 
                src={file.preview || file.url} 
                className="w-full h-24"
                title="PDF preview"
              />
              <span className="text-xs mt-2">PDF Document</span>
            </div>
          ) : (
            <img 
              src={file.preview || file.url} 
              alt="Document preview" 
              className="h-full object-contain"
            />
          )}
        </div>
        
        <div className="bg-white p-2 border-t">
          <div className="flex justify-between items-center">
            <div className="truncate text-xs">{file.file?.name || 'Uploaded document'}</div>
            <button 
              onClick={() => removeFile(docType, file.id)}
              className="text-red-500 hover:text-red-700"
              title="Remove file"
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Helper to safely access document status
  const getDocumentStatusFiles = (docType: string): DocumentFile[] => {
    return status[docType]?.files || [];
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/housekeeper/my-services" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-2" /> Back to My Services
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Housekeeper Verification Documents</h1>
        <p className="text-gray-600">
          To become a verified housekeeper on our platform, please provide the following documents. 
          This helps us ensure a safe and trustworthy environment for our customers.
        </p>
      </div>
      
      <div className="mb-6">
        {getStatusBadge()}
      </div>
      
      {verificationStatus === 'pending' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your documents are currently under review. This process usually takes 1-2 business days.
                You'll be notified once your verification is complete.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {verificationStatus === 'rejected' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Your verification was rejected. Please review the feedback below and resubmit your documents.
              </p>
              {status.identificationCard?.notes && (
                <div className="mt-2">
                  <p className="font-medium text-sm">ID Verification:</p>
                  <p className="text-sm">{status.identificationCard.notes}</p>
                </div>
              )}
              {status.certifications?.notes && (
                <div className="mt-2">
                  <p className="font-medium text-sm">Certifications:</p>
                  <p className="text-sm">{status.certifications.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {(verificationStatus === 'not_submitted' || verificationStatus === 'rejected') && documentTypes.map(docType => (
        <div key={docType.id} className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-start mb-4">
            {docType.id === 'identificationCard' ? (
              <FaIdCard className="text-blue-500 text-xl mr-3 mt-1" />
            ) : (
              <FaCertificate className="text-blue-500 text-xl mr-3 mt-1" />
            )}
            <div>
              <h2 className="text-lg font-medium text-gray-900">{docType.label}</h2>
              <p className="text-gray-600 text-sm mt-1">{docType.description}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">Examples: {docType.examples.join(', ')}</div>
            <div className="flex flex-wrap items-center text-sm text-gray-500">
              <span className="mr-4">Max files: {docType.maxFiles}</span>
              <span>Max size: {docType.maxSize}MB per file</span>
            </div>
          </div>
          
          {/* File input section */}
          <div className="mb-4">
            <input
              type="file"
              ref={el => fileInputRefs.current[docType.id] = el}
              className="hidden"
              accept={docType.accepts}
              multiple={docType.maxFiles > 1}
              onChange={(e) => handleFileSelection(e, docType.id)}
            />
            
            <button
              type="button"
              onClick={() => fileInputRefs.current[docType.id]?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow-sm"
              disabled={uploading[docType.id] || false}
            >
              <FaUpload className="mr-2" />
              Select Files
            </button>
          </div>
          
          {/* Preview files grid */}
          {((files[docType.id]?.length || 0) > 0 || getDocumentStatusFiles(docType.id).length > 0) && (
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-gray-700">Selected Files</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* Display already uploaded files from status */}
                {getDocumentStatusFiles(docType.id).map(file => 
                  renderFilePreview(file, docType.id)
                )}
                
                {/* Display newly selected files */}
                {files[docType.id]?.filter(f => !f.uploaded).map(file => 
                  renderFilePreview(file, docType.id)
                )}
              </div>
            </div>
          )}
          
          {/* Upload button */}
          {(files[docType.id]?.some(f => !f.uploaded) || false) && (
            <button
              type="button"
              onClick={() => handleUploadDocument(docType.id)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center shadow-sm disabled:opacity-50"
              disabled={uploading[docType.id] || false}
            >
              {uploading[docType.id] ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Upload Files
                </>
              )}
            </button>
          )}
        </div>
      ))}
      
      {/* Submit for verification button */}
      {(verificationStatus === 'not_submitted' || verificationStatus === 'rejected') && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={handleSubmitAllDocuments}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center shadow-md disabled:opacity-50 font-medium"
            disabled={isSubmitting || 
              (!getDocumentStatusFiles('identificationCard').length && !(files.identificationCard?.length || 0)) || 
              (documentTypes.some(dt => files[dt.id]?.some(f => !f.uploaded) || false))}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <FaIdCard className="mr-2" />
                Submit for Verification
              </>
            )}
          </button>
        </div>
      )}
      
      {verificationStatus === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <FaCheck className="mx-auto text-green-500 text-4xl mb-4" />
          <h2 className="text-xl font-medium text-green-800 mb-2">Your Account is Verified!</h2>
          <p className="text-green-700 mb-4">
            Congratulations! Your account has been verified. You can now offer housekeeping services on our platform.
          </p>
          <Link
            to="/housekeeper/my-services"
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
          >
            Go to My Services
          </Link>
        </div>
      )}
    </div>
  );
};

export default VerificationDocumentsPage; 