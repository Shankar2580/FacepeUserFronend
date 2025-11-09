import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class UpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpdateError';
  }
}

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
        // console.log removed for production
        return;
      }

      // console.log removed for production
      
      // Check if we've already shown an update alert in this session
      if (this.hasShownUpdateAlert) {
        // console.log removed for production
        return;
      }

      const updateInfo = await this.checkForUpdates();
      
      if (updateInfo.isAvailable) {
        // console.log removed for production
        this.hasShownUpdateAlert = true; // Set flag to be handled by UI
      } else {
        // console.log removed for production
      }
    } catch (error) {
      // console.error removed for production
    }
  }

  public getHasUpdateAlertBeenShown(): boolean {
    return this.hasShownUpdateAlert;
  }

  public resetUpdateAlertFlag(): void {
    this.hasShownUpdateAlert = false;
  }

  /**
   * Manually check for updates
   */
  public async checkForUpdates(): Promise<UpdateInfo> {
    try {
      if (__DEV__) {
        // console.log removed for production
        return { isAvailable: false };
      }

      if (this.isChecking) {
        // console.log removed for production
        return { isAvailable: false };
      }

      this.isChecking = true;
      // console.log removed for production

      const update = await Updates.checkForUpdateAsync();
      
      // console.log removed for production

      this.isChecking = false;
      
      return {
        isAvailable: update.isAvailable,
        manifest: update.manifest
      };
    } catch (error) {
      this.isChecking = false;
      // console.error removed for production
      throw error;
    }
  }

  /**
   * Download and install update
   */
  public async downloadAndInstallUpdate(): Promise<boolean> {
    try {
      if (__DEV__) {
        // console.log removed for production
        return false;
      }

      // console.log removed for production
      
      const result = await Updates.fetchUpdateAsync();
      
      if (result.isNew) {
        // console.log removed for production
        
        // Store that we've updated
        await AsyncStorage.setItem('app_updated', 'true');
        
        // Reload the app to apply the update
        await Updates.reloadAsync();
        return true;
      } else {
        // console.log removed for production
        return false;
      }
    } catch (error) {
      // console.error removed for production
      throw new UpdateError('Failed to download the update. Please check your internet connection and try again.');
    }
  }

  /**
   * Force check for updates with user feedback
   */
  public async manualUpdateCheck(): Promise<UpdateInfo> {
    if (this.isChecking) {
      throw new UpdateError('Update check already in progress.');
    }

    try {
      this.isChecking = true;
      const updateInfo = await this.checkForUpdates();
      this.isChecking = false;
      return updateInfo;
    } catch (error) {
      this.isChecking = false;
      // console.error removed for production
      throw new UpdateError('Unable to check for updates. Please ensure you have an internet connection.');
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
      // console.error removed for production
      return {
        isEmbeddedLaunch: true
      };
    }
  }

  /**
   * Check if the app was recently updated and clear the flag
   */
  public async checkIfRecentlyUpdated(): Promise<boolean> {
    try {
      const updated = await AsyncStorage.getItem('app_updated');
      if (updated === 'true') {
        await AsyncStorage.removeItem('app_updated');
        return true;
      }
      return false;
    } catch (error) {
      // console.error removed for production
      return false;
    }
  }

  /**
   * Show welcome message after update
   */
  public showUpdateCompleteMessage(): void {
    // This method is no longer directly called by the updateService,
    // but keeping it as it was in the original file.
    // The UI layer will handle showing the alert.
  }
}

export const updateService = UpdateService.getInstance(); 
