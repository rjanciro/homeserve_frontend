import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye, FaEdit, FaPause, FaTrash, FaComments, FaFile, FaSync, FaFilter, FaSort } from 'react-icons/fa';
import { BsPlayFill } from 'react-icons/bs';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CreateJobPostModal from '../../modals/CreateJobPostModal';
import ApplicantsModal from '../../modals/ApplicantsModal';
import useDocumentTitle  from '../../../hooks/useDocumentTitle';

// Define types
type JobStatus = 'active' | 'paused' | 'hired' | 'archived';
type SortOption = 'newest' | 'mostApplicants' | 'soonestStartDate';

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
  idVerificationStatus?: string;
  certificationStatus?: string;
}

interface JobPost {
  id: string;
  title: string;
  description?: string;
  location: string;
  startDate?: string;
  salary?: string;
  status: JobStatus;
  applicants: Applicant[];
  createdAt: Date;
  schedule?: {
    type: string;
    days?: string[];
  };
  budget?: {
    type: string;
    minAmount?: number;
    maxAmount?: number;
    amount?: number;
    rate?: string;
  };
  skills?: string[];
  hiredPerson?: {
    name: string;
    startDate: string;
  };
}

interface CreateJobPostData {
  title: string;
  description: string;
  location: string;
  schedule: {
    type: string;
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
    rate: string;
  };
}

