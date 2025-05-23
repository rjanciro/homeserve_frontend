import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaMapMarkerAlt, FaMoneyBillWave, FaCalendar, FaClock, FaHourglassHalf, FaCheck, FaTimes, FaUser, FaFilter, FaTag, FaInfoCircle } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import JobApplicationModal from '../../modals/JobApplicationModal';

// Types
type JobStatus = 'active' | 'paused' | 'hired' | 'archived';

interface JobApplicant {
  id: string;
  name: string;
  rate: number;
  experience: string;
  status: 'pending' | 'accepted' | 'rejected';
  dateApplied: string;
  message?: string;
  userId: string;
  userImage?: string;
  availableDays?: {[key: string]: boolean};
  startDate?: string;
  experienceSummary?: string;
}

interface JobPost {
  id: string;
  title: string;
  description: string;
  location: string;
  createdAt: string;
  schedule: {
    type: string;  // 'one-time' | 'recurring'
    startDate?: string;
    endDate?: string;
    days?: string[];
    frequency?: string;
    time?: string;
    timeRanges?: {[key: string]: string};
  };
  skills: string[];
  budget: {
    type: string;
    minAmount?: number;
    maxAmount?: number;
    amount?: number;
    rate?: string;  // 'hourly' | 'fixed' | 'monthly'
  };
  status: JobStatus;
  homeownerId: string;
  homeownerName: string;
  homeownerImage?: string;
  applicants: JobApplicant[];
}

interface FilterState {
  searchTerm: string;
  location: string;
  budgetMax: number;
  scheduleType: string;
  skills: string;
}

// Job Post Details Modal Component
interface JobPostDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPost | null;
  onApply: (job: JobPost) => void;
  getProfileImageUrl: (path?: string) => string;
  hasApplied: (jobId: string) => boolean;
  getApplicationStatus: (jobId: string) => string;
}

