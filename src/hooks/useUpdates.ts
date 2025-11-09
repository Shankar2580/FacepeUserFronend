import { useState, useEffect, useCallback } from 'react';
import { updateService, UpdateInfo, UpdateError } from '../services/updateService';
import { useAlert } from '../components/ui/AlertModal';

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
  AlertComponent: () => React.JSX.Element | null;
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
  const { showAlert, AlertComponent } = useAlert();

  // Get current update info on mount
  useEffect(() => {
    const getCurrentInfo = async () => {
      try {
        const info = await updateService.getCurrentUpdateInfo();
        setCurrentUpdateInfo(info);
      } catch (error) {
        // console.error removed for production
      }
    };

    const showUpdateComplete = async () => {
      const justUpdated = await updateService.checkIfRecentlyUpdated();
      if (justUpdated) {
        showAlert(
          '🎉 Update Complete',
          'Your app has been successfully updated with the latest features and improvements!',
          [{ text: 'Awesome!' }],
          'success'
        );
      }
    };

    getCurrentInfo();
    showUpdateComplete();
  }, [showAlert]);

  const handleManualUpdateCheck = useCallback(async () => {
    if (isCheckingForUpdates) return;

    try {
      setIsCheckingForUpdates(true);
      showAlert('Checking for Updates', 'Please wait...', [], 'info');
      const updateInfo = await updateService.manualUpdateCheck();

      if (updateInfo.isAvailable) {
        showAlert(
          '🆕 Update Available',
          'A new version is available! Would you like to download and install it now?',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Update',
              onPress: async () => {
                await downloadAndInstallUpdate();
              },
            },
          ]
        );
      } else {
        showAlert(
          '✅ Up to Date',
          'You are already using the latest version of the app!',
          [{ text: 'OK' }],
          'success'
        );
      }
    } catch (error) {
      if (error instanceof UpdateError) {
        showAlert('Update Failed', error.message, undefined, 'warning');
      } else {
        // console.error removed for production
      }
    } finally {
      setIsCheckingForUpdates(false);
    }
  }, [isCheckingForUpdates, showAlert]);

  // Download and install update
  const downloadAndInstallUpdate = useCallback(async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      showAlert('Downloading Update', 'Please wait while we download the latest version...', [], 'info');
      await updateService.downloadAndInstallUpdate();
    } catch (error) {
      if (error instanceof UpdateError) {
        showAlert('Update Failed', error.message, undefined, 'warning');
      } else {
        // console.error removed for production
      }
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, showAlert]);

  return {
    isCheckingForUpdates,
    isUpdating,
    checkForUpdates: handleManualUpdateCheck,
    downloadAndInstallUpdate,
    currentUpdateInfo,
    AlertComponent,
  };
}; 
