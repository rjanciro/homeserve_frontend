import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCalendar, FaMoneyBillWave, FaClock, FaCheckCircle, FaBriefcase } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface ScheduleDay {
  day: string;
  timeRange: string;
}

interface JobPostSchedule {
  type: string;
  startDate?: string;
  endDate?: string;
  days?: string[];
  frequency?: string;
  time?: string;
  timeRanges?: { [key: string]: string };
}

interface JobPostBudget {
  type: string;
  minAmount?: number;
  maxAmount?: number;
  amount?: number;
  rate?: string;
}

interface JobPost {
  id: string;
  title: string;
  schedule: JobPostSchedule;
  budget: JobPostBudget;
}

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPost | null;
  onSuccess: () => void;
}

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({ 
  isOpen, 
  onClose, 
  job, 
  onSuccess 
}) => {
  const [coverMessage, setCoverMessage] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [availableDays, setAvailableDays] = useState<{[key: string]: boolean}>({});
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleDay[]>([]);

  useEffect(() => {
    if (job && job.schedule) {
      // Parse schedule information and set up form
      const scheduleDays: ScheduleDay[] = [];
      
      if (job.schedule.type === 'recurring' && job.schedule.days) {
        job.schedule.days.forEach(day => {
          const timeRange = job.schedule.timeRanges?.[day] || 
                           (job.schedule.time ? `${job.schedule.time}` : '06:00 am - 08:00 pm');
          
          scheduleDays.push({
            day,
            timeRange
          });
          
          // Initialize all days as checked
          setAvailableDays(prev => ({
            ...prev,
            [day]: true
          }));
        });
      }
      
      setScheduleInfo(scheduleDays);
      
      // Set default start date from job if available
      if (job.schedule.startDate) {
        setStartDate(new Date(job.schedule.startDate));
      } else {
        // Default to tomorrow if no start date provided
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setStartDate(tomorrow);
      }
    }
  }, [job]);

  // Format number with commas (e.g., 15000 -> 15,000)
  const formatNumberWithCommas = (value: string): string => {
    // Remove existing commas first
    const valueWithoutCommas = value.replace(/,/g, '');
    
    // Check if it's a valid number
    if (valueWithoutCommas === '' || isNaN(Number(valueWithoutCommas))) {
      return valueWithoutCommas;
    }
    
    // Format with commas
    return Number(valueWithoutCommas).toLocaleString('en-US');
  };

  // Handle rate input change with formatting
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow only numbers and commas
    if (/^[0-9,]*$/.test(value)) {
      setProposedRate(formatNumberWithCommas(value));
    }
  };

  const handleSubmit = async () => {
    if (!job) return;
    
    if (!coverMessage.trim()) {
      toast.error('Please provide a cover message');
      return;
    }
    
    // Clean up the rate value by removing commas
    const cleanRate = proposedRate.replace(/,/g, '');
    
    if (!cleanRate.trim() || isNaN(parseFloat(cleanRate))) {
      toast.error('Please provide a valid rate');
      return;
    }
    
    // Check if at least one day is selected for recurring jobs
    if (job.schedule.type === 'recurring' && 
        Object.values(availableDays).every(val => val === false)) {
      toast.error('Please confirm your availability for at least one day');
      return;
    }
    
    // Check if start date is selected
    if (!startDate) {
      toast.error('Please confirm your start date');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Log user info for debugging
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('User verification status:', {
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus,
          userType: user.userType
        });
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/job-posts/${job.id}/apply`,
        {
          message: coverMessage,
          proposedRate: parseFloat(cleanRate),
          availableDays,
          startDate: startDate.toISOString(),
          experienceSummary: experienceSummary
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Application submitted successfully');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting application:', err);
      
      // Handle verification status error with more specific messages
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        const data = err.response.data;
        
        // Check if it's a verification-related error
        if (data.verificationStatus) {
          if (data.detailedMessage) {
            toast.error(data.detailedMessage);
          } else {
            toast.error(data.message || 'Account verification required');
          }
        } else {
          toast.error(data.message || 'Permission denied');
        }
      } else {
        toast.error('Failed to submit application');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderBudget = (budget: JobPostBudget | undefined) => {
    if (!budget) return 'Not specified';
    
    try {
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0
        }).format(amount);
      };
      
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

  if (!isOpen || !job) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 md:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 pr-2 sm:pr-4">
              Apply for {job.title}
            </h2>
            <button 
              onClick={onClose}
              className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-150"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center mt-2 sm:mt-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3">
              <FaMoneyBillWave className="text-blue-600" size={12} />
            </div>
            <div>
              <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500">Budget</p>
              <p className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">{renderBudget(job.budget)}</p>
            </div>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6">
          {/* Proposed Rate */}
          <div className="mb-3 sm:mb-5">
            <label htmlFor="rate" className="block text-gray-700 font-medium mb-1 sm:mb-2 flex items-center text-xs sm:text-sm">
              <FaMoneyBillWave className="mr-1.5 sm:mr-2 text-green-600" size={12} />
              Your Rate (₱) <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="rate"
              value={proposedRate}
              onChange={handleRateChange}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all duration-150 text-xs sm:text-sm"
              placeholder="Enter your proposed rate"
            />
          </div>
          
          {/* Cover Message */}
          <div className="mb-3 sm:mb-5">
            <label htmlFor="coverMessage" className="block text-gray-700 font-medium mb-1 sm:mb-2 flex items-center text-xs sm:text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 text-[#133E87]">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Cover Message <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="coverMessage"
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value)}
              rows={3}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all duration-150 resize-none text-xs sm:text-sm"
              placeholder="Hi, I have 3 years of cleaning experience and am available on your preferred days..."
            ></textarea>
            <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              Introduce yourself and explain why you're a good fit for this job.
            </p>
          </div>
          
          {/* Availability Confirmation */}
          {job.schedule.type === 'recurring' && scheduleInfo.length > 0 && (
            <div className="mb-3 sm:mb-5">
              <label className="block text-gray-700 font-medium mb-1 sm:mb-2 flex items-center text-xs sm:text-sm">
                <FaClock className="mr-1.5 sm:mr-2 text-[#133E87]" size={12} />
                Availability Confirmation <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 mb-2">
                  Please confirm if you are available on the following days and times:
                </p>
                <div className="space-y-2">
                  {scheduleInfo.map((schedule, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`day-${schedule.day}`}
                        checked={availableDays[schedule.day] || false}
                        onChange={(e) => setAvailableDays(prev => ({
                          ...prev,
                          [schedule.day]: e.target.checked
                        }))}
                        className="w-4 h-4 text-[#133E87] border-gray-300 rounded focus:ring-[#133E87]"
                      />
                      <label 
                        htmlFor={`day-${schedule.day}`} 
                        className="ml-2 text-xs sm:text-sm text-gray-700 font-medium"
                      >
                        {schedule.day} {schedule.timeRange}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Start Date Confirmation */}
          <div className="mb-3 sm:mb-5">
            <label className="block text-gray-700 font-medium mb-1 sm:mb-2 flex items-center text-xs sm:text-sm">
              <FaCalendar className="mr-1.5 sm:mr-2 text-[#133E87]" size={12} />
              I can start on <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                minDate={new Date()}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all duration-150 text-xs sm:text-sm"
                dateFormat="MMMM d, yyyy"
              />
            </div>
          </div>
          
          {/* Experience Summary */}
          <div className="mb-3 sm:mb-5">
            <label htmlFor="experienceSummary" className="block text-gray-700 font-medium mb-1 sm:mb-2 flex items-center text-xs sm:text-sm">
              <FaBriefcase className="mr-1.5 sm:mr-2 text-[#133E87]" size={12} />
              Experience Summary <span className="text-gray-500 ml-1 text-[10px] xs:text-xs">(optional)</span>
            </label>
            <textarea
              id="experienceSummary"
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              rows={3}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#133E87] transition-all duration-150 resize-none text-xs sm:text-sm"
              placeholder="Describe any relevant experience or certifications..."
            ></textarea>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-2 sm:space-x-3 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-150 font-medium text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-[#133E87] text-white rounded-lg hover:bg-[#0f2f66] transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-70 font-medium text-xs sm:text-sm"
            >
              {submitting ? (
              <div className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-1.5 sm:mr-2" /> Submitting...
              </div>
              ) : (
                'Submit Application'
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationModal; 