import { useState, useEffect, useCallback } from 'react';
import UpdateService, { UpdateInfo } from '../services/updateService';

export interface UseUpdatesReturn {
  isCheckingForUpdates: boolean;
  isUpdating: boolean;
  checkForUpdates: () => Promise<void>;
  downloadAndInstallUpdate: () => Promise<void>;
  currentUpdateInfo: {
    isEmbeddedLaunch: boolean;
    updateId?: string;
    channel?: string;
    runtimeVersion?: string;
  } | null;
}

export const useUpdates = (): UseUpdatesReturn => {
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUpdateInfo, setCurrentUpdateInfo] = useState<{
    isEmbeddedLaunch: boolean;
    updateId?: string;
    channel?: string;
    runtimeVersion?: string;
  } | null>(null);

  // Get current update info on mount
  useEffect(() => {
    const getCurrentInfo = async () => {
      try {
        const info = await UpdateService.getCurrentUpdateInfo();
        setCurrentUpdateInfo(info);
      } catch (error) {
        console.error('Error getting current update info:', error);
      }
    };

    getCurrentInfo();
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (isCheckingForUpdates) return;
    
    try {
      setIsCheckingForUpdates(true);
      await UpdateService.manualUpdateCheck();
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsCheckingForUpdates(false);
    }
  }, [isCheckingForUpdates]);

  // Download and install update
  const downloadAndInstallUpdate = useCallback(async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      await UpdateService.downloadAndInstallUpdate();
    } catch (error) {
      console.error('Error updating:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  return {
    isCheckingForUpdates,
    isUpdating,
    checkForUpdates,
    downloadAndInstallUpdate,
    currentUpdateInfo
  };
}; 