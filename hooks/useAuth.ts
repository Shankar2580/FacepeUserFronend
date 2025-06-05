import { useState, useEffect, createContext, useContext } from 'react';
import { User, LoginRequest, RegisterRequest } from '../constants/types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUser = await apiService.getStoredUser();
      if (storedUser) {
        // Verify token is still valid
        const profile = await apiService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      console.log('Auth hook - Starting login...');
      const response = await apiService.login(data);
      console.log('Auth hook - Login response received:', !!response.user);
      setUser(response.user);
      console.log('Auth hook - User state updated:', !!response.user);
    } finally {
      setIsLoading(false);
      console.log('Auth hook - Login loading finished');
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await apiService.register(data);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const profile = await apiService.getProfile();
      setUser(profile);
    } catch (error) {
      console.log('Failed to refresh user:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };
};

export { AuthContext }; 