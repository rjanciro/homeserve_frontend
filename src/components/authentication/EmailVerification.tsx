import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../components/services/auth.service';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verifyUserEmail = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        
        setTimeout(() => {
          const user = authService.getCurrentUser();
          navigate(`/${user?.userType === 'homeowner' ? 'homeowner' : 'housekeeper'}/dashboard`);
        }, 3000);
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
      }
    };

    verifyUserEmail();
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Email Verification</h2>
        
        {status === 'verifying' && (
          <div className="text-center">
            <p className="mb-4 text-gray-600">Verifying your email...</p>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <p className="mb-4 text-green-600">Your email has been successfully verified!</p>
            <p className="text-gray-600">You will be redirected to your dashboard shortly...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <p className="mb-4 text-red-600">Verification failed. The link may be invalid or expired.</p>
            <button
              onClick={() => navigate('/login')}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
