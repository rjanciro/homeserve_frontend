import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPlusCircle, FaTimesCircle, FaEdit, FaTimes } from 'react-icons/fa';

interface CreateJobPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId?: string;
}

const CreateJobPostModal: React.FC<CreateJobPostModalProps> = ({ isOpen, onClose, onSuccess, jobId }) => {
  const isEditMode = !!jobId;
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(isEditMode);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    scheduleType: 'recurring',
    startDate: '',
    endDate: '',
    time: '',
    days: [] as string[],
    frequency: 'weekly',
    budgetType: 'fixed',
    amount: '',
    minAmount: '',
    maxAmount: '',
    rate: 'hourly',
    skills: [] as string[]
  });
  
  // Skill input state
  const [skillInput, setSkillInput] = useState('');
  
  // Fetch job post data if in edit mode
  useEffect(() => {
    if (isEditMode && jobId) {
      const fetchJobPost = async () => {
        setFetchingJob(true);
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Authentication required');
          }
          
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/job-posts/${jobId}`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          
          const jobPost = response.data;
          
          setFormData({
            title: jobPost.title || '',
            description: jobPost.description || '',
            location: jobPost.location || '',
            scheduleType: jobPost.schedule?.type || 'one-time',
            startDate: jobPost.schedule?.startDate ? new Date(jobPost.schedule.startDate).toISOString().split('T')[0] : '',
            endDate: jobPost.schedule?.endDate ? new Date(jobPost.schedule.endDate).toISOString().split('T')[0] : '',
            time: jobPost.schedule?.time || '',
            days: jobPost.schedule?.days || [],
            frequency: jobPost.schedule?.frequency || 'weekly',
            budgetType: jobPost.budget?.type || 'fixed',
            amount: jobPost.budget?.amount?.toString() || '',
            minAmount: jobPost.budget?.minAmount?.toString() || '',
            maxAmount: jobPost.budget?.maxAmount?.toString() || '',
            rate: jobPost.budget?.rate || 'hourly',
            skills: jobPost.skills || []
          });
        } catch (err) {
          console.error('Error fetching job post:', err);
          toast.error('Failed to load job post details');
          onClose();
        } finally {
          setFetchingJob(false);
        }
      };
      
      fetchJobPost();
    }
  }, [jobId, isEditMode, onClose]);
  
  // Days of the week for recurring jobs
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle day selection for recurring schedule
  const handleDayToggle = (day: string) => {
    setFormData(prev => {
      if (prev.days.includes(day)) {
        return { ...prev, days: prev.days.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...prev.days, day] };
      }
    });
  };
  
  // Add a skill to the skills array
  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };
  
  // Remove a skill from the skills array
  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };
  
  // Reset form when modal closes
  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        location: '',
        scheduleType: 'recurring',
        startDate: '',
        endDate: '',
        time: '',
        days: [],
        frequency: 'weekly',
        budgetType: 'fixed',
        amount: '',
        minAmount: '',
        maxAmount: '',
        rate: 'hourly',
        skills: []
      });
      setSkillInput('');
      onClose();
    }
  };
  
  // Submit the form to create or update a job post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Format the data for the API
      const jobPostData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        schedule: {
          type: formData.scheduleType,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          days: formData.scheduleType === 'recurring' ? formData.days : undefined,
          frequency: formData.scheduleType === 'recurring' ? formData.frequency : undefined,
          time: formData.time || undefined
        },
        budget: {
          type: formData.budgetType,
          amount: formData.budgetType === 'fixed' ? parseFloat(formData.amount) : undefined,
          minAmount: formData.budgetType === 'range' ? parseFloat(formData.minAmount) : undefined,
          maxAmount: formData.budgetType === 'range' ? parseFloat(formData.maxAmount) : undefined,
          rate: formData.rate
        },
        skills: formData.skills
      };
      
      if (isEditMode && jobId) {
        // Update existing job post
        await axios.put(
          `${import.meta.env.VITE_API_URL}/job-posts/${jobId}`,
          jobPostData,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        toast.success('Job post updated successfully');
      } else {
        // Create new job post
        await axios.post(
          `${import.meta.env.VITE_API_URL}/job-posts`,
          jobPostData,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        toast.success('Job post created successfully');
      }
      
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error saving job post:', err);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} job post. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
      <div 
        className="bg-white/95 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200/50 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200/70 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              {isEditMode ? (
                <><FaEdit className="mr-2 text-[#133E87]" /> Edit Job Post</>
              ) : (
                <><FaPlusCircle className="mr-2 text-[#133E87]" /> Create New Job Post</>
              )}
            </h2>
            <button 
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        
        {fetchingJob ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#133E87]"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Job Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Job Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all"
                placeholder="e.g., Full-Time Live-in Cook"
              />
            </div>
            
            {/* Job Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Job Description <span className="text-red-500">*</span></label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all resize-none"
                placeholder="Describe the job duties, requirements, and any other relevant information..."
              ></textarea>
            </div>
            
            {/* Location */}
            <div className="mb-6">
              <label htmlFor="location" className="block text-gray-700 font-medium mb-2">Area/District <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all"
                placeholder="e.g., Makati City, Bonifacio Global City Area"
              />
              <p className="mt-1 text-xs text-gray-500">For privacy and safety reasons, please specify general area rather than exact address.</p>
            </div>
            
            {/* Schedule */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Schedule <span className="text-red-500">*</span></label>
              
              <div className="space-y-4 p-4 bg-gray-50/70 rounded-lg">
                <div>
                  <label className="block text-gray-700 text-sm mb-2">Days of Week <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          formData.days.includes(day)
                            ? 'bg-[#133E87] text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="frequency" className="block text-gray-700 text-sm mb-1">Frequency <span className="text-red-500">*</span></label>
                    <select
                      id="frequency"
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all appearance-none bg-white"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="startDate" className="block text-gray-700 text-sm mb-1">Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-gray-700 text-sm mb-1">Time <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all"
                      placeholder="e.g., 9:00 AM - 5:00 PM"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Budget */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Budget <span className="text-red-500">*</span></label>
              <div className="mb-4">
                <select
                  name="budgetType"
                  value={formData.budgetType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all appearance-none bg-white"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="range">Range</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50/70 rounded-lg">
                {formData.budgetType === 'fixed' ? (
                  <div>
                    <label htmlFor="amount" className="block text-gray-700 text-sm mb-1">Amount (₱) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all"
                      placeholder="e.g., 1000"
                      min="0"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="minAmount" className="block text-gray-700 text-sm mb-1">Minimum (₱) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        id="minAmount"
                        name="minAmount"
                        value={formData.minAmount}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all"
                        placeholder="e.g., 800"
                        min="0"
                      />
                    </div>
                    <div>
                      <label htmlFor="maxAmount" className="block text-gray-700 text-sm mb-1">Maximum (₱) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        id="maxAmount"
                        name="maxAmount"
                        value={formData.maxAmount}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all"
                        placeholder="e.g., 1200"
                        min="0"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label htmlFor="rate" className="block text-gray-700 text-sm mb-1">Rate Type <span className="text-red-500">*</span></label>
                  <select
                    id="rate"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all appearance-none bg-white"
                  >
                    <option value="hourly">Per Hour</option>
                    <option value="weekly">Per Week</option>
                    <option value="monthly">Per Month</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Skills */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Required Skills</label>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all"
                  placeholder="e.g., Cooking, Cleaning, etc."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="bg-[#133E87] text-white px-5 py-3 rounded-r-lg hover:bg-[#0f2f66] transition-colors font-medium"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50/70 rounded-lg min-h-[50px]">
                {formData.skills.length === 0 ? (
                  <span className="text-gray-400 italic">No skills added yet</span>
                ) : (
                  formData.skills.map(skill => (
                    <div 
                      key={skill}
                      className="bg-white text-gray-700 px-3 py-2 rounded-md flex items-center shadow-sm border border-gray-200/50"
                    >
                      <span className="font-medium">{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label={`Remove ${skill}`}
                      >
                        <FaTimesCircle />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-4 sticky bottom-0 bg-white/95 backdrop-blur-sm py-4 border-t border-gray-200/70">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-[#133E87] text-white rounded-lg hover:bg-[#0f2f66] transition-colors flex items-center shadow-md font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditMode ? <FaEdit className="mr-2" /> : <FaPlusCircle className="mr-2" />}
                    {isEditMode ? 'Update Job Post' : 'Create Job Post'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateJobPostModal; 