import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaFilter, FaCalendar, FaMapMarkerAlt, FaMoneyBillWave, FaClock, FaHourglassHalf, FaCheck, FaTimes, FaBan } from 'react-icons/fa';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import axios from 'axios';

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

const JobApplications: React.FC = () => {
  useDocumentTitle('Job Applications');
  
  // State for jobs, filtering, searching
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'applied' | 'not-applied'>('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applicationRate, setApplicationRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myApplications, setMyApplications] = useState<{[key: string]: JobApplicant}>({});
  
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
          `${import.meta.env.VITE_API_URL}/api/job-posts`, 
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        const jobsData = jobsResponse.data.posts || [];
        setJobs(jobsData);
        
        // Fetch my applications
        const applicationsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/job-posts/my-applications`,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        // Create a map of job ID to application for easy lookup
        const applicationsMap: {[key: string]: JobApplicant} = {};
        applicationsResponse.data.applications.forEach((app: any) => {
          applicationsMap[app.jobId] = {
            id: app.application.id,
            userId: app.userId || '',
            name: 'You',
            rate: app.application.proposedRate,
            status: app.application.status,
            dateApplied: app.application.dateApplied,
            message: app.application.message,
            experience: ''
          };
        });
        
        setMyApplications(applicationsMap);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load job posts and applications');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter jobs based on search term and active filter
  useEffect(() => {
    let filtered = jobs;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        (job.skills && job.skills.some(skill => skill.toLowerCase().includes(term)))
      );
    }
    
    // Apply application status filter
    if (activeFilter === 'applied') {
      filtered = filtered.filter(job => myApplications[job.id]);
    } else if (activeFilter === 'not-applied') {
      filtered = filtered.filter(job => !myApplications[job.id]);
    }
    
    setFilteredJobs(filtered);
  }, [jobs, searchTerm, activeFilter, myApplications]);
  
  const handleApplyToJob = (job: JobPost) => {
    setSelectedJob(job);
    setApplicationMessage('');
    setApplicationRate('');
    setShowApplyModal(true);
  };
  
  const submitApplication = async () => {
    if (!selectedJob) return;
    
    if (!applicationMessage.trim()) {
      toast.error('Please provide a message to the homeowner');
      return;
    }
    
    if (!applicationRate.trim() || isNaN(parseFloat(applicationRate))) {
      toast.error('Please provide a valid rate');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/job-posts/${selectedJob.id}/apply`,
        {
          message: applicationMessage,
          proposedRate: parseFloat(applicationRate)
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
        
      // Update the local state
      const newApplication = response.data.application;
      setMyApplications(prev => ({
        ...prev,
          [selectedJob.id]: newApplication
      }));
        
        setShowApplyModal(false);
      setSelectedJob(null);
      toast.success('Application submitted successfully');
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
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
    
    if (budget.type === 'fixed' && budget.amount) {
      return `${formatCurrency(budget.amount)} / ${budget.rate === 'monthly' ? 'month' : budget.rate === 'hourly' ? 'hour' : 'job'}`;
    } else if (budget.type === 'range' && budget.minAmount && budget.maxAmount) {
      return `${formatCurrency(budget.minAmount)} - ${formatCurrency(budget.maxAmount)} / ${budget.rate === 'monthly' ? 'month' : budget.rate === 'hourly' ? 'hour' : 'job'}`;
      }
    
    return 'Not specified';
  };
  
  const renderSchedule = (schedule: JobPost['schedule']) => {
    if (!schedule) return 'Not specified';
    
    if (schedule.type === 'one-time') {
      return (
        <div>
          <p className="text-gray-700">One-time job</p>
          <p className="text-gray-600">{formatDate(schedule.startDate || '')}</p>
          {schedule.time && <p className="text-gray-600">{schedule.time}</p>}
        </div>
      );
    } else { // recurring
    return (
        <div>
          <p className="text-gray-700">Recurring {schedule.frequency} job</p>
          {schedule.days && schedule.days.length > 0 && (
            <p className="text-gray-600">Days: {schedule.days.join(', ')}</p>
          )}
          {schedule.time && <p className="text-gray-600">Time: {schedule.time}</p>}
          {schedule.startDate && <p className="text-gray-600">Starting: {formatDate(schedule.startDate)}</p>}
      </div>
    );
  }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Job Applications</h1>
        <p className="text-gray-600">Find and apply to jobs posted by homeowners</p>
      </div>
      
      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs by title, description, or location"
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
            />
          </div>
          
          <div className="w-full md:w-auto flex space-x-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-md flex-1 md:flex-none ${
                activeFilter === 'all' 
                  ? 'bg-[#133E87] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setActiveFilter('applied')}
              className={`px-4 py-2 rounded-md flex-1 md:flex-none ${
                activeFilter === 'applied' 
                  ? 'bg-[#133E87] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Applied
            </button>
            <button
              onClick={() => setActiveFilter('not-applied')}
              className={`px-4 py-2 rounded-md flex-1 md:flex-none ${
                activeFilter === 'not-applied' 
                  ? 'bg-[#133E87] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Applied
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <FaSpinner className="text-[#133E87] text-4xl animate-spin" />
        </div>
      )}
      
      {/* No jobs found */}
      {!loading && filteredJobs.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg mb-4">No job posts found</p>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="text-[#133E87] hover:underline"
            >
              View all available jobs
            </button>
          )}
        </div>
      )}
      
      {/* Job listings */}
      {!loading && filteredJobs.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.map(job => (
            <div 
              key={job.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{job.title}</h2>
                    <div className="flex items-center text-gray-600 mb-2">
                      <FaMapMarkerAlt className="mr-2" /> {job.location}
                    </div>
                    <div className="flex flex-wrap">
                      {job.skills && job.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2 mb-2"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end">
                    <div className="flex items-center text-gray-600 mb-2">
                      <FaMoneyBillWave className="mr-2" /> {renderBudget(job.budget)}
                    </div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <FaCalendar className="mr-2" /> Posted on {formatDate(job.createdAt)}
                    </div>
                    
                    {hasApplied(job.id) ? (
                      <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                        getApplicationStatus(job.id) === 'accepted'
                            ? 'bg-green-100 text-green-800'
                          : getApplicationStatus(job.id) === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getApplicationStatus(job.id) === 'accepted' && <FaCheck className="mr-1" />}
                        {getApplicationStatus(job.id) === 'rejected' && <FaTimes className="mr-1" />}
                        {getApplicationStatus(job.id) === 'pending' && <FaHourglassHalf className="mr-1" />}
                        Application {getApplicationStatus(job.id)}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApplyToJob(job)}
                        className="bg-[#133E87] hover:bg-[#0f2f66] text-white px-4 py-2 rounded-md mt-2"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-800 mb-2">Job Description</h3>
                  <p className="text-gray-600">{job.description}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <h3 className="font-medium text-gray-800 mb-2">Schedule</h3>
                    {renderSchedule(job.schedule)}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Homeowner</h3>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden mr-3">
                        {job.homeownerImage ? (
                          <img 
                            src={job.homeownerImage} 
                            alt={job.homeownerName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-bold">
                            {job.homeownerName.charAt(0)}
                          </div>
                        )}
                      </div>
                    <div>
                        <p className="font-medium text-gray-800">{job.homeownerName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Apply for {selectedJob.title}
                </h2>
                <button 
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="rate" className="block text-gray-700 font-medium mb-2">
                  Your Rate (₱) *
                </label>
                <input
                  type="number"
                  id="rate"
                  value={applicationRate}
                  onChange={(e) => setApplicationRate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                  placeholder="Enter your proposed rate"
                  min="0"
                />
                {selectedJob.budget && (
                  <p className="text-gray-500 text-sm mt-1">
                    Budget: {renderBudget(selectedJob.budget)}
                </p>
                )}
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                  Message to Homeowner *
                </label>
                <textarea
                  id="message"
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                  placeholder="Introduce yourself and explain why you're a good fit for this job..."
                ></textarea>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-4">
                <button
                  onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApplication}
                  disabled={submitting}
                className="px-4 py-2 bg-[#133E87] text-white rounded-md hover:bg-[#0f2f66]"
                >
                  {submitting ? (
                  <div className="flex items-center">
                    <FaSpinner className="animate-spin mr-2" /> Submitting...
                  </div>
                  ) : (
                    'Submit Application'
                  )}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplications;
