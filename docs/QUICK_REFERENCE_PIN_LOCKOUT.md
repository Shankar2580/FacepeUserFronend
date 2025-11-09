# PIN Lockout System - Quick Reference Guide

## ⚠️ Usage Note
PIN verification with progressive lockout is **only used for Face Update**, not for initial face registration.

- **Face Registration**: No PIN required (user already authenticated)
- **Face Update**: PIN required (security-sensitive operation)

---

## Component Usage

### Import
```typescript
import { PinVerificationModal } from '../src/components/ui/PinVerificationModal';
```

### Basic Implementation
```typescript
const [showPinModal, setShowPinModal] = useState(false);

<PinVerificationModal
  visible={showPinModal}
  onClose={() => setShowPinModal(false)}
  onSuccess={() => {
    // PIN verified successfully
    // Proceed with your operation
  }}
  title="Verify Your PIN"
  subtitle="Enter your 4-digit PIN to continue"
/>
```

### With Forgot PIN Option
```typescript
<PinVerificationModal
  visible={showPinModal}
  onClose={() => setShowPinModal(false)}
  onSuccess={handlePinVerified}
  onForgotPin={() => {
    setShowPinModal(false);
    router.push('/reset-pin');
  }}
/>
```

---

## Lockout Levels

| Level | Trigger | Lockout Duration | Next Penalty |
|-------|---------|------------------|--------------|
| 0 | 3 failed attempts in 5 min | 15 minutes | 1 hour |
| 1 | 1 failed attempt after Level 0 | 1 hour | 24 hours |
| 2 | 1 failed attempt after Level 1 | 24 hours | Reset to Level 0 |
| 3 | After 24-hour lockout expires | Reset | 15 min again |

---

## Visual States

### Normal State (0 failed attempts)
- White background
- Purple icon
- Standard input field
- No warnings

### Warning State (2 failed attempts)
- Yellow background on warning banner
- "⚠️ Last attempt before 15-minute lockout!"
- "Forgot PIN?" link appears

### Locked State
- Color-coded by severity:
  - **Orange** (15 min): `#F59E0B`
  - **Red** (1 hour): `#EF4444`
  - **Dark Red** (24 hour): `#DC2626`
- Disabled input field
- Countdown timer
- Progress bar

---

## Error Messages

| Status Code | Message | User Action |
|-------------|---------|-------------|
| 200 | Success | Continue with flow |
| 400 | PIN not set | Redirect to PIN setup |
| 401 | Invalid PIN | Try again |
| 401 + locked_until | Lockout triggered | Wait for timer |
| 423 | Already locked | Wait for timer |
| 429 | Rate limited | Wait briefly |

---

## State Persistence

**Storage Key:** `pin_lock_state`

**Data Structure:**
```typescript
{
  isLocked: boolean,
  lockedUntil: string | null, // ISO 8601
  failedAttempts: number
}
```

**When Cleared:**
- Lock timer expires
- PIN verified successfully
- Manual AsyncStorage.removeItem('pin_lock_state')

---

## Animation & Feedback

### Shake Animation
- Triggered on wrong PIN
- 4-step sequence (200ms total)
- Horizontal shake: 10px, -10px, 10px, 0px

### Haptic Feedback
- Pattern: [100ms, 50ms pause, 100ms]
- Mobile devices only
- Fires with shake animation

### Progress Bar
- Shows remaining lockout time
- Updates every second
- Width: `(remaining / total) * 100%`

---

## Testing Checklist

### Quick Manual Test
```
1. Enter wrong PIN 3 times → 15-min lockout
2. Wait 15 min (or clear AsyncStorage)
3. Enter wrong PIN 1 time → 1-hour lockout
4. Wait 1 hour (or clear AsyncStorage)
5. Enter wrong PIN 1 time → 24-hour lockout
6. Wait 24 hours → Reset to 3 attempts
```

### Clear Lockout (Dev Only)
```typescript
// In React Native Debugger console
await AsyncStorage.removeItem('pin_lock_state');
```

Or use Expo CLI:
```bash
# Android
adb shell run-as com.yourapp.package rm /data/data/com.yourapp.package/files/RCTAsyncLocalStorage_V1/pin_lock_state

# iOS
# Use Xcode Device Manager → App Container → Delete pin_lock_state
```

---

## Common Integration Points

### Face Registration ❌ (No PIN Required)
```typescript
// app/face-registration.tsx
// PIN verification removed - user already authenticated
const handleStartRegistration = () => {
  setShowInstructionModal(true);
};
```

### Face Update ✅ (PIN Required)
```typescript
// app/update-face.tsx
const handleStartUpdate = () => {
  setShowPinModal(true);
};

const handlePinVerified = () => {
  setShowPinModal(false);
  setShowInstructionModal(true);
};
```

### Payment Authorization
```typescript
// Example for future use
const handlePayment = () => {
  setShowPinModal(true);
};

const handlePinVerified = async () => {
  setShowPinModal(false);
  await processPayment();
};
```

---

## Troubleshooting

### Issue: Timer not updating
**Cause:** Component unmounted or interval cleared  
**Fix:** Check useEffect cleanup, verify component is mounted

### Issue: Lock persists after timer expires
**Cause:** AsyncStorage not cleared  
**Fix:** Manual clear or restart app

### Issue: Shake animation not working
**Cause:** useNativeDriver not supported on web  
**Fix:** Expected - animation only works on native platforms

### Issue: Haptic feedback not working
**Cause:** Device doesn't support Vibration API  
**Fix:** Expected - gracefully degrades

---

## Performance Tips

1. **Lazy Load**: Import only when needed
2. **Memo Component**: Wrap in React.memo if parent re-renders frequently
3. **Clear Interval**: Always cleanup in useEffect return
4. **Optimize Countdown**: Use requestAnimationFrame for smoother updates (optional)

---

## Accessibility

### Screen Readers
- Icon has `accessibilityLabel`
- Error messages use `role="alert"`
- Timer updates announced via `aria-live="polite"`

### Keyboard Navigation
- Tab order: Input → Cancel → Verify
- Enter key submits when PIN complete

### High Contrast
- Sufficient color contrast ratios
- Icons supplement color coding
- Text-based feedback

---

## Security Notes

1. **Never log PIN values** (already handled in component)
2. **Store verified PIN in AsyncStorage** after success (for subsequent API calls)
3. **Clear verified PIN** on logout or app termination
4. **Lock state persists** across restarts (intentional)
5. **No PIN bypass** during lockout (enforced by disabled input)

---

## API Contract

### Request
```typescript
apiService.verifyCurrentPin(pin: string)
```

### Response Types
```typescript
// Success
{ success: true, message: string }

// Error
{
  response: {
    status: 400 | 401 | 423 | 429,
    data: {
      message: string,
      locked_until?: string // ISO 8601
    }
  }
}
```

---

## Version History

- **v1.0** (Nov 8, 2025): Initial implementation
  - Progressive 3-level lockout
  - State persistence
  - Visual countdown timer
  - Shake animation & haptic feedback

---

**For detailed implementation details, see:** `PIN_VERIFICATION_IMPLEMENTATION.md`
