# EAS Build Cleanup Guide

## 🎯 **Build Folders Explained**

When using **EAS Build** (Expo Application Services), you don't need local build folders since builds happen in the cloud. Here's what each folder does:

### **📁 Build Folders & Their Purpose:**

| Folder/File | Purpose | Needed for EAS? | Action |
|-------------|---------|-----------------|---------|
| `dist/` | Web build output from `expo export` | ❌ No | **DELETE** |
| `android/` | Native Android project (from `expo prebuild`) | ❌ No | **DELETE** |
| `ios/` | Native iOS project (from `expo prebuild`) | ❌ No | **DELETE** |
| `web-build/` | Web build output | ❌ No | **DELETE** |
| `.expo/` | Expo development cache | ✅ Keep | Keep (auto-generated) |
| `node_modules/` | Dependencies | ✅ Keep | Keep (required) |

---

## 🗑️ **Safe to Delete for EAS Build**

Since you're using `eas build` command, you can safely delete these folders:

```bash
# These folders are NOT needed for EAS Build
dist/                    # Web export output
android/                 # Native Android (if exists)
ios/                     # Native iOS (if exists) 
web-build/              # Web build output
*.apk                   # Old APK files
apk-builds/             # Local APK build folder
```

---

## 🚀 **EAS Build Workflow**

### **Your Current Setup:**
```json
// eas.json - Your EAS configuration
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "apk" }
    }
  }
}
```

### **EAS Build Commands:**
```bash
# Login to EAS
eas login

# Build APK for testing
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Check build status
eas build:list
```

---

## 🧹 **Cleanup Script for EAS**

I'll create a cleanup script to remove unnecessary build folders:
