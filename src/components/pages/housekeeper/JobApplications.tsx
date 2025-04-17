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
  
  // Fetch job posts
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        // In a real app, this would make an API call
        // const response = await axios.get('/api/jobs');
        // const jobPosts = response.data;
        
        // For development, using mock data
        setTimeout(() => {
          const mockJobs: JobPost[] = [
            {
              id: 'job1',
              title: 'House Cleaning Assistant Needed',
              description: 'Looking for someone to help with regular house cleaning twice a week. Duties include vacuuming, dusting, mopping floors, and general tidying up.',
              location: 'Makati City',
              createdAt: '2023-09-15T08:00:00Z',
              schedule: {
                type: 'recurring',
                days: ['Monday', 'Thursday'],
                frequency: 'weekly',
                time: '09:00-12:00'
              },
              skills: ['Cleaning', 'Organizing', 'Attention to Detail'],
              budget: {
                type: 'range',
                minAmount: 300,
                maxAmount: 500,
                rate: 'hourly'
              },
              status: 'active',
              homeownerId: 'owner1',
              homeownerName: 'Maria Santos',
              homeownerImage: '',
              applicants: [
                {
                  id: 'app1',
                  name: 'Juan Dela Cruz',
                  rate: 350,
                  experience: '3 years',
                  status: 'pending',
                  dateApplied: '2023-09-16T10:30:00Z',
                  message: 'I have extensive experience in home cleaning and am available on the days you need.',
                  userId: 'user123',
                  userImage: ''
                }
              ]
            },
            {
              id: 'job2',
              title: 'Post-Renovation Deep Cleaning',
              description: 'We just finished our home renovation and need someone to do a thorough deep cleaning of the entire house. Approximately 150 sq.m. home with 3 bedrooms and 2 bathrooms.',
              location: 'Quezon City',
              createdAt: '2023-09-17T14:30:00Z',
              schedule: {
                type: 'one-time',
                startDate: '2023-10-01',
                time: '08:00-17:00'
              },
              skills: ['Deep Cleaning', 'Construction Cleanup', 'Window Cleaning'],
              budget: {
                type: 'fixed',
                amount: 3500,
                rate: 'fixed'
              },
              status: 'active',
              homeownerId: 'owner2',
              homeownerName: 'Roberto Reyes',
              homeownerImage: '',
              applicants: []
            },
            {
              id: 'job3',
              title: 'Daily Caretaker for Elderly Parent',
              description: 'Looking for a caretaker for my 75-year-old mother who needs assistance with daily tasks, medication reminders, and occasional companionship to doctor appointments.',
              location: 'Pasig City',
              createdAt: '2023-09-16T09:15:00Z',
              schedule: {
                type: 'recurring',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                frequency: 'weekly',
                time: '08:00-17:00'
              },
              skills: ['Elderly Care', 'Basic Cooking', 'Medication Management'],
              budget: {
                type: 'fixed',
                amount: 25000,
                rate: 'monthly'
              },
              status: 'active',
              homeownerId: 'owner3',
              homeownerName: 'Ana Lopez',
              homeownerImage: '',
              applicants: []
            },
            {
              id: 'job4',
              title: 'Bi-Weekly House Cleaning',
              description: 'Need professional house cleaning every other week. 2-bedroom condo unit with kitchen and 1 bathroom.',
              location: 'Taguig City',
              createdAt: '2023-09-14T11:00:00Z',
              schedule: {
                type: 'recurring',
                days: ['Saturday'],
                frequency: 'bi-weekly',
                time: '13:00-16:00'
              },
              skills: ['Cleaning', 'Laundry'],
              budget: {
                type: 'fixed',
                amount: 1200,
                rate: 'fixed'
              },
              status: 'active',
              homeownerId: 'owner4',
              homeownerName: 'Carlos Tan',
              homeownerImage: '',
              applicants: []
            },
            {
              id: 'job5',
              title: 'Garden Maintenance',
              description: 'Looking for someone to maintain our small garden. Tasks include watering plants, trimming, weeding, and basic landscaping.',
              location: 'Paranaque City',
              createdAt: '2023-09-13T16:45:00Z',
              schedule: {
                type: 'recurring',
                days: ['Tuesday', 'Friday'],
                frequency: 'weekly',
                time: '07:00-09:00'
              },
              skills: ['Gardening', 'Landscaping', 'Plant Care'],
              budget: {
                type: 'range',
                minAmount: 200,
                maxAmount: 300,
                rate: 'hourly'
              },
              status: 'active',
              homeownerId: 'owner5',
              homeownerName: 'Elena Garcia',
              homeownerImage: '',
              applicants: []
            }
          ];
          
          // Simulate my applications
          const myId = 'myUserId'; // In a real app, this would be the current user's ID
          const myMockApplications: {[key: string]: JobApplicant} = {
            'job3': {
              id: 'myApp1',
              name: 'My Name',
              rate: 600,
              experience: '2 years',
              status: 'pending',
              dateApplied: '2023-09-17T10:00:00Z',
              message: 'I have experience taking care of elderly people and can provide references.',
              userId: myId,
              userImage: ''
            },
            'job5': {
              id: 'myApp2',
              name: 'My Name',
              rate: 250,
              experience: '1 year',
              status: 'rejected',
              dateApplied: '2023-09-14T09:30:00Z',
              message: 'I have gardening experience and am available on the required days.',
              userId: myId,
              userImage: ''
            }
          };
          
          // Add my applications to the jobs
          for (const jobId in myMockApplications) {
            const jobIndex = mockJobs.findIndex(job => job.id === jobId);
            if (jobIndex >= 0) {
              mockJobs[jobIndex].applicants.push(myMockApplications[jobId]);
            }
          }
          
          setJobs(mockJobs);
          setFilteredJobs(mockJobs);
          setMyApplications(myMockApplications);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Failed to load job listings');
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, []);
  
  // Filter jobs based on search term and active filter
  useEffect(() => {
    let filtered = [...jobs];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.skills.some(skill => skill.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (activeFilter === 'applied') {
      filtered = filtered.filter(job => myApplications[job.id]);
    } else if (activeFilter === 'not-applied') {
      filtered = filtered.filter(job => !myApplications[job.id]);
    }
    
    setFilteredJobs(filtered);
  }, [searchTerm, activeFilter, jobs, myApplications]);
  
  // Handle job application
  const handleApplyToJob = (job: JobPost) => {
    setSelectedJob(job);
    setApplicationMessage('');
    setApplicationRate('');
    setShowApplyModal(true);
  };
  
  // Submit job application
  const submitApplication = async () => {
    if (!selectedJob) return;
    if (!applicationMessage.trim()) {
      toast.error('Please provide a message to the homeowner');
      return;
    }
    if (!applicationRate.trim() || isNaN(Number(applicationRate)) || Number(applicationRate) <= 0) {
      toast.error('Please provide a valid rate');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // In a real app, this would make an API call
      // await axios.post('/api/jobs/apply', {
      //   jobId: selectedJob.id,
      //   message: applicationMessage,
      //   rate: Number(applicationRate)
      // });
      
      // Simulate successful application
      setTimeout(() => {
        // Create a new application
        const newApplication: JobApplicant = {
          id: `app-${Date.now()}`,
          name: 'My Name', // Would be current user's name
          rate: Number(applicationRate),
          experience: '2 years', // Would come from user profile
          status: 'pending',
          dateApplied: new Date().toISOString(),
          message: applicationMessage,
          userId: 'myUserId', // Would be current user's ID
          userImage: '' // Would be current user's image
        };
        
        // Update local state
        // Add application to job
        setJobs(jobs.map(job => {
          if (job.id === selectedJob.id) {
            return {
              ...job,
              applicants: [...job.applicants, newApplication]
            };
          }
          return job;
        }));
        
        // Add to my applications
        setMyApplications({
          ...myApplications,
          [selectedJob.id]: newApplication
        });
        
        toast.success('Application submitted successfully!');
        setShowApplyModal(false);
        setSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Check if user has already applied to a job
  const hasApplied = (jobId: string) => {
    return !!myApplications[jobId];
  };
  
  // Get application status
  const getApplicationStatus = (jobId: string) => {
    if (!myApplications[jobId]) return null;
    return myApplications[jobId].status;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Render budget display
  const renderBudget = (budget: JobPost['budget']) => {
    if (budget.type === 'range' && budget.minAmount && budget.maxAmount) {
      return `${formatCurrency(budget.minAmount)} - ${formatCurrency(budget.maxAmount)} ${budget.rate === 'hourly' ? '/hour' : ''}`;
    } else if (budget.type === 'fixed' && budget.amount) {
      if (budget.rate === 'monthly') {
        return `${formatCurrency(budget.amount)}/month`;
      } else if (budget.rate === 'hourly') {
        return `${formatCurrency(budget.amount)}/hour`;
      } else {
        return formatCurrency(budget.amount);
      }
    }
    return 'Not specified';
  };
  
  // Render schedule display
  const renderSchedule = (schedule: JobPost['schedule']) => {
    if (schedule.type === 'one-time' && schedule.startDate) {
      return `One-time on ${formatDate(schedule.startDate)} at ${schedule.time || 'TBD'}`;
    } else if (schedule.type === 'recurring' && schedule.days) {
      return `${schedule.frequency || 'Weekly'} on ${schedule.days.join(', ')} at ${schedule.time || 'TBD'}`;
    }
    return 'Schedule not specified';
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-[#137D13] text-3xl" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Job Applications</h1>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'all' 
                  ? 'bg-[#137D13] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setActiveFilter('applied')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'applied' 
                  ? 'bg-[#137D13] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Applied
            </button>
            <button
              onClick={() => setActiveFilter('not-applied')}
              className={`px-4 py-2 rounded-md ${
                activeFilter === 'not-applied' 
                  ? 'bg-[#137D13] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Applied
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#137D13]"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 text-5xl mx-auto mb-4">📋</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No job listings found</h3>
          <p className="text-gray-500">
            {activeFilter === 'applied' 
              ? "You haven't applied to any jobs yet." 
              : activeFilter === 'not-applied'
                ? "You've applied to all available jobs."
                : "No job listings match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">{job.title}</h2>
                    <p className="text-sm text-gray-600">{job.homeownerName} • Posted {formatDate(job.createdAt)}</p>
                  </div>
                  <div>
                    {hasApplied(job.id) ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        getApplicationStatus(job.id) === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : getApplicationStatus(job.id) === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {getApplicationStatus(job.id) === 'pending' 
                          ? 'Applied - Pending' 
                          : getApplicationStatus(job.id) === 'accepted'
                            ? 'Application Accepted'
                            : 'Application Rejected'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Open
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Location</p>
                      <p className="text-gray-600">{job.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaMoneyBillWave className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Budget</p>
                      <p className="text-gray-600">{renderBudget(job.budget)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start">
                    <FaCalendar className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Schedule</p>
                      <p className="text-gray-600">{renderSchedule(job.schedule)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaClock className="w-4 h-4 mt-1 mr-3 text-[#137D13]" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Applicants</p>
                      <p className="text-gray-600">{job.applicants.length} applicant{job.applicants.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Skills Required</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  {hasApplied(job.id) ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md cursor-not-allowed"
                    >
                      {getApplicationStatus(job.id) === 'pending' 
                        ? 'Application Pending' 
                        : getApplicationStatus(job.id) === 'accepted'
                          ? 'Application Accepted'
                          : 'Application Rejected'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyToJob(job)}
                      className="px-4 py-2 bg-[#137D13] text-white rounded-md hover:bg-[#0f670f] transition-colors"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Apply for Job</h2>
                <button 
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">{selectedJob.title}</h3>
                <p className="text-gray-600 text-sm">{selectedJob.homeownerName} • {selectedJob.location}</p>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Budget: {renderBudget(selectedJob.budget)}</p>
                <p className="text-sm text-gray-600">Schedule: {renderSchedule(selectedJob.schedule)}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Rate (₱)</label>
                <input
                  type="number"
                  value={applicationRate}
                  onChange={(e) => setApplicationRate(e.target.value)}
                  placeholder="Your proposed rate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#137D13]"
                  required
                  min="1"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedJob.budget.rate === 'hourly' 
                    ? 'Enter your hourly rate in Philippine Pesos'
                    : selectedJob.budget.rate === 'monthly'
                      ? 'Enter your monthly rate in Philippine Pesos'
                      : 'Enter your fixed rate for this job in Philippine Pesos'}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message to Homeowner</label>
                <textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a good fit for this job..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#137D13]"
                  required
                  disabled={submitting}
                ></textarea>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={submitApplication}
                  className="px-4 py-2 bg-[#137D13] text-white rounded-md hover:bg-[#0f670f] transition-colors flex items-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplications;
