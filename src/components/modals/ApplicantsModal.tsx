import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaInfoCircle, FaMoneyBillWave, FaFile, FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { profileService } from '../services/profile.service';

// Types (Copied from JobPosts.tsx - consider centralizing types)
interface Applicant {
  id: string;
  name: string;
  message: string;
  hasId: boolean;
  hasCertifications: boolean;
  userImage?: string;
  userId: string;
  rate: number;
  status: 'pending' | 'accepted' | 'rejected';
  dateApplied: string;
  startDate?: string;
  availableDays?: { [key: string]: boolean };
  experienceSummary?: string;
  isVerified?: boolean;
}

interface JobPostSchedule {
  type: string;
  days?: string[];
  // Add other schedule fields if needed by formatAvailability
}

interface ApplicantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicants: Applicant[];
  jobTitle: string;
  jobSchedule?: JobPostSchedule; // Needed for formatAvailability
  jobId: string; // Needed for hire/reject actions
  onHire: (jobId: string, applicant: Applicant) => Promise<void>;
  onReject: (jobId: string, applicantId: string) => void | Promise<void>;
}

const ApplicantsModal: React.FC<ApplicantsModalProps> = ({
  isOpen,
  onClose,
  applicants,
  jobTitle,
  jobSchedule,
  jobId,
  onHire,
  onReject,
}) => {
  const navigate = useNavigate();
  const defaultImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

  // Use the profileService for image URLs
  const getProfileImageUrl = (imagePath: string | undefined): string => {
    console.log('ApplicantsModal - Raw profileImage path:', imagePath);
    
    if (!imagePath) {
      console.log('ApplicantsModal - No image path, using default');
      return defaultImage;
    }
    
    // Use profileService to get the full image URL
    const fullUrl = profileService.getFullImageUrl(imagePath);
    console.log('ApplicantsModal - Constructed URL:', fullUrl);
    
    // If profileService returns empty string (for null/undefined), use default
    return fullUrl || defaultImage;
  };

  // Helper to format date (Copied from JobPosts.tsx)
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Helper to format availability (Copied and adapted from JobPosts.tsx)
  const formatAvailability = (schedule: JobPostSchedule | undefined, availableDays: Applicant['availableDays']) => {
    if (!schedule || !availableDays || schedule.type !== 'recurring' || !schedule.days) {
      return 'Not specified';
    }
    const available = schedule.days.filter(day => availableDays[day]);
    if (available.length === 0) return 'None of the requested days';
    return available.join(', ');
  };

  if (!isOpen) return null;

  // Log all applicants' profile image paths for debugging
  console.log('ApplicantsModal - All applicants:', applicants.map(a => ({
    id: a.id,
    name: a.name,
    userImage: a.userImage
  })));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200/50">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200/70 sticky top-0 bg-white/90 backdrop-blur-sm z-10 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Applicants for <span className="text-[#133E87]">{jobTitle}</span>
          </h2>
          <button 
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-12rem)]">
          {applicants.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEye className="text-2xl text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No applicants yet</p>
              <p className="text-gray-400 mt-2">Check back later for applications</p>
            </div>
          ) : (
            applicants.map((applicant) => {
              // Log each applicant's image path as it's being processed
              console.log(`Processing applicant ${applicant.name}:`, {
                userImage: applicant.userImage,
                constructedUrl: getProfileImageUrl(applicant.userImage)
              });
              
              return (
                <div 
                  key={applicant.id}
                  className="bg-white rounded-lg p-4 sm:p-5 shadow border border-gray-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Profile Image/Initial */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 overflow-hidden shadow-sm flex items-center justify-center mb-2 sm:mb-0 relative">
                      <img 
                        src={getProfileImageUrl(applicant.userImage)}
                        alt={applicant.name} 
                        className="w-full h-full object-cover absolute inset-0 z-10"
                        onError={(e) => { 
                          console.log(`Image load error for ${applicant.name}:`, e);
                          (e.target as HTMLImageElement).src = defaultImage; 
                          e.currentTarget.nextElementSibling?.classList.add('hidden'); 
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-gray-600 text-xl sm:text-2xl font-bold z-0">
                        {applicant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      {/* Name and Date Applied */}
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{applicant.name}</h3>
                        <span className="text-xs text-gray-500">Applied: {formatDate(applicant.dateApplied)}</span>
                      </div>
                      
                      {/* Cover Message */}
                      {applicant.message && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                          <p className="text-sm text-gray-700 italic">{applicant.message}</p>
                        </div>
                      )}
                      
                      {/* Key Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-4">
                        {/* Proposed Rate */}
                        <div className="flex items-center">
                          <FaMoneyBillWave className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                          <p className="text-sm text-gray-700">
                            Proposed Rate: <span className="font-medium text-gray-900">₱{applicant.rate?.toLocaleString() || 'N/A'}</span>
                          </p>
                        </div>
                        
                        {/* Start Date */}
                        <div className="flex items-center">
                          <FaCalendarAlt className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                          <p className="text-sm text-gray-700">
                            Can start on: <span className="font-medium text-gray-900">{formatDate(applicant.startDate)}</span>
                          </p>
                        </div>
                        
                        {/* Availability */}
                        {jobSchedule?.type === 'recurring' && (
                          <div className="flex items-start sm:col-span-2">
                            <FaClock className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">
                              Availability: <span className="font-medium text-gray-900">{formatAvailability(jobSchedule, applicant.availableDays)}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Experience Summary */}
                      {applicant.experienceSummary && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-800 mb-1 flex items-center">
                            <FaInfoCircle className="w-3.5 h-3.5 mr-1.5 text-gray-500" /> Experience Summary:
                          </h4>
                          <p className="text-sm text-gray-600 pl-5">{applicant.experienceSummary}</p>
                        </div>
                      )}
                      
                      {/* Documents/Credentials - Simplified */}
                      <div className="mb-4">
                         <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                            <FaFile className="w-3.5 h-3.5 mr-1.5 text-gray-500" /> Verification Status:
                          </h4>
                        <div className="flex flex-wrap gap-2 pl-5">
                          {applicant.isVerified ? (
                            <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheckCircle className="mr-1.5" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              <FaTimesCircle className="mr-1.5" /> Not Verified
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                        <button 
                          onClick={() => navigate(`/housekeeper-profile/${applicant.userId}`)}
                          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs sm:text-sm hover:bg-gray-200 transition-colors"
                        >
                          View Profile
                        </button>
                        <button className="bg-[#E6EBF4] text-[#133E87] px-3 py-1.5 rounded-md text-xs sm:text-sm hover:bg-[#d9e1f1] transition-colors">
                          Chat
                        </button>
                        <button 
                          onClick={() => onHire(jobId, applicant)} // Pass jobId
                          className="bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs sm:text-sm hover:bg-green-200 transition-colors font-medium"
                        >
                          Hire
                        </button>
                        <button 
                          onClick={() => onReject(jobId, applicant.id)} // Pass jobId
                          className="bg-red-100 text-red-700 px-3 py-1.5 rounded-md text-xs sm:text-sm hover:bg-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantsModal; 