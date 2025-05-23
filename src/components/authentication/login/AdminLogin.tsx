import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Logo from '../../../assets/icons/HomeServe_Logo_Red.png';
import { adminService } from '../../services/admin.service';

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if the admin is already logged in
  useEffect(() => {
    const admin = adminService.getCurrentAdmin();
    if (admin) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const isFormValid = username.trim() !== '' && password.trim() !== '';

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      await adminService.login(username, password);
      toast.success('Login successful');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-6 sm:px-6">
      <div className="w-full max-w-md mx-auto p-5 sm:p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-4 sm:mb-6">
          <img src={Logo} alt="HomeServe" className="mx-auto w-32 sm:w-48 mb-2" />
          <div className="flex items-center justify-center gap-1 sm:gap-2 text-red-600">
            <FaShieldAlt size={16} className="sm:text-xl" />
            <h2 className="text-xl sm:text-2xl font-bold">Admin Portal</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-colors text-sm sm:text-base"
              placeholder="username"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-colors text-sm sm:text-base"
                placeholder="password"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-2.5 sm:py-3 px-4 rounded-lg text-white font-medium transition-colors text-sm sm:text-base ${
              isFormValid && !isLoading
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-red-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login to Admin Panel'
            )}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
          <p>This portal is restricted to authorized administrators only.</p>
          <p className="mt-2">
            <a href="/login" className="text-red-600 hover:text-red-800 font-medium">
              Return to main login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage; 