import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UpdateInfo {
  isAvailable: boolean;
  manifest?: Updates.Manifest;
}

class UpdateService {
  private static instance: UpdateService;
  private isChecking = false;
  private hasShownUpdateAlert = false;

  public static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * Check for updates automatically on app start
   */
  public async checkForUpdatesOnStartup(): Promise<void> {
    try {
      if (__DEV__) {
        console.log('[UpdateService] Skipping update check in development mode');
        return;
      }

      console.log('[UpdateService] Checking for updates on startup...');
      
      // Check if we've already shown an update alert in this session
      if (this.hasShownUpdateAlert) {
        console.log('[UpdateService] Update alert already shown in this session');
        return;
      }

      const updateInfo = await this.checkForUpdates();
      
      if (updateInfo.isAvailable) {
        console.log('[UpdateService] Update available, showing notification');
        this.showUpdateAvailableAlert();
      } else {
        console.log('[UpdateService] No updates available');
      }
    } catch (error) {
      console.error('[UpdateService] Error checking for updates on startup:', error);
    }
  }

  /**
   * Manually check for updates
   */
  public async checkForUpdates(): Promise<UpdateInfo> {
    try {
      if (__DEV__) {
        console.log('[UpdateService] Updates not available in development mode');
        return { isAvailable: false };
      }

      if (this.isChecking) {
        console.log('[UpdateService] Update check already in progress');
        return { isAvailable: false };
      }

      this.isChecking = true;
      console.log('[UpdateService] Checking for updates...');

      const update = await Updates.checkForUpdateAsync();
      
      console.log('[UpdateService] Update check result:', {
        isAvailable: update.isAvailable,
        manifest: update.manifest ? 'present' : 'not present'
      });

      this.isChecking = false;
      
      return {
        isAvailable: update.isAvailable,
        manifest: update.manifest
      };
    } catch (error) {
      this.isChecking = false;
      console.error('[UpdateService] Error checking for updates:', error);
      throw error;
    }
  }

  /**
   * Download and install update
   */
  public async downloadAndInstallUpdate(): Promise<boolean> {
    try {
      if (__DEV__) {
        console.log('[UpdateService] Updates not available in development mode');
        return false;
      }

      console.log('[UpdateService] Starting update download...');
      
      // Show loading state
      Alert.alert(
        'Downloading Update',
        'Please wait while we download the latest version...',
        [],
        { cancelable: false }
      );

      const result = await Updates.fetchUpdateAsync();
      
      if (result.isNew) {
        console.log('[UpdateService] New update downloaded, reloading app...');
        
        // Store that we've updated
        await AsyncStorage.setItem('app_updated', 'true');
        
        // Reload the app to apply the update
        await Updates.reloadAsync();
        return true;
      } else {
        console.log('[UpdateService] No new update to download');
        Alert.alert('Info', 'You already have the latest version installed.');
        return false;
      }
    } catch (error) {
      console.error('[UpdateService] Error downloading/installing update:', error);
      Alert.alert(
        'Update Failed',
        'Failed to download the update. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Show update available alert with options
   */
  private showUpdateAvailableAlert(): void {
    this.hasShownUpdateAlert = true;
    
    Alert.alert(
      '🆕 Update Available',
      'A new version of the app is available with exciting new features and improvements!',
      [
        {
          text: 'Later',
          style: 'cancel',
          onPress: () => {
            console.log('[UpdateService] User chose to update later');
          }
        },
        {
          text: 'Update Now',
          style: 'default',
          onPress: async () => {
            console.log('[UpdateService] User chose to update now');
            await this.downloadAndInstallUpdate();
          }
        }
      ],
      { cancelable: true }
    );
  }

  /**
   * Force check for updates with user feedback
   */
  public async manualUpdateCheck(): Promise<void> {
    try {
      Alert.alert(
        'Checking for Updates',
        'Please wait...',
        [],
        { cancelable: false }
      );

      const updateInfo = await this.checkForUpdates();
      
      if (updateInfo.isAvailable) {
        Alert.alert(
          '🆕 Update Available',
          'A new version is available! Would you like to download and install it now?',
          [
            {
              text: 'Not Now',
              style: 'cancel'
            },
            {
              text: 'Update',
              onPress: async () => {
                await this.downloadAndInstallUpdate();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '✅ Up to Date',
          'You are already using the latest version of the app!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[UpdateService] Manual update check failed:', error);
      Alert.alert(
        'Check Failed',
        'Unable to check for updates. Please ensure you have an internet connection.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Get current update info
   */
  public async getCurrentUpdateInfo(): Promise<{
    isEmbeddedLaunch: boolean;
    updateId?: string;
    channel?: string;
    runtimeVersion?: string;
  }> {
    try {
      if (__DEV__) {
        return {
          isEmbeddedLaunch: true,
          channel: 'development',
          runtimeVersion: 'dev'
        };
      }

      const isEmbeddedLaunch = !Updates.isEmbeddedLaunch;
      const updateId = Updates.updateId || undefined;
      const channel = Updates.channel || undefined;
      const runtimeVersion = Updates.runtimeVersion || undefined;

      return {
        isEmbeddedLaunch,
        updateId,
        channel,
        runtimeVersion
      };
    } catch (error) {
      console.error('[UpdateService] Error getting update info:', error);
      return {
        isEmbeddedLaunch: true
      };
    }
  }

  /**
   * Check if app was recently updated
   */
  public async checkIfRecentlyUpdated(): Promise<boolean> {
    try {
      const wasUpdated = await AsyncStorage.getItem('app_updated');
      if (wasUpdated === 'true') {
        await AsyncStorage.removeItem('app_updated');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[UpdateService] Error checking update status:', error);
      return false;
    }
  }

  /**
   * Show welcome message after update
   */
  public showUpdateCompleteMessage(): void {
    Alert.alert(
      '🎉 Update Complete',
      'Your app has been successfully updated with the latest features and improvements!',
      [{ text: 'Awesome!' }]
    );
  }
}

export default UpdateService.getInstance(); 