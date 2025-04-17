import { useState, useEffect } from 'react';

// User interface
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'homeowner' | 'housekeeper' | 'admin';
  profileImage?: string;
}

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Use auth hook
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Initialize from localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    return {
      token,
      user: user ? JSON.parse(user) : null,
      isAuthenticated: !!token,
      loading: false
    };
  });

  // Update localStorage when auth state changes
  useEffect(() => {
    if (authState.token) {
      localStorage.setItem('token', authState.token);
    } else {
      localStorage.removeItem('token');
    }
    
    if (authState.user) {
      localStorage.setItem('user', JSON.stringify(authState.user));
    } else {
      localStorage.removeItem('user');
    }
  }, [authState.token, authState.user]);

  // Login function
  const login = (token: string, user: User) => {
    setAuthState({
      token,
      user,
      isAuthenticated: true,
      loading: false
    });
  };

  // Logout function
  const logout = () => {
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      loading: false
    });
  };

  return {
    ...authState,
    login,
    logout
  };
}; 