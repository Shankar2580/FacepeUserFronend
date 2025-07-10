# Face Registration Implementation Guide

## Overview
This document explains the face registration feature implementation for the PayByFaeAi mobile application.

## Features Implemented

### 1. Face Registration Screen
- **Location**: `app/face-registration.tsx`
- **Features**:
  - User name display (read-only, populated from user profile)
  - Direct camera access (no gallery option)
  - Image capture only
  - Face registration API integration
  - Success/Error handling

### 2. API Integration
- **Endpoint**: `POST /register` (running on port 8443)
- **Parameters**:
  - `user_id`: User's unique identifier
  - `name`: User's full name
  - `file`: Face image file
- **Response**: Returns `RegistrationResponse` with embedding ID

### 3. Service Methods
- **Location**: `services/api.ts`
- **Method**: `registerFace(userId, name, imageUri)`
- **Functionality**: Handles multipart form data upload to the API

## Installation Requirements

### Dependencies
Run the installation script to install required dependencies:
```powershell
./install-dependencies.ps1
```

Or manually install:
```bash
npm install expo-image-picker
```

### Permissions
The app requests the following permissions:
- Camera access (for taking photos)
- Media library access (for selecting from gallery)

## Usage Flow

1. **User Navigation**: User navigates to face registration screen
2. **Data Loading**: App loads user information from secure storage
3. **Name Display**: User sees their name (read-only, from registration)
4. **Camera Access**: User taps "Take Photo"
5. **Permission Request**: App requests camera permission
6. **Image Capture**: Camera opens directly for photo capture
7. **Upload Process**: Image is processed and sent to API
8. **Success/Error**: User receives feedback on registration status

## API Configuration

### Base URLs
The APIs are configured in `constants/api.ts`:
```typescript
const API_BASE_URL = 'http://192.168.148.2:8000'        // Main API (port 8000)
const FACE_API_BASE_URL = 'https://18.188.145.222:8443'   // Face registration API (port 8443)
```

### Endpoint
```typescript
REGISTER_FACE: '/register'  // Uses FACE_API_BASE_URL (port 8443)
```

## Error Handling

The implementation includes comprehensive error handling for:
- Network errors
- API response errors
- Permission denied scenarios
- Image processing failures
- Invalid user data

## Security Features

- User authentication via JWT tokens
- Secure storage of user credentials
- Image data encrypted during transmission
- Biometric data processed server-side

## Testing

### Prerequisites
1. Ensure backend API is running on port 8443
2. Update IP address in `constants/api.ts` to match your development environment
3. Install dependencies using the provided script

### Test Scenarios
1. **Happy Path**: Complete registration with camera photo
2. **Permission Denied**: Test behavior when camera permission is denied
3. **Network Error**: Test behavior when API is unreachable
4. **Invalid Data**: Test with missing user information
5. **API Format**: Test with different image formats and sizes

## Troubleshooting

### Common Issues

1. **Permissions Not Working**
   - Ensure app has camera and media library permissions
   - Check device settings for app permissions

2. **API Connection Failed**
   - Verify API is running on correct port (8443)
   - Check IP address configuration in constants/api.ts
   - Ensure device is on same network as development server

3. **Image Upload Failed**
   - Check image file size and format
   - Verify multipart form data is being sent correctly
   - Check API endpoint expects the correct field names

## Future Enhancements

Potential improvements for the face registration feature:
- Real-time face detection preview
- Multiple face angle capture
- Face quality validation
- Offline registration capability
- Biometric authentication integration 