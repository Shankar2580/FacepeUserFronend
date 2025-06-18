# Payment Notification System

This notification system provides comprehensive payment alerts and auto-pay functionality for the Facepe app.

## Features

### 📱 Notification Types
- **Payment Request**: When merchants request payment
- **Auto Payment**: When auto-pay processes payments automatically  
- **Payment Approved**: When payments are successfully processed
- **Payment Failed**: When payments fail with error details

### 🔄 Auto-Pay Integration
- Automatically detects merchants with auto-pay enabled
- Checks payment amounts against configured limits
- Falls back to manual approval if auto-pay fails

### 🎯 Smart Navigation
- Payment requests → Main screen for approval
- Payment status → Transaction details in history
- Fallback → History tab

## Quick Start

The notification system is automatically initialized when the app starts. No additional setup required!

## Testing

In development mode, go to **Profile → Development Tools → 🔔 Test Notifications** to test different notification types.

## Configuration

### Auto-Pay Setup
1. Go to **Profile → AutoPay Settings**
2. Add merchants with spending limits
3. Enable auto-approval for trusted merchants

### Notification Permissions
The app will request notification permissions on first launch. Users can manage these in device settings.

## Technical Details

- **Background Processing**: Checks for new requests every 30 seconds when active
- **Offline Support**: Queues notifications when network is unavailable
- **Cross-Platform**: Works on both iOS and Android
- **Secure**: All payment data is encrypted and validated server-side

## Troubleshooting

**Notifications not showing?**
- Check device notification settings
- Ensure app has notification permissions
- Verify network connectivity

**Auto-pay not working?**
- Verify merchant is configured in auto-pay settings
- Check payment amount is within limits
- Ensure merchant name matches exactly

---

For technical implementation details, see the source code in:
- `services/notificationService.ts`
- `hooks/useNotifications.ts` 