const JobPostDetailsModal: React.FC<JobPostDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  job, 
  onApply,
  getProfileImageUrl,
  hasApplied,
  getApplicationStatus
}) => {
  if (!isOpen || !job) return null;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric' 
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl animate-fadeIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 pr-2">
              {job.title}
            </h2>
            <button 
              onClick={onClose}
              className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-150"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center mt-2 sm:mt-3">
            {job.homeownerImage ? (
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-2 sm:mr-3 border border-[#133E87]">
                <img 
                  src={getProfileImageUrl(job.homeownerImage)} 
                  alt={job.homeownerName || 'Homeowner'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                        <svg class="w-3 h-3 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </svg>
                      </div>
                    `;
                  }}
                />
              </div>
            ) : (
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-2 sm:mr-3 flex items-center justify-center text-gray-600">
                <FaUser className="text-sm sm:text-lg" />
              </div>
            )}
            <div>
              <span className="text-gray-500 text-[10px] xs:text-xs sm:text-sm">Posted by</span>
              <p className="font-medium text-gray-800 text-xs sm:text-base">{job.homeownerName || 'Homeowner'}</p>
            </div>
          </div>
        </div>
        
        {/* Modal Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* Top row - Budget, Location, Posted date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
            <div className="bg-gray-50 p-2 sm:p-4 rounded-lg flex items-start">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <FaMoneyBillWave className="text-green-600 text-xs sm:text-base" />
              </div>
              <div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500">Budget</p>
                <p className="font-semibold text-gray-800 text-xs sm:text-base">{job.budget ? 
                  (job.budget.type === 'fixed' && job.budget.amount ? 
                    new Intl.NumberFormat('en-PH', {
                      style: 'currency', 
                      currency: 'PHP',
                      minimumFractionDigits: 0
                    }).format(job.budget.amount) 
                    : 'Negotiable') 
                  : 'Not specified'}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-2 sm:p-4 rounded-lg flex items-start">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <FaMapMarkerAlt className="text-blue-600 text-xs sm:text-base" />
              </div>
              <div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500">Location</p>
                <p className="font-semibold text-gray-800 text-xs sm:text-base">{job.location || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-2 sm:p-4 rounded-lg flex items-start">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <FaCalendar className="text-purple-600 text-xs sm:text-base" />
              </div>
              <div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500">Posted On</p>
                <p className="font-semibold text-gray-800 text-xs sm:text-base">{formatDate(job.createdAt || '')}</p>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-3 sm:mb-6">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1.5 sm:mb-3 flex items-center">
              <FaInfoCircle className="mr-1.5 sm:mr-2 text-[#133E87]" size={14} />
              Job Description
            </h3>
            <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-line text-xs sm:text-sm">
                {job.description || 'No description provided.'}
              </p>
            </div>
          </div>
          
          {/* Two column layout for Schedule and Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-6">
            {/* Schedule */}
            <div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1.5 sm:mb-3 flex items-center">
                <FaClock className="mr-1.5 sm:mr-2 text-[#133E87]" size={14} />
                Schedule
              </h3>
              <div className="bg-gray-50 p-2 sm:p-4 rounded-lg h-full">
                {job.schedule?.type === 'one-time' ? (
                  <div className="text-xs sm:text-sm">
                    <p className="font-medium text-gray-700">One-time job</p>
                    <p className="text-gray-600 mt-1">Date: {formatDate(job.schedule?.startDate || '')}</p>
                    {job.schedule?.time && <p className="text-gray-600">Time: {job.schedule.time}</p>}
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm">
                    <p className="font-medium text-gray-700">Recurring {job.schedule?.frequency || 'weekly'} job</p>
                    {job.schedule?.days && job.schedule.days.length > 0 && (
                      <p className="text-gray-600 mt-1">Days: {job.schedule.days.join(', ')}</p>
                    )}
                    {job.schedule?.time && <p className="text-gray-600">Time: {job.schedule.time}</p>}
                    {job.schedule?.startDate && <p className="text-gray-600">Starting: {formatDate(job.schedule.startDate)}</p>}
                  </div>
                )}
              </div>
            </div>
            
            {/* Skills */}
            <div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1.5 sm:mb-3 flex items-center">
                <FaTag className="mr-1.5 sm:mr-2 text-[#133E87]" size={14} />
                Required Skills
              </h3>
              <div className="bg-gray-50 p-2 sm:p-4 rounded-lg min-h-[80px] sm:min-h-[100px] h-full">
                {job.skills && job.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {job.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-white text-gray-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center text-[10px] xs:text-xs sm:text-sm"
                      >
                        <FaTag className="mr-1 sm:mr-1.5 text-gray-500" size={9} />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm">No specific skills required</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-2 sm:space-x-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-150 font-medium text-xs sm:text-sm"
          >
            Close
          </button>
          
          {hasApplied(job.id) ? (
            <div className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg text-xs sm:text-sm font-medium ${
              getApplicationStatus(job.id) === 'accepted'
                ? 'bg-green-100 text-green-800'
                : getApplicationStatus(job.id) === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {getApplicationStatus(job.id) === 'accepted' && <FaCheck className="mr-1.5 sm:mr-2 inline-block" />}
              {getApplicationStatus(job.id) === 'rejected' && <FaTimes className="mr-1.5 sm:mr-2 inline-block" />}
              {getApplicationStatus(job.id) === 'pending' && <FaHourglassHalf className="mr-1.5 sm:mr-2 inline-block" />}
              Application {getApplicationStatus(job.id)}
            </div>
          ) : (
            <button
              onClick={() => onApply(job)}
              className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-[#133E87] text-white rounded-lg hover:bg-[#0f2f66] transition-all duration-150 shadow-sm hover:shadow-md font-medium text-xs sm:text-sm"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const JobApplications: React.FC = () => {
  useDocumentTitle('Job Applications');
  const navigate = useNavigate();
  
  // State for jobs, filtering, searching
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'applied' | 'not-applied'>('all');
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [myApplications, setMyApplications] = useState<{[key: string]: JobApplicant}>({});
  const [user, setUser] = useState<any>(null);
  
  // Advanced filters
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    location: '',
    budgetMax: 20000,
    scheduleType: '',
    skills: ''
  });
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/profile`,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        setUser(response.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        toast.error('Failed to load user data');
      }
    };
    
    fetchUserData();
  }, []);
  
  // Helper function to get the full profile image URL
  const getProfileImageUrl = (imagePath: string | undefined): string => {
    const defaultImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
    if (!imagePath) {
      return defaultImage;
    }
    
    // Check if the URL is already absolute (starts with http or https)
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Assuming imagePath is like '/uploads/profile_pictures/...'
    const apiBaseUrl = 'http://localhost:8080';
    // Ensure no double slashes
    const fullUrl = `${apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    console.log("Constructed Profile Image URL:", fullUrl); // Log for debugging
    return fullUrl;
  };
  
  // Debug function to manually check API
  const debugCheckApi = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("No authentication token found");
        return;
      }
      
      toast.loading("Checking API...");
      
      // Check job posts API
      const jobsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/job-posts`, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("DEBUG - Job posts API response:", jobsResponse);
      
      // Check applications API
      const applicationsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/job-posts/my-applications`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("DEBUG - My applications API response:", applicationsResponse);
      
      toast.dismiss();
      toast.success(`Found ${jobsResponse.data?.posts?.length || 0} jobs`);
    } catch (err) {
      console.error("DEBUG API check error:", err);
      toast.dismiss();
      toast.error("API check failed, see console for details");
    }
  };
  
  // Fetch job posts and my applications
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Fetch available job posts
        const jobsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/job-posts`, 
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        console.log("Full job posts API response:", jobsResponse);
        
        // Check if we have valid data in the expected format
        if (jobsResponse.data && jobsResponse.data.posts) {
          const jobsData = jobsResponse.data.posts || [];
          console.log("Fetched job posts:", jobsData);
          
          if (jobsData.length === 0) {
            console.log("No job posts returned from API");
          }
          
          setJobs(jobsData);
        } else {
          console.warn("Unexpected API response format:", jobsResponse.data);
          // Try to extract jobs from response if it has a different structure
          const jobsData = Array.isArray(jobsResponse.data) ? jobsResponse.data : [];
          console.log("Attempting to use alternative data structure:", jobsData);
          setJobs(jobsData);
        }
        
        // Fetch my applications
        await fetchApplications();
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load job posts and applications');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Reset all filters to default values
  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      location: '',
      budgetMax: 20000,
      scheduleType: '',
      skills: ''
    });
    setActiveFilter('all');
  };
  
  // Filter jobs based on all filters
  useEffect(() => {
    let filtered = [...jobs];
    console.log("Starting filter with", filtered.length, "jobs");
    
    // Apply search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term)
      );
      console.log("After search term filter:", filtered.length, "jobs remaining");
    }
    
    // Apply location filter
    if (filters.location) {
      const locationTerm = filters.location.toLowerCase();
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(locationTerm)
      );
      console.log("After location filter:", filtered.length, "jobs remaining");
    }
    
    // Apply budget filter - with safety checks
    filtered = filtered.filter(job => {
      // Skip budget check if job doesn't have proper budget data
      if (!job.budget) return true;
      
      if (job.budget.type === 'fixed' && job.budget.amount) {
        return job.budget.amount <= filters.budgetMax;
      }
      if (job.budget.type === 'range' && job.budget.maxAmount) {
        return job.budget.maxAmount <= filters.budgetMax;
      }
      return true; // If budget structure doesn't match expected format, include it
    });
    console.log("After budget filter:", filtered.length, "jobs remaining");
    
    // Apply schedule type filter
    if (filters.scheduleType) {
      filtered = filtered.filter(job => 
        job.schedule && job.schedule.type === filters.scheduleType
      );
      console.log("After schedule type filter:", filtered.length, "jobs remaining");
    }
    
    // Apply skills filter
    if (filters.skills) {
      const skillsTerms = filters.skills.toLowerCase().split(',').map(s => s.trim());
      filtered = filtered.filter(job => 
        job.skills && job.skills.some(skill => 
          skillsTerms.some(term => skill.toLowerCase().includes(term))
        )
      );
      console.log("After skills filter:", filtered.length, "jobs remaining");
    }
    
    // Apply application status filter
    if (activeFilter === 'applied') {
      filtered = filtered.filter(job => myApplications[job.id]);
      console.log("After 'applied' filter:", filtered.length, "jobs remaining");
    } else if (activeFilter === 'not-applied') {
      filtered = filtered.filter(job => !myApplications[job.id]);
      console.log("After 'not-applied' filter:", filtered.length, "jobs remaining");
    }
    
    setFilteredJobs(filtered);
  }, [jobs, filters, activeFilter, myApplications]);
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      [name]: name === 'budgetMax' ? Number(value) : value
    }));
  };
  
  const handleApplyToJob = (job: JobPost) => {
    // Check if housekeeper is verified
    const isVerified = user?.isVerified || user?.verificationStatus === 'approved' || user?.verificationStatus === 'verified';
    
    if (!isVerified) {
      toast.error('Your account needs to be verified by an administrator before you can apply to jobs');
      return;
    }
    
    setSelectedJob(job);
    setShowApplicationModal(true);
  };
  
  const handleApplicationSuccess = () => {
    // Refresh applications data
    fetchApplications();
  };
  
  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Fetch my applications
      const applicationsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/job-posts/my-applications`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Full my applications API response:", applicationsResponse);
      
      // Create a map of job ID to application for easy lookup
      const applicationsMap: {[key: string]: JobApplicant} = {};
      
      // Handle different possible response structures
      if (applicationsResponse.data && applicationsResponse.data.applications) {
        applicationsResponse.data.applications.forEach((app: any) => {
          if (app && app.jobId && app.application) {
            applicationsMap[app.jobId] = {
              id: app.application.id,
              userId: app.userId || '',
              name: 'You',
              rate: app.application.proposedRate,
              status: app.application.status,
              dateApplied: app.application.dateApplied,
              message: app.application.message,
              experience: app.application.experienceSummary || '',
              availableDays: app.application.availableDays || {},
              startDate: app.application.startDate,
              experienceSummary: app.application.experienceSummary || ''
            };
          }
        });
      } else if (Array.isArray(applicationsResponse.data)) {
        // Try an alternative structure if the data is just an array
        applicationsResponse.data.forEach((app: any) => {
          if (app && app.jobId) {
            applicationsMap[app.jobId] = {
              id: app.id || '',
              userId: app.userId || '',
              name: 'You',
              rate: app.proposedRate || 0,
              status: app.status || 'pending',
              dateApplied: app.dateApplied || new Date().toISOString(),
              message: app.message || '',
              experience: app.experienceSummary || '',
              availableDays: app.availableDays || {},
              startDate: app.startDate,
              experienceSummary: app.experienceSummary || ''
            };
          }
        });
      }
      
      console.log("Created applications map:", applicationsMap);
      setMyApplications(applicationsMap);
    } catch (err) {
      console.error('Error fetching applications:', err);
      toast.error('Failed to load applications');
    }
  };
  
  const hasApplied = (jobId: string) => {
    return !!myApplications[jobId];
  };
  
  const getApplicationStatus = (jobId: string) => {
    return myApplications[jobId]?.status || 'pending';
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric' 
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const renderBudget = (budget: JobPost['budget']) => {
    if (!budget) return 'Not specified';
    
    try {
      if (budget.type === 'fixed' && budget.amount) {
        return `${formatCurrency(budget.amount)} / ${budget.rate === 'monthly' ? 'month' : budget.rate === 'hourly' ? 'hour' : 'job'}`;
      } else if (budget.type === 'range' && budget.minAmount && budget.maxAmount) {
        return `${formatCurrency(budget.minAmount)} - ${formatCurrency(budget.maxAmount)} / ${budget.rate === 'monthly' ? 'month' : budget.rate === 'hourly' ? 'hour' : 'job'}`;
      }
    } catch (err) {
      console.error("Error formatting budget:", err);
    }
    
    return 'Not specified';
  };
  
  const renderSchedule = (schedule: JobPost['schedule']) => {
    if (!schedule) return 'Not specified';
    
    try {
      if (schedule.type === 'one-time') {
        return (
          <div>
            <p className="text-gray-700 font-medium">One-time job</p>
            <p className="text-gray-600">{formatDate(schedule.startDate || '')}</p>
            {schedule.time && <p className="text-gray-600">{schedule.time}</p>}
          </div>
        );
      } else { // recurring
        return (
          <div>
            <p className="text-gray-700 font-medium">Recurring {schedule.frequency || 'weekly'} job</p>
            {schedule.days && schedule.days.length > 0 && (
              <p className="text-gray-600">Days: {schedule.days.join(', ')}</p>
            )}
            {schedule.time && <p className="text-gray-600">Time: {schedule.time}</p>}
            {schedule.startDate && <p className="text-gray-600">Starting: {formatDate(schedule.startDate)}</p>}
          </div>
        );
      }
    } catch (err) {
      console.error("Error rendering schedule:", err);
      return <div className="text-gray-600">Schedule details not available</div>;
    }
  };
  
  const handleMessage = (homeownerName: string, homeownerId: string) => {
    // Navigate to messages page and pass the homeowner ID as a parameter
    navigate(`/housekeeper/messages?customerId=${homeownerId}`);
    
    // Log to help debugging
    console.log(`Navigating to messages with homeowner: ${homeownerName}, ID: ${homeownerId}`);
  };
  
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Job Applications</h1>
          <p className="text-xs sm:text-sm text-gray-600">Find and apply to jobs posted by homeowners</p>
        </div>
        
        {/* Debug button - only visible in development */}
        {import.meta.env.DEV && (
          <button 
            onClick={debugCheckApi}
            className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs sm:text-sm hover:bg-gray-200"
          >
            Check API
          </button>
        )}
      </div>
      
      {/* Verification Status Banner */}
      {user && !user.isVerified && user.verificationStatus !== 'approved' && user.verificationStatus !== 'verified' && (
        <div className="mb-4 sm:mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm text-yellow-700">
                Your account needs to be verified by an administrator before you can apply to jobs. 
                Current status: <span className="font-medium capitalize">{user.verificationStatus}</span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Application status filter buttons */}
      <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 ${
            activeFilter === 'all' 
              ? 'bg-[#133E87] text-white shadow-md' 
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Jobs
        </button>
        <button
          onClick={() => setActiveFilter('applied')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 ${
            activeFilter === 'applied' 
              ? 'bg-[#133E87] text-white shadow-md' 
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Applied
        </button>
        <button
          onClick={() => setActiveFilter('not-applied')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 ${
            activeFilter === 'not-applied' 
              ? 'bg-[#133E87] text-white shadow-md' 
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Not Applied
        </button>
      </div>
      
      {/* Layout with main content and sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Main content - job listings */}
        <div className="lg:w-3/4 order-2 lg:order-1">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-white/90 rounded-xl shadow-sm">
              <div className="w-12 sm:w-16 h-12 sm:h-16 relative">
                <div className="absolute inset-0 rounded-full border-4 border-t-[#133E87] border-r-[#133E87]/30 border-b-[#133E87]/10 border-l-[#133E87]/50 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaSpinner className="text-[#133E87] text-xl sm:text-2xl animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 mt-4 font-medium text-sm sm:text-base">Loading available jobs...</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">This may take a moment</p>
            </div>
          )}
          
          {/* No jobs found */}
          {!loading && filteredJobs.length === 0 && (
            <div className="bg-white/95 rounded-xl shadow-md p-6 sm:p-10 text-center backdrop-blur-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center rounded-full bg-gray-100/80">
                <FaInfoCircle className="text-2xl sm:text-3xl text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                {jobs.length === 0 
                  ? "No job posts available" 
                  : "No matches found"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                {jobs.length === 0 
                  ? "There are currently no job posts available. Please check back later for new opportunities." 
                  : "We couldn't find any job posts matching your current filters. Try adjusting your search criteria."}
              </p>
              {jobs.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="bg-[#133E87] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#0f2f66] transition-all duration-150 shadow-sm hover:shadow flex items-center justify-center mx-auto text-xs sm:text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Reset All Filters
                </button>
              )}
            </div>
          )}
          
          {/* Job listings - two cards per row */}
          {!loading && filteredJobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {filteredJobs.map(job => (
                <div 
                  key={job.id} 
                  className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px] group"
                >
                  <div className="p-3 sm:p-4 md:p-6">
                    {/* Top Section: Title, Budget, Location */}
                    <div className="flex flex-col gap-2">
                      {/* Budget Tag */}
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-1 sm:gap-2">
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 group-hover:text-[#133E87] transition-colors">{job.title || 'Untitled Job'}</h2>
                        <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-50 text-green-700 rounded-full text-[10px] xs:text-xs sm:text-sm font-medium">
                          <FaMoneyBillWave className="mr-1 sm:mr-2" size={12} /> 
                          <span>{renderBudget(job.budget)}</span>
                        </div>
                      </div>
                      
                      {/* Location and Posted Date */}
                      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center text-[10px] xs:text-xs sm:text-sm text-gray-500 gap-0.5 xs:gap-0">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="mr-1 sm:mr-1.5 text-[#133E87]" size={10} /> 
                          <span>{job.location || 'Location not specified'}</span>
                        </div>
                        <div className="flex items-center">
                          <FaCalendar className="mr-1 sm:mr-1.5" size={9} /> 
                          <span>Posted {formatDate(job.createdAt || '')}</span>
                        </div>
                      </div>
                      
                      {/* Posted by */}
                      <div className="flex items-center mt-1 sm:mt-2 pb-2 sm:pb-3 border-b border-gray-100">
                        {job.homeownerImage ? (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-1.5 sm:mr-2 border border-[#133E87]">
                            <img 
                              src={getProfileImageUrl(job.homeownerImage)} 
                              alt={job.homeownerName || 'Homeowner'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log("Image failed to load:", job.homeownerImage);
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                                    <svg class="w-3 h-3 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                                    </svg>
                                  </div>
                                `;
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mr-1.5 sm:mr-2 flex items-center justify-center text-gray-600">
                            <FaUser className="text-xs sm:text-sm" />
                          </div>
                        )}
                        <div className="text-xs sm:text-sm">
                          <span className="text-gray-500">Posted by </span>
                          <span className="font-medium text-gray-700">{job.homeownerName || 'Homeowner'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mid Section: Description and Skills */}
                    <div className="mt-2 sm:mt-3 mb-2 sm:mb-4">
                      <p className="text-gray-600 mb-1.5 sm:mb-2 line-clamp-2 text-xs sm:text-sm">{job.description || 'No description provided'}</p>
                      
                      {/* Skills */}
                      <div className="flex flex-wrap gap-1">
                        {job.skills && job.skills.length > 0 ? (
                          job.skills.map((skill, index) => (
                            <span 
                              key={index}
                              className="bg-gray-50 text-gray-700 text-[10px] xs:text-xs px-1 sm:px-1.5 py-0.5 rounded-full flex items-center"
                            >
                              <FaTag className="mr-0.5 text-gray-500" size={7} />
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-[10px] xs:text-xs">No specific skills required</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Schedule Section */}
                    <div className="mb-3 sm:mb-5 bg-gray-50 rounded-lg p-1.5 sm:p-2 md:p-3">
                      <h3 className="font-medium text-gray-800 mb-0.5 sm:mb-1 text-[10px] xs:text-xs sm:text-sm flex items-center">
                        <FaClock className="mr-1 sm:mr-1.5 text-[#133E87]" size={10} />
                        Schedule
                      </h3>
                      <div className="text-[10px] xs:text-xs text-gray-600">
                        {renderSchedule(job.schedule)}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 mt-2 sm:mt-4">
                      {hasApplied(job.id) ? (
                        <div className={`col-span-full text-center px-2 py-1.5 sm:py-2 rounded-lg text-[10px] xs:text-xs sm:text-sm font-medium shadow-sm ${
                          getApplicationStatus(job.id) === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : getApplicationStatus(job.id) === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getApplicationStatus(job.id) === 'accepted' && <FaCheck className="mr-1 sm:mr-2 inline-block" />}
                          {getApplicationStatus(job.id) === 'rejected' && <FaTimes className="mr-1 sm:mr-2 inline-block" />}
                          {getApplicationStatus(job.id) === 'pending' && <FaHourglassHalf className="mr-1 sm:mr-2 inline-block" />}
                          Application {getApplicationStatus(job.id)}
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApplyToJob(job)}
                            className="bg-[#133E87] hover:bg-[#0f2f66] text-white px-1.5 sm:px-2 md:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-150 shadow-sm hover:shadow text-[10px] xs:text-xs sm:text-sm font-medium flex items-center justify-center"
                          >
                            Apply Now
                          </button>
                          
                          <button
                            className="px-1.5 sm:px-2 md:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[10px] xs:text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-center"
                            onClick={() => {
                              setSelectedJob(job);
                              setShowJobDetailsModal(true);
                            }}
                          >
                            <FaInfoCircle className="mr-1 sm:mr-2" size={10} />
                            Details
                          </button>
                          
                          <button
                            className="px-1.5 sm:px-2 md:px-4 py-1.5 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] xs:text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-center"
                            onClick={() => handleMessage(job.homeownerName, job.homeownerId)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                            Message
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Right sidebar - Filters */}
        <div className="lg:w-1/4 order-1 lg:order-2 mb-4 sm:mb-6 lg:mb-0">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 sticky top-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center">
                <FaFilter className="text-[#133E87] mr-1.5 sm:mr-2" size={12} />
                <h2 className="text-sm sm:text-base font-semibold text-gray-800">Filters</h2>
              </div>
              
              <button 
                onClick={resetFilters}
                className="text-xs sm:text-sm text-[#133E87] hover:underline font-medium"
              >
                Reset
              </button>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {/* Search Term */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" size={10} />
                  </div>
                  <input
                    type="text"
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                    placeholder="Job title or description"
                    className="block w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all duration-150 bg-white/80 text-xs"
                  />
                </div>
              </div>
              
              {/* Location filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="e.g., Makati, Quezon City"
                  className="block w-full px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all duration-150 bg-white/80 text-xs"
                />
              </div>
              
              {/* Schedule type filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Type</label>
                <select
                  name="scheduleType"
                  value={filters.scheduleType}
                  onChange={handleFilterChange}
                  className="block w-full px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all duration-150 bg-white/80 text-xs"
                >
                  <option value="">All Types</option>
                  <option value="one-time">One-time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              
              {/* Skills filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Skills</label>
                <input
                  type="text"
                  name="skills"
                  value={filters.skills}
                  onChange={handleFilterChange}
                  placeholder="e.g., Cleaning, Cooking"
                  className="block w-full px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all duration-150 bg-white/80 text-xs"
                />
              </div>
              
              {/* Budget range slider */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Budget (₱{filters.budgetMax.toLocaleString()})</label>
                <input
                  type="range"
                  name="budgetMax"
                  min="1000"
                  max="20000"
                  step="500"
                  value={filters.budgetMax}
                  onChange={handleFilterChange}
                  className="w-full accent-[#133E87]"
                />
                <div className="flex justify-between text-[10px] xs:text-xs text-gray-500 mt-1">
                  <span>₱1,000</span>
                  <span>₱20,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Job Application Modal */}
      <JobApplicationModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        job={selectedJob}
        onSuccess={handleApplicationSuccess}
      />
      
      {/* Job Details Modal */}
      <JobPostDetailsModal
        isOpen={showJobDetailsModal}
        onClose={() => setShowJobDetailsModal(false)}
        job={selectedJob}
        onApply={(job) => {
          setShowJobDetailsModal(false);
          handleApplyToJob(job);
        }}
        getProfileImageUrl={getProfileImageUrl}
        hasApplied={hasApplied}
        getApplicationStatus={getApplicationStatus}
      />

      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
        `}
      </style>
    </div>
  );
};

export default JobApplications;
