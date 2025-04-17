import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserType, FormData } from '../../../types';
import LogoBlue from '../../../assets/icons/HomeServe_Logo_Blue.png';
import LogoGreen from '../../../assets/icons/HomeServe_Logo_Green.png';
import useDocumentTitle from '../../../hooks/useDocumentTitle.ts';
import { authService } from '../../services/auth.service';
import axios from 'axios';

const RegisterPage: React.FC = () => {
  useDocumentTitle('Register');

  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState<UserType>('homeowner');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if there's a type=housekeeper in the URL query params
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('type');
    if (type === 'housekeeper') {
      setUserType('housekeeper');
    }
  }, [location]);

  useEffect(() => {
    // Log when user type changes
    console.log(`User type set to: ${userType}`);
  }, [userType]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Make sure email is trimmed and lowercase
      const email = formData.email.trim().toLowerCase();
      
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: email,
        password: formData.password,
        userType
      };

      // First, check if the passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      console.log(`Attempting to register as ${userType}...`);
      
      const response = await authService.register(userData);
      console.log('Registration successful:', response);
      
      // Redirect to verification pending page
      navigate('/verification-pending', { state: { email: email } });
    } catch (err) {
      console.error('Registration error:', err);
      
      if (axios.isAxiosError(err) && err.response) {
        // Log more details about the error
        console.log('Error status:', err.response.status);
        console.log('Error data:', err.response.data);
        
        // Check if this is a user exists error but the account is unverified
        if (err.response.data.needsVerification) {
          setError('This account exists but is not verified. Redirecting to verification page...');
          setTimeout(() => {
            navigate('/verification-pending', { state: { email: formData.email } });
          }, 1500);
          return;
        }
        
        if (err.response.data.errors && err.response.data.errors.length > 0) {
          console.log('Validation errors:', err.response.data.errors);
          
          // Display all validation errors to the user
          const errorMessages = err.response.data.errors.map((e: any) => {
            return e.msg || e.message || JSON.stringify(e);
          }).join(', ');
          
          setError(errorMessages);
        } else if (err.response.data.message) {
          // Check if this is a "User already exists" error
          if (err.response.data.message === 'User already exists') {
            setError('An account with this email already exists. Please try logging in instead.');
          } else {
            setError(err.response.data.message);
          }
        } else {
          setError(`Registration failed: ${err.response.status} - ${err.response.statusText}`);
        }
        
        // Log the full response for debugging
        console.log('Full error response:', err.response.data);
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = 
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    formData.agreeToTerms;

  // Dynamically select the logo based on userType
  const logo = userType === 'homeowner' ? LogoBlue : LogoGreen;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-1">
          <img 
            src={logo} 
            alt="HomeServe" 
            className="mx-auto w-40 mb-1" 
          />
        </div>

        {/* User Type Toggle - Updated with Animation */}
        <div className="relative bg-gray-100 rounded-full p-1 mb-8 h-12">
          {/* Sliding indicator */}
          <div 
            className={`absolute top-1 h-10 rounded-full transition-all duration-300 ease-in-out ${
              userType === 'homeowner' 
                ? 'w-[calc(50%-0.5rem)] left-1 bg-[#133E87]' 
                : 'w-[calc(50%-0.5rem)] left-[calc(50%+0.5rem)] bg-[#137D13]'
            }`}
          />
          
          {/* Buttons container */}
          <div className="relative flex h-full w-full">
            <button
              className={`flex-1 flex items-center justify-center z-10 rounded-full text-sm transition-colors ${
                userType === 'homeowner' ? 'text-white' : 'text-gray-500'
              }`}
              onClick={() => setUserType('homeowner')}
            >
              Home Owner
            </button>
            <button
              className={`flex-1 flex items-center justify-center z-10 rounded-full text-sm transition-colors ${
                userType === 'housekeeper' ? 'text-white' : 'text-gray-500'
              }`}
              onClick={() => setUserType('housekeeper')}
            >
              Housekeeper
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-b border-gray-300 focus:outline-none ${
                  userType === 'homeowner' 
                    ? 'focus:border-[#133E87]' 
                    : 'focus:border-[#137D13]'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-b border-gray-300 focus:outline-none ${
                  userType === 'homeowner' 
                    ? 'focus:border-[#133E87]' 
                    : 'focus:border-[#137D13]'
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-b border-gray-300 focus:outline-none ${
                userType === 'homeowner' 
                  ? 'focus:border-[#133E87]' 
                  : 'focus:border-[#137D13]'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-b border-gray-300 focus:outline-none ${
                userType === 'homeowner' 
                  ? 'focus:border-[#133E87]' 
                  : 'focus:border-[#137D13]'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-b border-gray-300 focus:outline-none ${
                userType === 'homeowner' 
                  ? 'focus:border-[#133E87]' 
                  : 'focus:border-[#137D13]'
              }`}
              required
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-1 mr-2"
              required
            />
            <label className="text-sm text-gray-600">
              I agree to the{' '}
              <Link 
                to="/terms" 
                className={`${
                  userType === 'homeowner' 
                    ? 'text-[#133E87] hover:text-[#1F5CD1]' 
                    : 'text-[#137D13] hover:text-[#1FA91F]'
                }`}
              >
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link 
                to="/privacy" 
                className={`${
                  userType === 'homeowner' 
                    ? 'text-[#133E87] hover:text-[#1F5CD1]' 
                    : 'text-[#137D13] hover:text-[#1FA91F]'
                }`}
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3 px-4 rounded-full transition-colors
              ${isFormValid && !isLoading
                ? userType === 'homeowner'
                  ? 'bg-[#133E87] text-white hover:bg-[#1F5CD1]'
                  : 'bg-[#137D13] text-white hover:bg-[#1FA91F]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-600">
          Already have an account?{' '}
          <Link 
            to={`/login${userType === 'housekeeper' ? '?type=housekeeper' : ''}`} 
            className={`${
              userType === 'homeowner' 
                ? 'text-[#133E87] hover:text-[#1F5CD1]' 
                : 'text-[#137D13] hover:text-[#1FA91F]'
            }`}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
