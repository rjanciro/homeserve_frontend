import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaPlusCircle, FaTimesCircle, FaEdit } from 'react-icons/fa';

const CreateJobPost: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(isEditMode);
  
  // Updated form state to support new time format
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    scheduleType: 'one-time',
    startDate: '',
    endDate: '',
    time: '',
    startHour: '09',
    startMinute: '00',
    startPeriod: 'am',
    endHour: '05',
    endMinute: '00',
    endPeriod: 'pm',
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
  
  // Generate time options
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periods = ['am', 'pm'];
  
  // Fetch job post data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchJobPost = async () => {
        setFetchingJob(true);
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Authentication required');
          }
          
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/job-posts/${id}`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          
          const jobPost = response.data;
          
          // Parse existing time format (e.g., "9:00 AM - 5:00 PM")
          let startHour = '09';
          let startMinute = '00';
          let startPeriod = 'am';
          let endHour = '05';
          let endMinute = '00';
          let endPeriod = 'pm';
          
          if (jobPost.schedule?.time) {
            const timeParts = jobPost.schedule.time.split(' - ');
            if (timeParts.length === 2) {
              const startTime = timeParts[0].trim();
              const endTime = timeParts[1].trim();
              
              // Parse start time
              const startMatch = startTime.match(/(\d+):(\d+)\s*(am|pm)/i);
              if (startMatch) {
                startHour = String(parseInt(startMatch[1], 10)).padStart(2, '0');
                startMinute = startMatch[2];
                startPeriod = startMatch[3].toLowerCase();
              }
              
              // Parse end time
              const endMatch = endTime.match(/(\d+):(\d+)\s*(am|pm)/i);
              if (endMatch) {
                endHour = String(parseInt(endMatch[1], 10)).padStart(2, '0');
                endMinute = endMatch[2];
                endPeriod = endMatch[3].toLowerCase();
              }
            }
          }
          
          setFormData({
            title: jobPost.title || '',
            description: jobPost.description || '',
            location: jobPost.location || '',
            scheduleType: jobPost.schedule?.type || 'one-time',
            startDate: jobPost.schedule?.startDate ? new Date(jobPost.schedule.startDate).toISOString().split('T')[0] : '',
            endDate: jobPost.schedule?.endDate ? new Date(jobPost.schedule.endDate).toISOString().split('T')[0] : '',
            time: jobPost.schedule?.time || '',
            startHour,
            startMinute,
            startPeriod,
            endHour,
            endMinute,
            endPeriod,
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
          navigate('/job-posts');
        } finally {
          setFetchingJob(false);
        }
      };
      
      fetchJobPost();
    }
  }, [id, isEditMode, navigate]);
  
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
  
  // Submit the form to create or update a job post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Format the time from individual components
      const formattedTime = `${formData.startHour}:${formData.startMinute} ${formData.startPeriod} - ${formData.endHour}:${formData.endMinute} ${formData.endPeriod}`;
      
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
          time: formattedTime
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
      
      if (isEditMode) {
        // Update existing job post
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/job-posts/${id}`,
          jobPostData,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        toast.success('Job post updated successfully');
      } else {
        // Create new job post
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/job-posts`,
          jobPostData,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        toast.success('Job post created successfully');
      }
      
      navigate('/job-posts');
    } catch (err) {
      console.error('Error saving job post:', err);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} job post. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  if (fetchingJob) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#133E87]"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 mb-6 hover:text-gray-900"
        >
          <FaArrowLeft className="mr-2" /> Back to Job Posts
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditMode ? 'Edit Job Post' : 'Create New Job Post'}
        </h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Job Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              placeholder="e.g., Full-Time Live-in Cook"
            />
          </div>
          
          {/* Job Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Job Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              placeholder="Describe the job duties, requirements, and any other relevant information..."
            ></textarea>
          </div>
          
          {/* Location */}
          <div className="mb-6">
            <label htmlFor="location" className="block text-gray-700 font-medium mb-2">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              placeholder="e.g., Makati City"
            />
          </div>
          
          {/* Schedule */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Schedule *</label>
            <div className="mb-4">
              <select
                name="scheduleType"
                value={formData.scheduleType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              >
                <option value="one-time">One-time Job</option>
                <option value="recurring">Recurring Job</option>
              </select>
            </div>
            
            {formData.scheduleType === 'one-time' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-gray-700 text-sm mb-1">Date *</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm mb-1">Time *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Start Time</p>
                      <div className="flex">
                        <select
                          name="startHour"
                          value={formData.startHour}
                          onChange={handleChange}
                          className="w-1/3 px-2 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                        >
                          {hours.map(hour => (
                            <option key={`start-h-${hour}`} value={hour}>{hour}</option>
                          ))}
                        </select>
                        <select
                          name="startMinute"
                          value={formData.startMinute}
                          onChange={handleChange}
                          className="w-1/3 px-2 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                        >
                          {minutes.map(minute => (
                            <option key={`start-m-${minute}`} value={minute}>{minute}</option>
                          ))}
                        </select>
                        <select
                          name="startPeriod"
                          value={formData.startPeriod}
                          onChange={handleChange}
                          className="w-1/3 px-2 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                        >
                          {periods.map(period => (
                            <option key={`start-p-${period}`} value={period}>{period}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">End Time</p>
                      <div className="flex">
                        <select
                          name="endHour"
                          value={formData.endHour}
                          onChange={handleChange}
                          className="w-1/3 px-2 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                        >
                          {hours.map(hour => (
                            <option key={`end-h-${hour}`} value={hour}>{hour}</option>
                          ))}
                        </select>
                        <select
                          name="endMinute"
                          value={formData.endMinute}
                          onChange={handleChange}
                          className="w-1/3 px-2 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                        >
                          {minutes.map(minute => (
                            <option key={`end-m-${minute}`} value={minute}>{minute}</option>
                          ))}
                        </select>
                        <select
                          name="endPeriod"
                          value={formData.endPeriod}
                          onChange={handleChange}
                          className="w-1/3 px-2 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                        >
                          {periods.map(period => (
                            <option key={`end-p-${period}`} value={period}>{period}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-1">Days of Week *</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          formData.days.includes(day)
                            ? 'bg-[#133E87] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="frequency" className="block text-gray-700 text-sm mb-1">Frequency *</label>
                    <select
                      id="frequency"
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="startDate" className="block text-gray-700 text-sm mb-1">Start Date *</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">Time *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Start Time</p>
                        <div className="flex">
                          <select
                            name="startHour"
                            value={formData.startHour}
                            onChange={handleChange}
                            className="w-1/3 px-2 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                          >
                            {hours.map(hour => (
                              <option key={`start-h-${hour}`} value={hour}>{hour}</option>
                            ))}
                          </select>
                          <select
                            name="startMinute"
                            value={formData.startMinute}
                            onChange={handleChange}
                            className="w-1/3 px-2 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                          >
                            {minutes.map(minute => (
                              <option key={`start-m-${minute}`} value={minute}>{minute}</option>
                            ))}
                          </select>
                          <select
                            name="startPeriod"
                            value={formData.startPeriod}
                            onChange={handleChange}
                            className="w-1/3 px-2 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                          >
                            {periods.map(period => (
                              <option key={`start-p-${period}`} value={period}>{period}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 mb-1">End Time</p>
                        <div className="flex">
                          <select
                            name="endHour"
                            value={formData.endHour}
                            onChange={handleChange}
                            className="w-1/3 px-2 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                          >
                            {hours.map(hour => (
                              <option key={`end-h-${hour}`} value={hour}>{hour}</option>
                            ))}
                          </select>
                          <select
                            name="endMinute"
                            value={formData.endMinute}
                            onChange={handleChange}
                            className="w-1/3 px-2 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                          >
                            {minutes.map(minute => (
                              <option key={`end-m-${minute}`} value={minute}>{minute}</option>
                            ))}
                          </select>
                          <select
                            name="endPeriod"
                            value={formData.endPeriod}
                            onChange={handleChange}
                            className="w-1/3 px-2 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#133E87] appearance-none bg-white text-center"
                          >
                            {periods.map(period => (
                              <option key={`end-p-${period}`} value={period}>{period}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Budget */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Budget *</label>
            <div className="mb-4">
              <select
                name="budgetType"
                value={formData.budgetType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="range">Range</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.budgetType === 'fixed' ? (
                <div>
                  <label htmlFor="amount" className="block text-gray-700 text-sm mb-1">Amount (₱) *</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    placeholder="e.g., 1000"
                    min="0"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="minAmount" className="block text-gray-700 text-sm mb-1">Minimum (₱) *</label>
                    <input
                      type="number"
                      id="minAmount"
                      name="minAmount"
                      value={formData.minAmount}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                      placeholder="e.g., 800"
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="maxAmount" className="block text-gray-700 text-sm mb-1">Maximum (₱) *</label>
                    <input
                      type="number"
                      id="maxAmount"
                      name="maxAmount"
                      value={formData.maxAmount}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                      placeholder="e.g., 1200"
                      min="0"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label htmlFor="rate" className="block text-gray-700 text-sm mb-1">Rate Type *</label>
                <select
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                >
                  <option value="hourly">Per Hour</option>
                  <option value="fixed">Per Job</option>
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                placeholder="e.g., Cooking, Cleaning, etc."
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-[#133E87] text-white px-4 py-2 rounded-r-md hover:bg-[#0f2f66]"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skills.map(skill => (
                <div 
                  key={skill}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md flex items-center"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    <FaTimesCircle />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#133E87] text-white rounded-md hover:bg-[#0f2f66] flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      </div>
    </div>
  );
};

export default CreateJobPost; 