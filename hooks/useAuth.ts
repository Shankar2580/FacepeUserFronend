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
    console.log('useAuth: Provider initialized, checking auth status...');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const startTime = Date.now();
    console.log('🔍 checkAuthStatus: Starting auth check...');
    
    try {
      setIsLoading(true);
      const storedUser = await apiService.getStoredUser();
      const accessToken = await apiService.getStoredToken('access_token');
      const refreshToken = await apiService.getStoredToken('refresh_token');
      
      if (storedUser && (accessToken || refreshToken)) {
        console.log('✅ checkAuthStatus: Found stored user and tokens:', `${storedUser.first_name} ${storedUser.last_name}`);
        
        // First set the stored user data immediately
        setUser(storedUser);
        console.log(`⚡ checkAuthStatus: User set immediately (${Date.now() - startTime}ms)`);
        
        // If we have tokens, try to verify and refresh data
        try {
          const profile = await apiService.getProfile();
          console.log(`🌐 checkAuthStatus: Profile fetched from API (${Date.now() - startTime}ms)`);
          
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
            console.log(`🔄 checkAuthStatus: User data updated with API changes (${Date.now() - startTime}ms)`);
          } else {
            console.log(`✓ checkAuthStatus: No changes needed (${Date.now() - startTime}ms)`);
          }
          
        } catch (apiError: any) {
          console.log(`❌ checkAuthStatus: API verification failed (${Date.now() - startTime}ms):`, apiError);
          
          // If it's a 401 error and we have no refresh token, clear session
          if (apiError.response?.status === 401 && !refreshToken) {
            console.log('🚪 checkAuthStatus: No refresh token available, clearing session');
            await apiService.logout();
            setUser(null);
          } else {
            // Keep using stored user if API fails but we have tokens - this is fine for offline usage
            console.log('📱 checkAuthStatus: Keeping stored user for offline usage');
          }
        }
      } else {
        console.log('❌ checkAuthStatus: No stored user or tokens found');
        setUser(null);
      }
    } catch (error) {
      console.error(`💥 checkAuthStatus: Failed (${Date.now() - startTime}ms):`, error);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log(`🏁 checkAuthStatus: Completed (${Date.now() - startTime}ms)`);
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
      console.log('Starting user refresh...');
      
      // Get current stored user data (which may have face registration status)
      const storedUser = await apiService.getStoredUser();
      
      if (!storedUser) {
        console.log('No stored user found during refresh');
        setUser(null);
        return;
      }
      
      // Try to get updated profile from API and merge with stored data
      try {
        const profile = await apiService.getProfile();
        console.log('Profile refresh from API successful');
        
        // Merge API data with stored data, preserving important local state
        const mergedUser = {
          ...profile,
          // Preserve face registration status from local storage if it exists
          has_face_registered: storedUser.has_face_registered ?? profile.has_face_registered
        };
        
        // Update stored data with merged info
        await apiService.updateStoredUser(mergedUser);
        setUser(mergedUser);
        
        console.log('User refreshed successfully:', {
          name: `${mergedUser.first_name} ${mergedUser.last_name}`,
          email: mergedUser.email,
          face_registered: mergedUser.has_face_registered,
          is_active: mergedUser.is_active
        });
        
      } catch (apiError) {
        console.log('API refresh failed, keeping stored user data:', apiError);
        // If API fails but we have stored user, use stored user
        setUser(storedUser);
        console.log('Using stored user data during refresh failure');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
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