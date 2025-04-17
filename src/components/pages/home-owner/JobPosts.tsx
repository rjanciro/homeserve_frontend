import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye, FaEdit, FaPause, FaTrash, FaComments, FaFile, FaSync } from 'react-icons/fa';
import { BsPlayFill } from 'react-icons/bs';

// Define types
type JobStatus = 'active' | 'paused' | 'hired' | 'archived';
type SortOption = 'newest' | 'mostApplicants' | 'soonestStartDate';

interface Applicant {
  id: string;
  name: string;
  credentials: string;
  message: string;
  hasId: boolean;
  hasCertifications: boolean;
  profileImage?: string;
}

interface JobPost {
  id: string;
  title: string;
  location: string;
  startDate: string;
  salary: string;
  status: JobStatus;
  applicants: Applicant[];
  createdAt: Date;
  hiredPerson?: {
    name: string;
    startDate: string;
  };
}

const JobPosts: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<JobStatus>('active');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null);
  const [showApplicants, setShowApplicants] = useState(false);

  // Simulate fetching job posts
  useEffect(() => {
    // This would be replaced with an actual API call
    const mockJobPosts: JobPost[] = [
      {
        id: '1',
        title: 'Full-Time Live-in Cook Needed',
        location: 'Quezon City',
        startDate: 'April 20, 2025',
        salary: '₱12,000/month',
        status: 'active',
        createdAt: new Date('2025-03-15'),
        applicants: [
          {
            id: 'a1',
            name: 'Carla Santos',
            credentials: 'TESDA Certified | 2 yrs exp',
            message: "I'm available full-time and can start next week.",
            hasId: true,
            hasCertifications: true,
          },
          {
            id: 'a2',
            name: 'Angelica Reyes',
            credentials: '5 years exp | Former OFW',
            message: "Looking for live-in roles in Quezon City.",
            hasId: true,
            hasCertifications: false,
          },
          {
            id: 'a3',
            name: 'Miguel Garcia',
            credentials: '3 years exp | Culinary School Graduate',
            message: "I specialize in Filipino and international cuisine.",
            hasId: true,
            hasCertifications: true,
          }
        ]
      },
      {
        id: '2',
        title: 'Part-Time Housekeeper (3x/week)',
        location: 'Pasig City',
        startDate: 'April 10, 2025',
        salary: '₱6,000/month',
        status: 'hired',
        createdAt: new Date('2025-02-25'),
        applicants: [],
        hiredPerson: {
          name: 'Maria Dela Cruz',
          startDate: 'April 10, 2025'
        }
      },
      {
        id: '3',
        title: 'Full-Time Nanny for 2 Children',
        location: 'Makati City',
        startDate: 'May 1, 2025',
        salary: '₱15,000/month',
        status: 'paused',
        createdAt: new Date('2025-03-10'),
        applicants: [
          {
            id: 'a4',
            name: 'Josie Mendoza',
            credentials: '10 years exp | First Aid Certified',
            message: "I love working with children and have references.",
            hasId: true,
            hasCertifications: true,
          }
        ]
      },
      {
        id: '4',
        title: 'Weekend Gardener',
        location: 'Taguig City',
        startDate: 'March 15, 2025',
        salary: '₱4,000/month',
        status: 'archived',
        createdAt: new Date('2025-01-15'),
        applicants: []
      }
    ];

    setJobPosts(mockJobPosts);
  }, []);

  // Filter and sort job posts
  const filteredAndSortedPosts = jobPosts
    .filter(post => post.status === activeFilter)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else if (sortBy === 'mostApplicants') {
        return b.applicants.length - a.applicants.length;
      } else { // soonestStartDate
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
    });

  const handleCreateJobPost = () => {
    // Implement create job post functionality 
    console.log('Create job post');
    // Navigate to creation form or open modal
  };

  const handleViewApplicants = (post: JobPost) => {
    setSelectedPost(post);
    setShowApplicants(true);
  };

  const handleEditPost = (postId: string) => {
    console.log('Edit post', postId);
    // Navigate to edit form or open modal
  };

  const handlePauseResumePost = (postId: string, currentStatus: JobStatus) => {
    // Toggle between active and paused
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    // In a real app, you would call an API here
    console.log(`Change post ${postId} status from ${currentStatus} to ${newStatus}`);
    
    // Update the local state
    setJobPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? {...post, status: newStatus as JobStatus} : post
      )
    );
  };

  const handleDeletePost = (postId: string) => {
    // Confirm before deleting
    if (window.confirm('Are you sure you want to delete this job post?')) {
      // In a real app, you would call an API here
      console.log(`Delete post ${postId}`);
      
      // Update the local state
      setJobPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    }
  };

  const handleHireApplicant = (postId: string, applicant: Applicant) => {
    // In a real app, you would call an API here
    console.log(`Hire applicant ${applicant.name} for post ${postId}`);
    
    // Update the local state
    setJobPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {
              ...post, 
              status: 'hired' as JobStatus,
              hiredPerson: {
                name: applicant.name,
                startDate: new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              }
            } 
          : post
      )
    );
    
    setShowApplicants(false);
  };

  const handleRejectApplicant = (postId: string, applicantId: string) => {
    // In a real app, you would call an API here
    console.log(`Reject applicant ${applicantId} for post ${postId}`);
    
    // Update the local state
    setJobPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {
              ...post,
              applicants: post.applicants.filter(a => a.id !== applicantId)
            } 
          : post
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Job Posts</h1>
        <button 
          onClick={handleCreateJobPost}
          className="bg-[#133E87] hover:bg-[#0f2f66] text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" /> Create Job Post
        </button>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-md">
          {(['active', 'paused', 'hired', 'archived'] as JobStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-4 py-2 rounded-md capitalize ${
                activeFilter === status 
                  ? 'bg-white shadow text-[#133E87]' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#133E87]"
          >
            <option value="newest">Newest</option>
            <option value="mostApplicants">Most Applicants</option>
            <option value="soonestStartDate">Soonest Start Date</option>
          </select>
        </div>
      </div>

      {/* Job Posts List */}
      {filteredAndSortedPosts.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">
            No {activeFilter} job posts found.
          </p>
          {activeFilter !== 'active' && (
            <button
              onClick={() => setActiveFilter('active')}
              className="mt-4 text-[#133E87] hover:text-[#0f2f66]"
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
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h3>
                <div className="space-y-2 mb-4">
                  <p className="text-gray-600">📍 {post.location}</p>
                  {post.status !== 'hired' && (
                    <p className="text-gray-600">🗓️ Start Date: {post.startDate}</p>
                  )}
                  <p className="text-gray-600">💸 Salary: {post.salary}</p>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">📌 Status:</span>
                    <span className={`font-medium capitalize ${
                      post.status === 'active' ? 'text-[#133E87]' :
                      post.status === 'paused' ? 'text-amber-600' :
                      post.status === 'hired' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  
                  {post.status !== 'hired' && post.status !== 'archived' && (
                    <p className="text-gray-600">👥 Applicants: {post.applicants.length}</p>
                  )}
                </div>
                
                {post.status === 'hired' && post.hiredPerson && (
                  <div className="mb-4 p-3 bg-[#E6EBF4] rounded-md">
                    <p className="font-medium text-[#133E87]">👩‍💼 Hired: {post.hiredPerson.name}</p>
                    <p className="text-[#133E87]">📅 Started: {post.hiredPerson.startDate}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.status === 'active' || post.status === 'paused' ? (
                    <>
                      {post.applicants.length > 0 && (
                        <button 
                          onClick={() => handleViewApplicants(post)}
                          className="bg-[#E6EBF4] text-[#133E87] px-3 py-1.5 rounded-md text-sm flex items-center hover:bg-[#F0F4FA]"
                        >
                          <FaEye className="mr-1.5" /> View Applicants
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditPost(post.id)}
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm flex items-center hover:bg-gray-200"
                      >
                        <FaEdit className="mr-1.5" /> Edit Post
                      </button>
                      <button 
                        onClick={() => handlePauseResumePost(post.id, post.status)}
                        className={`${
                          post.status === 'active' 
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } px-3 py-1.5 rounded-md text-sm flex items-center`}
                      >
                        {post.status === 'active' 
                          ? <><FaPause className="mr-1.5" /> Pause</>
                          : <><BsPlayFill className="mr-1.5" /> Resume</>
                        }
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="bg-red-100 text-red-700 px-3 py-1.5 rounded-md text-sm flex items-center hover:bg-red-200"
                      >
                        <FaTrash className="mr-1.5" /> Delete
                      </button>
                    </>
                  ) : post.status === 'hired' ? (
                    <>
                      <button className="bg-[#E6EBF4] text-[#133E87] px-3 py-1.5 rounded-md text-sm flex items-center hover:bg-[#F0F4FA]">
                        <FaComments className="mr-1.5" /> Chat
                      </button>
                      <button className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm flex items-center hover:bg-gray-200">
                        <FaFile className="mr-1.5" /> View Agreement
                      </button>
                      <button className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md text-sm flex items-center hover:bg-amber-200">
                        <FaSync className="mr-1.5" /> Replace
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleEditPost(post.id)}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm flex items-center hover:bg-gray-200"
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

      {/* Applicants Modal */}
      {showApplicants && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Applicants for {selectedPost.title}
                </h2>
                <button 
                  onClick={() => setShowApplicants(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
              {selectedPost.applicants.length === 0 ? (
                <p className="text-gray-500 text-center p-8">No applicants yet.</p>
              ) : (
                <div className="space-y-6">
                  {selectedPost.applicants.map((applicant, index) => (
                    <div 
                      key={applicant.id}
                      className={`bg-gray-50 rounded-lg p-5 ${
                        index !== selectedPost.applicants.length - 1 ? 'border-b border-gray-200 pb-6' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                          {applicant.profileImage ? (
                            <img 
                              src={applicant.profileImage} 
                              alt={applicant.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-bold">
                              {applicant.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">{applicant.name}</h3>
                          <p className="text-green-600 mb-2">{applicant.credentials}</p>
                          <p className="text-gray-600 mb-3">
                            💬 "{applicant.message}"
                          </p>
                          
                          <div className="mb-4">
                            <p className="text-gray-600">
                              📎 Documents: 
                              {applicant.hasId && (
                                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">ID</span>
                              )}
                              {applicant.hasCertifications && (
                                <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Certifications</span>
                              )}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <button className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200">
                              View Profile
                            </button>
                            <button className="bg-[#E6EBF4] text-[#133E87] px-3 py-1.5 rounded text-sm hover:bg-[#F0F4FA]">
                              Chat
                            </button>
                            <button 
                              onClick={() => handleHireApplicant(selectedPost.id, applicant)}
                              className="bg-[#E6EBF4] text-[#133E87] px-3 py-1.5 rounded text-sm hover:bg-[#F0F4FA]"
                            >
                              Hire
                            </button>
                            <button 
                              onClick={() => handleRejectApplicant(selectedPost.id, applicant.id)}
                              className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowApplicants(false)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
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

export default JobPosts;