const JobPosts: React.FC = () => {
  useDocumentTitle('Job Posts');

  const [activeFilter, setActiveFilter] = useState<JobStatus>('active');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null);
  const [showApplicants, setShowApplicants] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editJobId, setEditJobId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // Fetch job posts from API
  const fetchJobPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/job-posts/my-posts`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          status: activeFilter
        }
      });

      setJobPosts(response.data.posts.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt)
      })));

      setError('');
    } catch (err) {
      console.error('Error fetching job posts:', err);
      setError('Failed to fetch job posts. Please try again later.');
      toast.error('Failed to load job posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobPosts();
  }, [activeFilter]);

  // Filter and sort job posts
  const filteredAndSortedPosts = jobPosts
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else if (sortBy === 'mostApplicants') {
        return b.applicants.length - a.applicants.length;
      } else { // soonestStartDate
        return new Date(a.startDate || '').getTime() - new Date(b.startDate || '').getTime();
      }
    });

  const handleCreateJobPost = () => {
    setEditJobId(undefined);
    setShowCreateModal(true);
  };

  const handleViewApplicants = (post: JobPost) => {
    setSelectedPost(post);
    setShowApplicants(true);
  };

  const handleEditPost = (postId: string) => {
    setEditJobId(postId);
    setShowCreateModal(true);
  };

  const handlePauseResumePost = async (postId: string, currentStatus: JobStatus) => {
    // Toggle between active and paused
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/job-posts/${postId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update the local state
      setJobPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? {...post, status: newStatus as JobStatus} : post
        )
      );

      toast.success(`Job post ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
    } catch (err) {
      console.error('Error updating job status:', err);
      toast.error('Failed to update job status');
    }
  };

  const handleDeletePost = async (postId: string) => {
    // Confirm before deleting
    if (window.confirm('Are you sure you want to delete this job post?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        await axios.delete(
          `${import.meta.env.VITE_API_URL}/job-posts/${postId}`,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        // Update the local state
        setJobPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        toast.success('Job post deleted successfully');
      } catch (err) {
        console.error('Error deleting job post:', err);
        toast.error('Failed to delete job post');
      }
    }
  };

  const handleHireApplicant = async (jobId: string, applicant: Applicant) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/job-posts/${jobId}/applicants/${applicant.id}/status`,
        { status: 'accepted' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh needed data or update state locally
      fetchJobPosts(); // Re-fetch all posts to reflect hired status
      
      setShowApplicants(false); // Close modal after hiring
      toast.success(`${applicant.name} has been hired!`);
    } catch (err) {
      console.error('Error hiring applicant:', err);
      toast.error('Failed to hire applicant');
    }
  };

  const handleRejectApplicant = async (jobId: string, applicantId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/job-posts/${jobId}/applicants/${applicantId}/status`,
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update local state immediately for responsiveness
      const updatedPosts = jobPosts.map(post => 
        post.id === jobId 
          ? { ...post, applicants: post.applicants.filter(a => a.id !== applicantId) }
          : post
      );
      setJobPosts(updatedPosts);

      // Update selected post if it's the one being viewed
      if (selectedPost && selectedPost.id === jobId) {
        setSelectedPost({
          ...selectedPost,
          applicants: selectedPost.applicants.filter(a => a.id !== applicantId)
        });
      }

      toast.success('Applicant rejected');
      // Keep modal open after rejection if desired, or close with setShowApplicants(false)
    } catch (err) {
      console.error('Error rejecting applicant:', err);
      toast.error('Failed to reject applicant');
    }
  };

  const handleJobPostSuccess = () => {
    fetchJobPosts();
  };

  // Helper function to get status colors
  const getStatusColors = (status: JobStatus) => {
    switch(status) {
      case 'active':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          icon: '🟢'
        };
      case 'paused':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          icon: '🟠'
        };
      case 'hired':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          icon: '🔵'
        };
      case 'archived':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: '⚪'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: '⚪'
        };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Your Job Posts</h1>
        <button 
          onClick={handleCreateJobPost}
          className="bg-[#133E87] text-white px-5 py-2.5 rounded-full flex items-center shadow-md transition-all duration-200 font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <FaPlus className="mr-2 text-white" />
          Create Job Post
        </button>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-5 rounded-2xl bg-white shadow-md border border-gray-100">
        <div className="flex-1">
          <div className="flex items-center text-gray-700 text-sm font-medium mb-2">
            <FaFilter className="mr-2 text-[#133E87]" /> Filter by status
          </div>
          <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-gray-50">
            {(['active', 'paused', 'hired', 'archived'] as JobStatus[]).map((status) => {
              const colors = getStatusColors(status);
              return (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`px-4 py-2 rounded-lg capitalize text-sm transition-all duration-200 flex items-center ${
                    activeFilter === status 
                      ? `${colors.bg} ${colors.text} shadow-sm font-medium transform scale-105` 
                      : 'hover:bg-gray-100 text-gray-600 hover:scale-102'
                  }`}
                >
                  <span className="mr-1.5">{colors.icon}</span>
                  {status}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="sm:w-64">
          <div className="flex items-center text-gray-700 text-sm font-medium mb-2">
            <FaSort className="mr-2 text-[#133E87]" /> Sort by
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#133E87] text-gray-700 appearance-none shadow-sm text-sm font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="mostApplicants">Most Applicants</option>
              <option value="soonestStartDate">Soonest Start Date</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#133E87]/20 border-t-4 border-t-[#133E87]"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading job posts...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl mb-8 shadow-md border border-red-200">
          <div className="flex items-start">
            <div className="p-2 bg-red-100 rounded-full mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-lg">{error}</p>
              <p className="mt-1 text-sm text-red-600">Please try refreshing the page or contact support if the problem persists.</p>
            </div>
          </div>
        </div>
      )}

      {/* Job Posts List */}
      {!loading && !error && filteredAndSortedPosts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
          <div className="w-24 h-24 bg-[#E6EBF4] rounded-full flex items-center justify-center mx-auto mb-6">
            <FaPlus className="text-4xl text-[#133E87]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No {activeFilter} job posts found</h3>
          <p className="text-gray-600 text-lg mb-8 max-w-lg mx-auto">
            Click on "Create Job Post" to post a new job for housekeepers to apply.
          </p>
          {activeFilter !== 'active' && (
            <button
              onClick={() => setActiveFilter('active')}
              className="mt-4 text-white font-medium bg-[#133E87] px-6 py-3 rounded-full transition-colors shadow-md hover:shadow-lg"
            >
              View active job posts
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPosts.map(post => {
            const statusColors = getStatusColors(post.status);
            
            return (
              <div 
                key={post.id} 
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className={`${statusColors.bg} ${statusColors.text} text-xs font-bold uppercase px-3 py-1 rounded-full inline-flex items-center mb-4`}>
                    <span className="mr-1">{statusColors.icon}</span>
                    {post.status}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{post.title}</h3>
                  
                  <div className="space-y-3 mb-5">
                    <div className="flex items-start">
                      <div className="p-1.5 bg-gray-100 rounded-full mr-3 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-700">{post.location}</p>
                    </div>
                    
                    {post.status !== 'hired' && post.startDate && (
                      <div className="flex items-start">
                        <div className="p-1.5 bg-gray-100 rounded-full mr-3 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-700">Start Date: {post.startDate}</p>
                      </div>
                    )}
                    
                    {post.salary && (
                      <div className="flex items-start">
                        <div className="p-1.5 bg-gray-100 rounded-full mr-3 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-700 font-medium">{post.salary}</p>
                      </div>
                    )}
                    
                    {post.status !== 'hired' && post.status !== 'archived' && (
                      <div className="flex items-start">
                        <div className="p-1.5 bg-gray-100 rounded-full mr-3 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div className="flex items-center">
                          <p className="text-gray-700">
                            {post.applicants.length} {post.applicants.length === 1 ? 'Applicant' : 'Applicants'}
                          </p>
                          {post.applicants.length > 0 && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {post.status === 'hired' && post.hiredPerson && (
                    <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="font-medium text-blue-700 flex items-center mb-2">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {post.hiredPerson.name}
                      </p>
                      <p className="text-blue-600 flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Started: {post.hiredPerson.startDate}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
                    {post.status === 'active' || post.status === 'paused' ? (
                      <>
                        {post.applicants.length > 0 && (
                          <button 
                            onClick={() => handleViewApplicants(post)}
                            className="bg-[#E6EBF4] text-[#133E87] px-4 py-2.5 rounded-xl text-sm flex items-center hover:bg-[#d9e1f1] transition-all shadow-sm"
                          >
                            <FaEye className="mr-2" /> View Applicants
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditPost(post.id)}
                          className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm flex items-center hover:bg-gray-200 transition-all shadow-sm"
                        >
                          <FaEdit className="mr-2" /> Edit
                        </button>
                        <button 
                          onClick={() => handlePauseResumePost(post.id, post.status)}
                          className={`px-4 py-2.5 rounded-xl text-sm flex items-center transition-all shadow-sm ${
                            post.status === 'active' 
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {post.status === 'active' 
                            ? <><FaPause className="mr-2" /> Pause</>
                            : <><BsPlayFill className="mr-2" /> Resume</>
                          }
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-red-100 text-red-700 px-4 py-2.5 rounded-xl text-sm flex items-center hover:bg-red-200 transition-all shadow-sm"
                        >
                          <FaTrash className="mr-2" /> Delete
                        </button>
                      </>
                    ) : post.status === 'hired' ? (
                      <>
                        <button className="bg-[#E6EBF4] text-[#133E87] px-4 py-2.5 rounded-xl text-sm flex items-center hover:bg-[#d9e1f1] transition-all shadow-sm">
                          <FaComments className="mr-2" /> Chat
                        </button>
                        <button className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm flex items-center hover:bg-gray-200 transition-all shadow-sm">
                          <FaFile className="mr-2" /> Agreement
                        </button>
                        <button className="bg-amber-100 text-amber-700 px-4 py-2.5 rounded-xl text-sm flex items-center hover:bg-amber-200 transition-all shadow-sm">
                          <FaSync className="mr-2" /> Replace
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleEditPost(post.id)}
                        className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm flex items-center hover:bg-gray-200 transition-all shadow-sm"
                      >
                        <FaEye className="mr-2" /> View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Applicants Modal */}
      {selectedPost && (
        <ApplicantsModal
          isOpen={showApplicants}
          onClose={() => setShowApplicants(false)}
          applicants={selectedPost.applicants}
          jobTitle={selectedPost.title}
          jobSchedule={selectedPost.schedule} 
          jobId={selectedPost.id} 
          onHire={handleHireApplicant} 
          onReject={handleRejectApplicant}
        />
      )}

      {/* Job Post Creation/Edit Modal */}
      <CreateJobPostModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleJobPostSuccess}
        jobId={editJobId}
      />
    </div>
  );
};

export default JobPosts;
