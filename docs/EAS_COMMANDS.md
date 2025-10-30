# EAS Build Commands Reference

## 🚀 **Quick Start with EAS Build**

### **1. Setup & Login**
```bash
# Install EAS CLI globally (if not installed)
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Check if you're logged in
eas whoami
```

### **2. Build Commands**
```bash
# Build APK for testing (recommended first)
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production

# Build with specific profile
eas build --platform android --profile standalone
```

### **3. Monitor & Download**
```bash
# Check build status
eas build:list

# View specific build details
eas build:view [BUILD_ID]

# Cancel a running build
eas build:cancel [BUILD_ID]
```

---

## 📋 **Your EAS Configuration**

Your `eas.json` is already configured with these profiles:

### **Preview Profile** (for testing)
```json
"preview": {
  "distribution": "internal",
  "channel": "preview",
  "android": { "buildType": "apk" }
}
```
- **Use for**: Testing, internal distribution
- **Command**: `eas build --platform android --profile preview`

### **Production Profile** (for release)
```json
"production": {
  "autoIncrement": true,
  "channel": "production", 
  "android": { "buildType": "apk" }
}
```
- **Use for**: Final release builds
- **Command**: `eas build --platform android --profile production`

---

## ⚡ **Build Process**

1. **EAS uploads your code** to their build servers
2. **Cloud builds** your APK using their infrastructure
3. **Downloads available** via EAS dashboard or direct link
4. **No local Android Studio** or SDK required!

---

## 🎯 **Recommended Workflow**

```bash
# Step 1: Login
eas login

# Step 2: Test build first
eas build --platform android --profile preview

# Step 3: Check build status
eas build:list

# Step 4: Download and test APK

# Step 5: Production build when ready
eas build --platform android --profile production
```

---

## 💡 **Pro Tips**

- **First build** takes longer (15-20 mins) - subsequent builds are faster
- **Build URLs** are shareable - great for team testing
- **Auto-increment** version numbers in production builds
- **Build caching** speeds up repeated builds
- **No local setup** required - everything happens in the cloud

---

## 🔗 **Useful Links**

- [EAS Build Dashboard](https://expo.dev/accounts/[your-username]/projects/facepe/builds)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Build Configuration](https://docs.expo.dev/build-reference/eas-json/)

---

**🎉 Your PayByFaceAI project is now ready for EAS Build!**
