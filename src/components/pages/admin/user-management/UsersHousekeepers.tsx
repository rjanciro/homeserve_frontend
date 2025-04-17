import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaUserCheck, FaSpinner, FaFilter, FaSearch, FaEye, FaFileAlt, FaFolder, FaLock, FaLockOpen } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import useDocumentTitle from '../../../../hooks/useDocumentTitle';
import { adminService } from '../../../services/admin.service';
import { profileService } from '../../../services/profile.service';

// Define housekeeper type
interface Housekeeper {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDate?: string;
  verificationNotes?: string;
  createdAt: string;
  verificationDocuments?: {
    representativeId?: {
      files: Array<{
        url?: string;
        path?: string;
        filename: string;
        uploadDate: string;
        verified: boolean;
      }>;
    };
  };
  isActive?: boolean;
  statusUpdateDate?: string;
  statusNotes?: string;
}

const UsersHousekeepersPage: React.FC = () => {
  useDocumentTitle('Housekeepers | Admin');
  
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [filteredHousekeepers, setFilteredHousekeepers] = useState<Housekeeper[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHousekeeper, setSelectedHousekeeper] = useState<Housekeeper | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string | null>(null);
  const [housekeeperDocuments, setHousekeeperDocuments] = useState<any>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  // Fetch housekeepers on component mount
  useEffect(() => {
    fetchHousekeepers();
  }, []);

  // Filter housekeepers when filter or search changes
  useEffect(() => {
    filterHousekeepers();
  }, [housekeepers, statusFilter, searchQuery]);
  
  const fetchHousekeepers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllHousekeepers(); // Using the existing API endpoint
      setHousekeepers(response);
      setFilteredHousekeepers(response);
    } catch (error) {
      console.error('Failed to fetch housekeepers:', error);
      toast.error('Failed to load housekeepers');
    } finally {
      setLoading(false);
    }
  };
  
  const filterHousekeepers = () => {
    let filtered = [...housekeepers];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(housekeeper => housekeeper.verificationStatus === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(housekeeper => 
        housekeeper.firstName.toLowerCase().includes(query) ||
        housekeeper.lastName.toLowerCase().includes(query) ||
        housekeeper.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredHousekeepers(filtered);
  };

  const handleVerify = async (housekeeper: Housekeeper, approved: boolean) => {
    try {
      const { value: notes } = await Swal.fire({
        title: `${approved ? 'Approve' : 'Reject'} Housekeeper`,
        input: 'textarea',
        inputLabel: 'Notes (optional)',
        inputPlaceholder: approved 
          ? 'Any notes about this housekeeper...'
          : 'Please provide a reason for rejection...',
        showCancelButton: true,
        confirmButtonText: approved ? 'Approve' : 'Reject',
        confirmButtonColor: approved ? '#10B981' : '#EF4444',
      });
      
      if (notes !== undefined) { // User clicked confirm
        await adminService.verifyHousekeeper(housekeeper._id, {
          approved: approved,
          notes: notes
        });
        toast.success(`Housekeeper ${approved ? 'approved' : 'rejected'} successfully`);
        
        // Update housekeeper in local state
        setHousekeepers(prevHousekeepers => 
          prevHousekeepers.map(h => 
            h._id === housekeeper._id 
              ? {
                  ...h, 
                  isVerified: approved,
                  verificationStatus: approved ? 'verified' : 'rejected',
                  verificationDate: new Date().toISOString(),
                  verificationNotes: notes
                }
              : h
          )
        );
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to process verification');
    }
  };
  
  const handleViewDetails = async (housekeeper: Housekeeper) => {
    setSelectedHousekeeper(housekeeper);
    setIsDetailsModalOpen(true);
    
    // Fetch housekeeper documents if they have any
    if (hasVerificationDocuments(housekeeper)) {
      setDocumentsLoading(true);
      try {
        const documentsData = await adminService.getHousekeeperDocuments(housekeeper._id);
        setHousekeeperDocuments(documentsData.documents);
      } catch (error) {
        console.error('Error fetching housekeeper documents:', error);
        toast.error('Failed to load housekeeper documents');
      } finally {
        setDocumentsLoading(false);
      }
    }
  };
  
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasVerificationDocuments = (housekeeper: Housekeeper) => {
    const docs = housekeeper.verificationDocuments;
    if (!docs) return false;
    
    const hasIdDocs = docs.representativeId?.files && docs.representativeId.files.length > 0;
    
    return hasIdDocs;
  };

  const getDocumentCount = (housekeeper: Housekeeper) => {
    const docs = housekeeper.verificationDocuments;
    if (!docs) return 0;
    
    let count = 0;
    count += docs.representativeId?.files?.length || 0;
    
    return count;
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Verified</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getProfileImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) {
      return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
    }
    
    return profileService.getFullImageUrl(imagePath) || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
  };

  // Update the openDocumentPreview function to handle server paths properly
  const openDocumentPreview = (url: string | undefined, docType: string) => {
    // Add null check for URL
    if (!url) {
      console.error("Document URL is undefined for document type:", docType);
      toast.error(`Cannot preview document: URL is missing for ${docType}`);
      return;
    }
    
    console.log("Opening document preview with URL:", url);
    
    // Format the URL properly - the backend returns a path like '/uploads/verification/file.png'
    // We need to prepend the API server URL if it's not already a full URL
    const apiBaseUrl = 'http://localhost:8080'; // This should match your API_URL in services
    const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
    
    // Log the constructed URL for debugging
    console.log("Full document URL:", fullUrl);
    
    setSelectedDocumentUrl(fullUrl);
    setIsDetailsModalOpen(true);
  };

  // Add a new function to close document preview
  const closeDocumentPreview = () => {
    setSelectedDocumentUrl(null);
  };

  const mapStatusToDisplayStatus = (status: string) => {
    if (status === 'approved') return 'verified';
    if (status === 'verified') return 'verified';
    return status;
  };

  // Add a new function to handle disabling/enabling housekeepers
  const handleToggleHousekeeperStatus = async (housekeeper: Housekeeper) => {
    const currentStatus = housekeeper.isActive !== false; // If undefined, treat as active
    const newStatus = !currentStatus;
    
    try {
      const { value: notes } = await Swal.fire({
        title: `${newStatus ? 'Enable' : 'Disable'} Housekeeper`,
        input: 'textarea',
        inputLabel: 'Notes (optional)',
        inputPlaceholder: newStatus 
          ? 'Any notes about enabling this housekeeper...'
          : 'Please provide a reason for disabling this housekeeper...',
        showCancelButton: true,
        confirmButtonText: newStatus ? 'Enable' : 'Disable',
        confirmButtonColor: newStatus ? '#10B981' : '#EF4444',
      });
      
      if (notes !== undefined) { // User clicked confirm
        await adminService.updateHousekeeperStatus(housekeeper._id, {
          isActive: newStatus,
          notes: notes
        });
        
        toast.success(`Housekeeper ${newStatus ? 'enabled' : 'disabled'} successfully`);
        
        // Update housekeeper in local state
        setHousekeepers(prevHousekeepers => 
          prevHousekeepers.map(h => 
            h._id === housekeeper._id 
              ? {
                  ...h, 
                  isActive: newStatus,
                  statusUpdateDate: new Date().toISOString(),
                  statusNotes: notes
                }
              : h
          )
        );
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update housekeeper status');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Housekeepers</h1>
        
        <div className="flex items-center space-x-4">
          {/* Status filter */}
          <div className="relative">
            <select
              className="bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Housekeepers</option>
              <option value="pending">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <FaFilter className="absolute right-3 top-3 text-gray-400" />
          </div>
          
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search housekeepers..."
              className="bg-white border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-blue-500 text-4xl" />
        </div>
      ) : filteredHousekeepers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <FaUserCheck className="text-6xl text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No Housekeepers Found</h2>
          <p className="text-gray-600">
            {statusFilter !== 'all' 
              ? `No housekeepers with status: ${statusFilter}` 
              : "No housekeepers match your search criteria"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Housekeeper
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHousekeepers.map((housekeeper) => (
                <tr key={housekeeper._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100"
                          src={getProfileImageUrl(housekeeper.profileImage)}
                          alt={`${housekeeper.firstName} ${housekeeper.lastName}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {housekeeper.firstName} {housekeeper.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {housekeeper.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {hasVerificationDocuments(housekeeper) ? (
                        <>
                          <FaFolder className="text-blue-500 mr-2" />
                          <span className="text-sm">{getDocumentCount(housekeeper)} document(s)</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No documents uploaded</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusBadgeClass(housekeeper.verificationStatus)
                    }`}>
                      {mapStatusToDisplayStatus(housekeeper.verificationStatus).charAt(0).toUpperCase() + 
                       mapStatusToDisplayStatus(housekeeper.verificationStatus).slice(1)}
                    </span>
                    {housekeeper.verificationDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(housekeeper.verificationDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      housekeeper.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {housekeeper.isActive === false ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/admin/housekeepers/${housekeeper._id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEye className="inline mr-1" /> View Documents
                    </Link>
                    
                    <button
                      onClick={() => handleToggleHousekeeperStatus(housekeeper)}
                      className={`ml-3 text-${housekeeper.isActive === false ? 'green' : 'red'}-600 hover:text-${housekeeper.isActive === false ? 'green' : 'red'}-900`}
                      title={housekeeper.isActive === false ? "Enable Housekeeper" : "Disable Housekeeper"}
                    >
                      {housekeeper.isActive === false ? <FaLockOpen className="inline mr-1" /> : <FaLock className="inline mr-1" />} 
                      {housekeeper.isActive === false ? "Enable" : "Disable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Housekeeper Details Modal */}
      {isDetailsModalOpen && selectedHousekeeper && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Housekeeper Details</h2>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row mb-6">
                <div className="mr-6 mb-4 sm:mb-0">
                  <img
                    src={getProfileImageUrl(selectedHousekeeper.profileImage)}
                    alt={`${selectedHousekeeper.firstName} ${selectedHousekeeper.lastName}`}
                    className="h-32 w-32 rounded-full object-cover"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-2">Verification Status</h4>
                <div className="bg-gray-50 p-3 rounded-md text-gray-700">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusBadgeClass(selectedHousekeeper.verificationStatus)
                  }`}>
                    {mapStatusToDisplayStatus(selectedHousekeeper.verificationStatus).charAt(0).toUpperCase() + 
                     mapStatusToDisplayStatus(selectedHousekeeper.verificationStatus).slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="mb-6 mt-4">
                <Link
                  to={`/admin/housekeepers/${selectedHousekeeper._id}`}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 inline-flex items-center"
                >
                  <FaFolder className="mr-2" /> View Verification Documents
                </Link>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    if (selectedHousekeeper.verificationStatus === 'pending') {
                      handleVerify(selectedHousekeeper, false);
                    }
                  }}
                  className={`px-4 py-2 rounded-md text-white ${
                    selectedHousekeeper.verificationStatus === 'pending' ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400'
                  }`}
                  disabled={selectedHousekeeper.verificationStatus !== 'pending'}
                >
                  <FaTimes className="inline mr-1" /> Reject
                </button>
                
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    if (selectedHousekeeper.verificationStatus !== 'verified') {
                      handleVerify(selectedHousekeeper, true);
                    }
                  }}
                  className={`px-4 py-2 rounded-md text-white ${
                    selectedHousekeeper.verificationStatus !== 'verified' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'
                  }`}
                  disabled={selectedHousekeeper.verificationStatus === 'verified'}
                >
                  <FaCheck className="inline mr-1" /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Document Preview Modal */}
      {selectedDocumentUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-90vh overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Document Preview</h3>
              <button onClick={closeDocumentPreview} className="text-gray-500 hover:text-gray-700">
                <span className="text-xl">×</span>
              </button>
            </div>
            
            <div className="p-4 flex justify-center" style={{ maxHeight: "70vh", overflow: "auto" }}>
              {selectedDocumentUrl ? (
                <img 
                  src={selectedDocumentUrl} // Already the full URL
                  alt="Document preview" 
                  className="max-w-full max-h-[60vh] object-contain"
                  onError={(e) => {
                    console.error("Failed to load image:", selectedDocumentUrl);
                    toast.error("Failed to load document preview");
                  }}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <p>No document to preview</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <a 
                href={selectedDocumentUrl} 
                download
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Download
              </a>
              <button 
                onClick={closeDocumentPreview}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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

export default UsersHousekeepersPage;
