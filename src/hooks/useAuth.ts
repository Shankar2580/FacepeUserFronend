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
    // console.log removed for production
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const startTime = Date.now();
    // console.log removed for production
    
    try {
      setIsLoading(true);
      const storedUser = await apiService.getStoredUser();
      const accessToken = await apiService.getStoredToken('access_token');
      const refreshToken = await apiService.getStoredToken('refresh_token');
      
      if (storedUser && (accessToken || refreshToken)) {
        // console.log removed for production
        
        // First set the stored user data immediately
        setUser(storedUser);
        // console.log removed for production - startTime}ms)`);
        
        // If we have tokens, try to verify and refresh data
        try {
          const profile = await apiService.getProfile();
          // console.log removed for production - startTime}ms)`);
          
          // Merge API data with stored data, preserving important local state
          const mergedUser = {
            ...profile,
            has_face_registered: storedUser.has_face_registered ?? profile.has_face_registered
          };
          
          // Only update if there are actual changes
          const hasChanges = JSON.stringify(storedUser) !== JSON.stringify(mergedUser);
          if (hasChanges) {
            await apiService.updateStoredUser(mergedUser);
            setUser(mergedUser);
            // console.log removed for production - startTime}ms)`);
          } else {
            // console.log removed for production - startTime}ms)`);
          }
          
        } catch (apiError: any) {
          // console.log removed for production - startTime}ms):`, apiError);
          
          // If it's a 401 error and we have no refresh token, clear session
          if (apiError.response?.status === 401 && !refreshToken) {
            // console.log removed for production
            await apiService.logout();
            setUser(null);
          } else {
            // Keep using stored user if API fails but we have tokens - this is fine for offline usage
            // console.log removed for production
          }
        }
      } else {
        // console.log removed for production
        setUser(null);
      }
    } catch (error) {
      // console.error removed for production - startTime}ms):`, error);
      setUser(null);
    } finally {
      setIsLoading(false);
      // console.log removed for production - startTime}ms)`);
    }
  };

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      // console.log removed for production
      const response = await apiService.login(data);
      // console.log removed for production
      setUser(response.user);
      // console.log removed for production
    } finally {
      setIsLoading(false);
      // console.log removed for production
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
      // console.log removed for production
      
      // Get current stored user data (which may have face registration status)
      const storedUser = await apiService.getStoredUser();
      
      if (!storedUser) {
        // console.log removed for production
        setUser(null);
        return;
      }
      
      // Try to get updated profile from API and merge with stored data
      try {
        const profile = await apiService.getProfile();
        // console.log removed for production
        
        // Merge API data with stored data, preserving important local state
        const mergedUser = {
          ...profile,
          // Preserve face registration status from local storage if it exists
          has_face_registered: storedUser.has_face_registered ?? profile.has_face_registered
        };
        
        // Update stored data with merged info
        await apiService.updateStoredUser(mergedUser);
        setUser(mergedUser);
        
        // console.log removed for production
        
      } catch (apiError) {
        // console.log removed for production
        // If API fails but we have stored user, use stored user
        setUser(storedUser);
        // console.log removed for production
      }
    } catch (error) {
      // console.error removed for production
      // Don't clear user on refresh failure - keep existing state
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