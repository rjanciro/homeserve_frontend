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
  profileImage?: string;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Your Job Posts</h1>
        <button 
          onClick={handleCreateJobPost}
          className="bg-[#133E87] hover:bg-[#0f2f66] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center shadow-md transition-all duration-200 font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <FaPlus className="mr-1.5" /> Create Job Post
        </button>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col mb-6 space-y-3 bg-white/70 p-3 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-gray-600 text-xs sm:text-sm font-medium">
            <FaFilter className="mr-1" /> Filter by status
          </div>
          <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg shadow-inner">
            {(['active', 'paused', 'hired', 'archived'] as JobStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md capitalize text-xs transition-all duration-200 ${
                  activeFilter === status 
                    ? 'bg-white shadow-md text-[#133E87] font-medium' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-gray-600 text-xs sm:text-sm font-medium">
            <FaSort className="mr-1" /> Sort by
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#133E87] text-gray-700 appearance-none shadow-sm text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="mostApplicants">Most Applicants</option>
            <option value="soonestStartDate">Soonest Start Date</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-14 w-14 border-t-3 border-b-3 border-[#133E87]"></div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 text-red-700 p-6 rounded-lg mb-8 shadow-sm border border-red-100">
          <p className="font-medium">{error}</p>
          <p className="mt-2 text-sm text-red-600">Please try refreshing the page or contact support if the problem persists.</p>
        </div>
      )}

      {/* Job Posts List */}
      {!loading && !error && filteredAndSortedPosts.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-10 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaPlus className="text-3xl text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg font-medium">
            No {activeFilter} job posts found.
          </p>
          <p className="text-gray-500 mt-3">
            Click on "Create Job Post" to post a new job for housekeepers to apply.
          </p>
          {activeFilter !== 'active' && (
            <button
              onClick={() => setActiveFilter('active')}
              className="mt-6 text-[#133E87] hover:text-[#0f2f66] font-medium bg-[#E6EBF4] hover:bg-[#d9e1f1] px-4 py-2 rounded-lg transition-colors"
            >
              View active job posts
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPosts.map(post => (
            <div 
              key={post.id} 
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">{post.title}</h3>
                <div className="space-y-3 mb-5">
                  <div className="flex items-start">
                    <span className="text-gray-500 mr-2 flex-shrink-0 mt-0.5">📍</span>
                    <p className="text-gray-700">{post.location}</p>
                  </div>
                  
                  {post.status !== 'hired' && post.startDate && (
                    <div className="flex items-start">
                      <span className="text-gray-500 mr-2 flex-shrink-0 mt-0.5">🗓️</span>
                      <p className="text-gray-700">Start Date: {post.startDate}</p>
                    </div>
                  )}
                  
                  {post.salary && (
                    <div className="flex items-start">
                      <span className="text-gray-500 mr-2 flex-shrink-0 mt-0.5">💸</span>
                      <p className="text-gray-700">Salary: {post.salary}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">📌</span>
                    <span className={`font-medium capitalize px-3 py-1 rounded-full text-sm ${
                      post.status === 'active' ? 'bg-green-100 text-green-700' :
                      post.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                      post.status === 'hired' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  
                  {post.status !== 'hired' && post.status !== 'archived' && (
                    <div className="flex items-start">
                      <span className="text-gray-500 mr-2 flex-shrink-0 mt-0.5">👥</span>
                      <p className="text-gray-700">
                        {post.applicants.length} {post.applicants.length === 1 ? 'Applicant' : 'Applicants'}
                      </p>
                    </div>
                  )}
                </div>
                
                {post.status === 'hired' && post.hiredPerson && (
                  <div className="mb-5 p-4 bg-[#E6EBF4] rounded-lg">
                    <p className="font-medium text-[#133E87] flex items-center">
                      <span className="mr-2">👩‍💼</span> Hired: {post.hiredPerson.name}
                    </p>
                    <p className="text-[#133E87] mt-1 flex items-center">
                      <span className="mr-2">📅</span> Started: {post.hiredPerson.startDate}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100">
                  {post.status === 'active' || post.status === 'paused' ? (
                    <>
                      {post.applicants.length > 0 && (
                        <button 
                          onClick={() => handleViewApplicants(post)}
                          className="bg-[#E6EBF4] text-[#133E87] px-3 py-2 rounded-md text-sm flex items-center hover:bg-[#d9e1f1] transition-colors"
                        >
                          <FaEye className="mr-1.5" /> View Applicants
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditPost(post.id)}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm flex items-center hover:bg-gray-200 transition-colors"
                      >
                        <FaEdit className="mr-1.5" /> Edit
                      </button>
                      <button 
                        onClick={() => handlePauseResumePost(post.id, post.status)}
                        className={`${
                          post.status === 'active' 
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } px-3 py-2 rounded-md text-sm flex items-center transition-colors`}
                      >
                        {post.status === 'active' 
                          ? <><FaPause className="mr-1.5" /> Pause</>
                          : <><BsPlayFill className="mr-1.5" /> Resume</>
                        }
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm flex items-center hover:bg-red-200 transition-colors"
                      >
                        <FaTrash className="mr-1.5" /> Delete
                      </button>
                    </>
                  ) : post.status === 'hired' ? (
                    <>
                      <button className="bg-[#E6EBF4] text-[#133E87] px-3 py-2 rounded-md text-sm flex items-center hover:bg-[#d9e1f1] transition-colors">
                        <FaComments className="mr-1.5" /> Chat
                      </button>
                      <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm flex items-center hover:bg-gray-200 transition-colors">
                        <FaFile className="mr-1.5" /> View Agreement
                      </button>
                      <button className="bg-amber-100 text-amber-700 px-3 py-2 rounded-md text-sm flex items-center hover:bg-amber-200 transition-colors">
                        <FaSync className="mr-1.5" /> Replace
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleEditPost(post.id)}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm flex items-center hover:bg-gray-200 transition-colors"
                    >
                      <FaEye className="mr-1.5" /> View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applicants Modal - Removed getProfileImageUrl prop */}
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
