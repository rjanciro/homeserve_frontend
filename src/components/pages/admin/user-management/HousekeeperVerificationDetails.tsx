import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaSpinner, FaExclamationTriangle, FaFile, FaDownload, FaImage, FaEye, FaFolder, FaCheckCircle, FaRegClock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import useDocumentTitle from '../../../../hooks/useDocumentTitle';
import { adminService } from '../../../services/admin.service';
import { Link } from 'react-router-dom';
import { profileService } from '../../../services/profile.service';

interface DocumentFile {
  id?: string;
  filename: string;
  url?: string;     // From frontend interface
  path?: string;    // From backend database model
  uploadDate: string;
  verified?: boolean;
  mimetype?: string;
  size?: number;
}

interface DocumentType {
  files: DocumentFile[];
  verified: boolean;
  uploadDate?: string;
  notes?: string;
}

interface HousekeeperDocuments {
  [key: string]: DocumentType;
}

interface Housekeeper {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  verificationStatus?: string;
  documents?: HousekeeperDocuments;
  profileImage?: string;
  businessName?: string;
  bio?: string;
  verificationDate?: string;
  verificationNotes?: string;
}

interface VerificationHistory {
  status: 'pending' | 'verified' | 'approved' | 'rejected';
  date: string;
  notes?: string;
  reviewer?: string;
}

// Define this in a shared types file
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

const HousekeeperVerificationDetailsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  useDocumentTitle('Housekeeper Verification Details | Admin');
  
  const [housekeeper, setHousekeeper] = useState<Housekeeper | null>(null);
  const [documents, setDocuments] = useState<HousekeeperDocuments | null>(null);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [documentNotes, setDocumentNotes] = useState<Record<string, string>>({});
  const [selectedDocument, setSelectedDocument] = useState<{url: string, type: string} | null>(null);

  useEffect(() => {
    if (userId) {
      fetchHousekeeperDocuments();
    }
  }, [userId]);

  const fetchHousekeeperDocuments = async () => {
    setLoading(true);
    try {
      console.log("Fetching documents for user ID:", userId);
      const data = await adminService.getHousekeeperDocuments(userId as string);
      
      console.log("Received data:", data);
      
      // Set the documents and history
      setDocuments(data.documents || {});
      setHistory(data.history || []);

      // Set housekeeper data
      setHousekeeper(data.housekeeper || null);
    } catch (error: any) {
      console.error('Error fetching housekeeper documents:', error);
      toast.error('Failed to load housekeeper verification documents');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (approved: boolean) => {
    if (!housekeeper) return;
    
    // Prompt for notes
    const { value: notes } = await Swal.fire({
      title: 'Review Notes',
      input: 'textarea',
      inputLabel: approved ? 'Approval notes (optional)' : 'Rejection reason (required)',
      inputPlaceholder: approved ? 'Enter any notes...' : 'Please explain why this housekeeper is being rejected...',
      inputValidator: (value) => {
        if (!approved && !value) {
          return 'You need to provide a reason for rejection';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: approved ? 'Approve Housekeeper' : 'Reject Housekeeper',
      confirmButtonColor: approved ? '#10B981' : '#EF4444',
    });
    
    if (notes === undefined) return; // User cancelled
    
    setVerifying(true);
    try {
      await adminService.verifyHousekeeper(housekeeper._id, {
        approved: approved,
        notes: notes,
        documentReview: {}
      });
      
      toast.success(`Housekeeper ${approved ? 'approved' : 'rejected'} successfully`);
      
      // Refresh data
      fetchHousekeeperDocuments();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error during housekeeper review:', error.message);
      } else {
        console.error('Unknown error during housekeeper review:', error);
      }
      toast.error('Failed to process housekeeper review');
    } finally {
      setVerifying(false);
    }
  };

  const updateDocumentNotes = (docType: string, notes: string) => {
    setDocumentNotes(prev => ({
      ...prev,
      [docType]: notes
    }));
  };

  const openDocumentPreview = (url: string | undefined, docType: string) => {
    if (!url) {
      console.error("Document URL is undefined for document type:", docType);
      toast.error(`Cannot preview document: URL is missing`);
      return;
    }
    
    const fullUrl = getFullUrl(url);
    setSelectedDocument({
      url: fullUrl,
      type: docType
    });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200 shadow-sm flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-rose-100 rounded-full"></span>
            </span>
            Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 shadow-sm flex items-center">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
            Pending
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200 shadow-sm flex items-center">
            <span className="w-2 h-2 rounded-full bg-gray-500 mr-1.5"></span>
            Unknown
          </span>
        );
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'verified':
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-rose-100 text-rose-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProfileImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) {
      return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
    }
    
    return profileService.getFullImageUrl(imagePath) || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
  };

  const renderDocumentSection = (docType: string, label: string) => {
    const docData = documents?.[docType as keyof HousekeeperDocuments];
    
    if (!docData || !docData.files || docData.files.length === 0) {
      return null;
    }
    
    return (
      <div key={`doc-section-${docType}`} className="mb-8 bg-white rounded-2xl shadow p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
            {label}
          </h3>
          {docData.verified && (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs rounded-full flex items-center font-medium shadow-sm">
              <FaCheckCircle className="mr-1.5" /> Verified
            </span>
          )}
        </div>
        
        {docData.notes && (
          <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 mb-6 rounded-r-md">
            <p className="text-sm font-medium text-emerald-800">Document Notes:</p>
            <p className="text-gray-700 mt-1">{docData.notes}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docData.files.map((file, index) => {
            const fileUrl = file.url || file.path;
            const fullUrl = getFullUrl(fileUrl);
            
            return (
              <div 
                key={`file-${docType}-${index}`} 
                className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                  <h4 className="font-medium text-gray-800 truncate">{file.filename}</h4>
                  <span className="text-xs text-gray-500 bg-white rounded-full px-2.5 py-1 shadow-sm border border-gray-100">
                    {new Date(file.uploadDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="p-4 bg-gray-50 flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-full mr-3 group-hover:bg-emerald-200 transition-colors">
                    <FaFile className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm text-gray-700">{file.filename}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                    </div>
                  </div>
                </div>
                
                {isImageFile(file.filename) && fullUrl && (
                  <div className="px-4 py-3 bg-black bg-opacity-5">
                    <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                      <img 
                        src={fullUrl}
                        alt={file.filename} 
                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex p-3 bg-white border-t border-gray-100">
                  <a 
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm flex items-center justify-center hover:bg-emerald-100 transition-colors mr-2 font-medium shadow-sm"
                  >
                    <FaEye className="mr-1.5" /> View
                  </a>
                  <a 
                    href={fullUrl}
                    download={file.filename}
                    className="flex-1 py-2.5 px-3 bg-teal-50 text-teal-600 rounded-lg text-sm flex items-center justify-center hover:bg-teal-100 transition-colors font-medium shadow-sm"
                  >
                    <FaDownload className="mr-1.5" /> Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isImageFile = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '');
  };

  const handleApproveHousekeeper = async () => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Approve Housekeeper',
        text: 'Are you sure you want to approve this housekeeper?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4CAF50',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, approve',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        // Show loading toast
        const loadingToast = toast.loading('Approving housekeeper...');
        
        // Collect all document reviews (assuming all are approved)
        const documentReview: Record<string, {verified: boolean}> = {};
        if (documents) {
          Object.keys(documents).forEach(docType => {
            documentReview[docType] = { verified: true };
          });
        }
        
        // Call the API to verify the housekeeper
        if (userId) {
          await adminService.verifyHousekeeper(userId, {
            approved: true,
            notes: 'Housekeeper approved by admin',
            documentReview
          });
        }
        
        // Dismiss loading toast and show success message
        toast.dismiss(loadingToast);
        toast.success('Housekeeper successfully approved');
        
        // Refresh the housekeeper data
        fetchHousekeeperDocuments();
      }
    } catch (error: any) {
      console.error('Error approving housekeeper:', error);
      toast.error('Failed to approve housekeeper');
    }
  };

  const getFullUrl = (fileUrl: string | undefined): string => {
    if (!fileUrl) {
      return ''; // Return empty string for invalid input
    }

    // If it's already a full absolute URL (e.g., from a different source), return it
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }

    // Get the API base URL
    const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

    // Extract filename for verification files
    let filename = '';
    if (fileUrl.includes('verification/')) {
      const parts = fileUrl.split('/');
      filename = parts[parts.length - 1];
    }

    // Handle different URL formats
    if (fileUrl.startsWith('/api/uploads/')) {
      // Remove the /api prefix as static files are served directly from /uploads
      return `${apiBaseUrl}${fileUrl.replace('/api', '')}`;
    } else if (fileUrl.startsWith('/uploads/')) {
      // If it's already a proper path, just prepend the base URL
      return `${apiBaseUrl}${fileUrl}`;
    } else if (fileUrl.startsWith('uploads/')) {
      // If it's missing the leading slash, add it
      return `${apiBaseUrl}/${fileUrl}`;
    } else {
      // For verification files, use the direct-file endpoint as a more reliable option
      if (filename) {
        return `${apiBaseUrl}/direct-file/${filename}`;
      }
      // For other cases, assume it's a filename in the verification directory
      return `${apiBaseUrl}/uploads/verification/${fileUrl}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-h-screen overflow-auto bg-slate-50">
      <div className="mb-6">
        <Link 
          to="/admin/housekeepers" 
          className="text-emerald-600 hover:text-emerald-800 flex items-center transition-colors duration-200 font-medium group"
        >
          <span className="bg-white p-2 rounded-full shadow-sm mr-2 group-hover:bg-emerald-50 transition-colors duration-200">
            <FaArrowLeft className="text-emerald-500" />
          </span>
          <span>Back to Housekeepers</span>
        </Link>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl mb-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">Housekeeper Verification Details</h1>
          {housekeeper && (
            <p className="text-emerald-100 mt-1">
              Review and verify documents for {housekeeper.firstName} {housekeeper.lastName}
            </p>
          )}
        </div>
        
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="flex flex-col items-center">
              <FaSpinner className="animate-spin text-4xl text-emerald-500 mb-2" />
              <p className="text-gray-500">Loading housekeeper details...</p>
            </div>
          </div>
        ) : !housekeeper ? (
          <div className="p-8 text-center">
            <div className="bg-amber-50 rounded-lg p-6 inline-block">
              <FaExclamationTriangle className="text-amber-500 text-5xl mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Housekeeper details not found</p>
              <p className="text-gray-500 text-sm mt-1">The requested housekeeper information is unavailable</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100 bg-white">
              <div className="flex flex-col md:flex-row">
                <div className="mb-6 md:mb-0 md:mr-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <img
                      src={getProfileImageUrl(housekeeper.profileImage)}
                      alt={`${housekeeper.firstName} ${housekeeper.lastName}`}
                      className="h-40 w-40 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-[1.02] transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                      }}
                    />
                    <div className="absolute bottom-1 right-1">
                      {renderStatusBadge(housekeeper.verificationStatus || 'pending')}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2 text-gray-800 flex items-center">
                    {housekeeper.firstName} {housekeeper.lastName}
                    {housekeeper.businessName && (
                      <span className="ml-2 text-sm px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Business</span>
                    )}
                  </h2>
                  <p className="text-gray-600 mb-2 flex items-center transition-all duration-200 hover:text-emerald-600">
                    <span className="inline-block bg-emerald-100 rounded-full p-1.5 mr-2 text-emerald-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </span>
                    {housekeeper.email}
                  </p>
                  {housekeeper.phone && (
                    <p className="text-gray-600 mb-3 flex items-center transition-all duration-200 hover:text-emerald-600">
                      <span className="inline-block bg-emerald-100 rounded-full p-1.5 mr-2 text-emerald-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </span>
                      {housekeeper.phone}
                    </p>
                  )}
                  
                  {housekeeper.verificationDate && (
                    <p className="text-sm text-gray-500 mt-2 bg-slate-50 rounded-lg px-3 py-1.5 inline-block border border-slate-200">
                      <FaRegClock className="inline mr-1 text-gray-400" /> Last updated: {new Date(housekeeper.verificationDate).toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg mr-2 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                Verification Documents
              </h2>
              
              <div className="space-y-8">
                {documents && Object.keys(documents).map(docType => 
                  renderDocumentSection(docType, docType.charAt(0).toUpperCase() + docType.slice(1).replace(/([A-Z])/g, ' $1'))
                )}
                {(!documents || Object.keys(documents).length === 0) && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                    <FaFolder className="mx-auto text-gray-400 text-4xl mb-3" />
                    <p className="text-gray-500 font-medium">No verification documents available</p>
                    <p className="text-gray-400 text-sm mt-1">The housekeeper hasn't uploaded any documents yet</p>
                  </div>
                )}
              </div>
              
              <div className="mt-10 flex justify-end space-x-4">
                {housekeeper.verificationStatus === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleReviewAction(false)}
                      disabled={verifying}
                      className="px-5 py-2.5 bg-white border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-sm font-medium"
                    >
                      {verifying ? <FaSpinner className="animate-spin mr-2" /> : <FaTimes className="mr-2" />}
                      Reject Housekeeper
                    </button>
                    <button 
                      onClick={handleApproveHousekeeper}
                      disabled={verifying}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center shadow-md font-medium"
                    >
                      {verifying ? <FaSpinner className="animate-spin mr-2" /> : <FaCheck className="mr-2" />}
                      Approve Housekeeper
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-8 pb-8 px-6 bg-slate-50">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg mr-2 text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                Verification History
              </h2>
              
              {history.length > 0 ? (
                <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white hover:bg-slate-50 transition-colors' : 'bg-slate-50 hover:bg-slate-100 transition-colors'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.date).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.status === 'verified' || item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 
                                item.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                              {item.notes || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.reviewer || 'System'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="bg-slate-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FaRegClock className="text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-500 font-medium">No verification history available</p>
                  <p className="text-gray-400 text-sm mt-1">This housekeeper's documents haven't been reviewed yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-auto backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-90vh overflow-hidden shadow-2xl transform transition-all duration-300 border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <h3 className="text-lg font-medium flex items-center">
                <FaFile className="mr-2" /> Document Preview - {selectedDocument.type}
              </h3>
              <button 
                onClick={() => setSelectedDocument(null)} 
                className="text-white hover:text-gray-200 bg-white bg-opacity-20 rounded-full p-2 transition-colors hover:bg-opacity-30"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            
            <div className="p-6 flex justify-center bg-slate-50" style={{ maxHeight: "70vh", overflow: "auto" }}>
              {selectedDocument.url ? (
                isImageFile(selectedDocument.url) ? (
                  <img 
                    src={selectedDocument.url}
                    alt="Document preview" 
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md border border-gray-200"
                    onError={(e) => {
                      toast.error("Failed to load document preview");
                    }}
                  />
                ) : (
                  <iframe
                    src={selectedDocument.url}
                    className="w-full rounded-lg border border-gray-200 shadow-md"
                    style={{ height: "60vh" }}
                    title="Document preview"
                    onError={() => toast.error("Failed to load document preview")}
                  />
                )
              ) : (
                <div className="text-center text-gray-500">
                  <p>No document to preview</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 bg-white">
              <a 
                href={selectedDocument.url}
                download
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors duration-200 flex items-center shadow-sm"
              >
                <FaDownload className="mr-2" /> Download
              </a>
              <button 
                onClick={() => setSelectedDocument(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HousekeeperVerificationDetailsPage;