# FacePe Security Features

## Screenshot & Screen Recording Protection

### Overview
FacePe includes advanced security features to protect sensitive payment information during card entry. These features automatically activate when users are entering card details.

### Features Implemented

#### 1. Screenshot Prevention
- **When Active**: Automatically enabled when card input field is focused
- **Behavior**: Prevents users from taking screenshots of card entry screen
- **Visual Indicator**: Shows "Screenshots disabled for your security" message
- **Platform**: Works on both iOS and Android

#### 2. Screen Recording Detection
- **When Active**: Continuously monitors for screen recording
- **Behavior**: Shows full-screen security overlay when recording is detected
- **Message**: "Screen recording detected. Please stop recording to continue adding your payment card safely."
- **Platform**: iOS (Android detection limited by platform)

#### 3. Security Overlay
- **Trigger**: Displays when screen recording is detected
- **Design**: Full-screen black overlay with security message
- **Branding**: Includes FacePe branding and security icons
- **Dismissal**: Automatically hides when recording stops

### Technical Implementation

#### Files Added:
1. `src/hooks/useScreenSecurity.ts` - Main security hook
2. `src/components/ui/SecurityOverlay.tsx` - Security overlay component

#### Files Modified:
1. `app/add-card.tsx` - Integrated security features

#### Dependencies:
- `expo-screen-capture` - For screenshot prevention and recording detection

### Usage

The security features are automatically enabled on the add-card screen. No additional configuration is required.

#### For Developers:
```typescript
import { useScreenSecurity } from '../src/hooks/useScreenSecurity';
import { SecurityOverlay } from '../src/components/ui/SecurityOverlay';

// In your component
const { isScreenRecording, isSecured } = useScreenSecurity({
  preventScreenshots: true,
  preventScreenRecording: true,
  onSecurityViolation: () => {
    // Handle security violation
  },
});

// Add the overlay
<SecurityOverlay
  visible={isScreenRecording}
  reason="recording"
  message="Custom security message"
/>
```

### Security Benefits

1. **PCI Compliance**: Helps meet payment card industry security standards
2. **User Trust**: Demonstrates commitment to protecting sensitive data
3. **Fraud Prevention**: Reduces risk of card details being captured
4. **Regulatory Compliance**: Meets banking and financial app security requirements

### User Experience

- **Seamless**: Security activates automatically without user intervention
- **Informative**: Clear messaging about security status
- **Non-intrusive**: Only shows indicators when necessary
- **Professional**: Branded security messages maintain app consistency

### Testing

To test the security features:

1. **Screenshot Prevention**: 
   - Focus on card input field
   - Try to take a screenshot
   - Verify screenshot is blocked or shows black screen

2. **Screen Recording Detection**:
   - Start screen recording on iOS device
   - Open add-card screen
   - Verify security overlay appears

### Platform Support

| Feature | iOS | Android |
|---------|-----|---------|
| Screenshot Prevention | ✅ | ✅ |
| Screen Recording Detection | ✅ | Limited |
| Security Overlay | ✅ | ✅ |

### Notes

- Screen recording detection is more reliable on iOS due to platform APIs
- Screenshot prevention works on both platforms but may vary by device
- Security features automatically disable when leaving the card entry screen
- No performance impact on app functionality
