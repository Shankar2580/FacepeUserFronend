# 📱 Over-The-Air (OTA) Updates Guide

This guide explains how to push updates to your existing APK installations on both phones using Expo Updates.

## 🎯 What This Solves

- ✅ Push new features to existing APK installations
- ✅ Automatic update notifications
- ✅ Manual update checking from Profile screen
- ✅ No need to reinstall APK for JavaScript/React Native changes
- ✅ Works on both your phone and stakeholder's phone

## 🔄 How OTA Updates Work

1. **App Launch**: App automatically checks for updates
2. **Notification**: User sees "Update Available" alert
3. **Download**: User chooses to download update
4. **Install**: App restarts with new version
5. **Confirmation**: User sees "Update Complete" message

## 🚀 Publishing Updates

### Method 1: Using PowerShell Script (Recommended)

```powershell
# Basic update
.\publish-update.ps1

# With custom message
.\publish-update.ps1 -Message "Added new payment features"

# To specific channel
.\publish-update.ps1 -Channel "production" -Message "Bug fixes"
```

### Method 2: Manual EAS Command

```powershell
# Install EAS CLI (if not already installed)
npm install -g @expo/eas-cli

# Login to EAS
eas login

# Publish update
eas update --channel production --message "Your update message"
```

## 📋 Update Process Checklist

### Before Publishing
- [ ] Test changes locally
- [ ] Verify app builds without errors
- [ ] Update version in app.json if needed
- [ ] Write clear update message

### Publishing Steps
1. Open PowerShell in the PayByFaeAi directory
2. Run: `.\publish-update.ps1 -Message "Your update description"`
3. Wait for successful completion
4. Verify update is published

### After Publishing
- [ ] Test on your phone
- [ ] Inform stakeholder about update
- [ ] Monitor for any issues

## 🔧 Update Settings

### Current Configuration
- **Update Channel**: `production`
- **Auto-check**: On app launch
- **Runtime Version**: SDK Version based
- **Update URL**: `https://u.expo.dev/9e1f0d76-0db2-4b5e-b263-3fb11c9e737b`

### Manual Update Check
Users can manually check for updates:
1. Open app
2. Go to Profile tab
3. Tap "Check for Updates"
4. Follow prompts if update is available

## 📱 User Experience

### Automatic Updates
- App checks for updates on launch
- Shows alert: "🆕 Update Available"
- Options: "Later" or "Update Now"
- Downloads and installs automatically

### Manual Updates
- Tap "Check for Updates" in Profile
- Shows current status
- Initiates download if available
- Provides feedback on success/failure

## 🛠️ Technical Details

### What Can Be Updated
✅ **Can update without new APK:**
- JavaScript code changes
- React Native components
- App logic and business rules
- UI changes and styling
- API integrations
- Bug fixes

❌ **Requires new APK build:**
- Native module changes
- New permissions
- Expo SDK version updates
- New native dependencies
- App.json configuration changes affecting native code

### Update Limitations
- Updates only work with compatible runtime versions
- Large updates may take time to download
- Users must have internet connection
- App must be opened to receive updates

## 📊 Monitoring Updates

### Check Update Status
```powershell
# View recent updates
eas update:list --channel production

# View specific update
eas update:view [UPDATE_ID]
```

### Update Analytics
- Monitor adoption rates
- Track update success/failure
- User feedback on updates

## 🔍 Troubleshooting

### Common Issues

#### "No updates available"
- Verify correct channel in eas.json and app.json
- Check if update was published successfully
- Ensure app is using correct project ID

#### Update fails to download
- Check internet connection
- Verify Expo servers are accessible
- Try manual update check

#### App crashes after update
- Check console logs
- Verify update compatibility
- Rollback if needed: `eas update --channel production --rollback`

### Debug Commands
```powershell
# Check current configuration
eas update:configure

# List all updates
eas update:list

# Check project status
eas project:info
```

## 📈 Best Practices

### Update Frequency
- **Bug fixes**: Immediate
- **Minor features**: Weekly
- **Major features**: Bi-weekly
- **Critical security**: Immediate

### Update Messages
- Be clear and specific
- Mention key changes
- Keep it user-friendly
- Example: "Fixed payment processing bug and added new card validation"

### Testing Updates
1. Test locally first
2. Use preview channel for testing
3. Verify on both Android devices
4. Check different network conditions

### Communication
- Inform stakeholders before major updates
- Provide update schedules
- Document breaking changes
- Collect user feedback

## 🎉 Example Scenarios

### Scenario 1: Bug Fix
```powershell
.\publish-update.ps1 -Message "Fixed card validation issue"
```

### Scenario 2: New Feature
```powershell
.\publish-update.ps1 -Message "Added biometric authentication for payments"
```

### Scenario 3: UI Improvements
```powershell
.\publish-update.ps1 -Message "Improved payment flow and visual design"
```

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review console logs
3. Test on development build
4. Contact development team

---

## 🔗 Quick Commands

```powershell
# Publish update
.\publish-update.ps1

# Check EAS status
eas whoami

# List updates
eas update:list --channel production

# Emergency rollback
eas update --channel production --rollback
```

**Happy updating! 🚀** 