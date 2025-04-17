import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaSpinner, FaPaperPlane, FaTimes, FaEnvelope } from 'react-icons/fa';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';
import axios from 'axios';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  // Modal state management
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  
  const user = authService.getCurrentUser();
  const email = user?.email || '';

  const handleRequestPin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First verify the current password using the existing changePassword method
      await authService.changePassword(currentPassword, newPassword);
      
      // Request a PIN for confirmation (as an additional security step)
      await authService.requestPasswordChangePin(email);
      
      toast.success('Verification PIN sent to your email');
      setStep('verify');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request verification PIN');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin || pin.length !== 6) {
      toast.error('Please enter a valid 6-digit PIN');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Since verifyPasswordChangePin doesn't exist, we'll use a direct API call
      // or you can implement this function in your auth.service.ts
      const response = await axios.post(
        `http://localhost:8080/api/auth/verify-password-change-pin`,
        { email, pin, newPassword },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      toast.success('Password changed successfully');
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify PIN');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPin('');
    setStep('request');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#133E87] opacity-30 backdrop-blur-sm"></div>
      
      {/* Modal Container */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-[#133E87] text-white py-4 px-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {step === 'request' ? 'Change Password' : 'Verify PIN'}
            </h2>
            <button 
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="text-white hover:text-gray-200"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="p-6">
            {step === 'request' ? (
              <form onSubmit={handleRequestPin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-[#133E87]" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-[#133E87]" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 text-[#133E87]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end border-t pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="mr-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#133E87] text-white font-medium rounded-md hover:bg-[#0f2f66] transition-colors flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification PIN'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPin}>
                <div className="mb-6 text-center">
                  <div className="bg-[#E6EBF4] rounded-full p-4 inline-flex mb-4">
                    <FaEnvelope className="text-2xl text-[#133E87]" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    We've sent a verification PIN to your email address ({email}). 
                    Please enter the 6-digit PIN below to complete your password change.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification PIN
                  </label>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 text-center text-xl tracking-widest border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#133E87]"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                
                <div className="flex justify-end border-t pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="mr-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || pin.length !== 6}
                    className="px-4 py-2 bg-[#133E87] text-white font-medium rounded-md hover:bg-[#0f2f66] transition-colors flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Change Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal; 