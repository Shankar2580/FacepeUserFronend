# Stripe React Native Setup Guide

## Installation

To install the Stripe React Native SDK, run:

```powershell
Set-Location PayByFaeAi
npm install @stripe/stripe-react-native
```

## Configuration

### 1. Update Stripe Configuration

Update the `constants/Stripe.ts` file with your actual Stripe keys:

```typescript
export const STRIPE_CONFIG = {
  // Replace with your Stripe publishable key
  PUBLISHABLE_KEY: 'pk_test_your_actual_publishable_key_here',
  
  // API Base URL - replace with your backend URL
  API_BASE_URL: 'http://your-backend-url:8000',
  
  // Rest of the config...
} as const;
```

### 2. Backend Requirements

Ensure your backend has Stripe secret key configured in `Backend/app/config.py`:

```python
stripe_secret_key = "sk_test_your_actual_secret_key_here"
```

### 3. Features Implemented

✅ **Setup Intent for Card Saving**: Uses `createSetupIntent` and `confirmSetupIntent` for secure card storage
✅ **Off-session Payments**: Saved cards can be used for future payments without user interaction
✅ **Card Management**: Add, view, and delete saved payment methods
✅ **Secure Token Storage**: Auth tokens are securely stored using Expo SecureStore
✅ **Modern UI Components**: Beautiful card input forms and payment method displays

### 4. Backend Endpoints Added

- `POST /users/me/payment-methods/setup-intent` - Create Setup Intent
- `POST /users/me/payment-methods/confirm-setup-intent/{setup_intent_id}` - Confirm Setup Intent and save card
- `GET /users/me/payment-methods` - Get saved payment methods
- `DELETE /users/me/payment-methods/{payment_method_id}` - Delete payment method

### 5. React Native Components Created

- `AddPaymentMethodModal.tsx` - Modal for adding new cards with Stripe CardField
- `PaymentMethodsScreen.tsx` - Screen to manage saved payment methods
- `stripeService.ts` - Service for handling Stripe API calls
- `Stripe.ts` - Configuration constants

### 6. Usage

The payment flow works as follows:

1. **Add Card**: User enters card details in `CardField` component
2. **Setup Intent**: App creates Setup Intent on backend
3. **Confirm Setup**: Stripe validates card and creates payment method
4. **Save Card**: Backend saves payment method details for future use
5. **Off-session Payments**: Saved cards can be charged without user present

### 7. Test Cards

For testing, use Stripe's test cards:
- `4242 4242 4242 4242` - Visa (succeeds)
- `4000 0000 0000 0002` - Visa (declined)
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC

### 8. Security Notes

- All card data is handled by Stripe, never stored locally
- PCI compliance handled by Stripe
- Tokens are securely stored using Expo SecureStore
- Setup Intents ensure secure card tokenization

You're correctly using Setup Intents instead of `createPaymentMethod` directly, which is the recommended approach for saving cards for future off-session payments. 