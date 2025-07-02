# PaymentCard Component

A reusable React Native component for displaying payment cards across the application.

## Usage

```tsx
import { PaymentCard } from '../components/ui/PaymentCard';

// Basic usage with PaymentMethod data
<PaymentCard
  card={paymentMethod}
  showDefaultBadge={true}
  onPress={() => router.push('/cards')}
/>

// With controls (for cards screen)
<PaymentCard
  card={paymentMethod}
  showDefaultBadge={true}
  showControls={true}
  onSetDefault={handleSetDefault}
  onDelete={handleDeleteCard}
/>

// Preview mode (for add-card screen)
<PaymentCard
  cardDetails={cardDetails}
  variant="preview"
  isPreview={true}
/>
```

## Props

### Card Data
- `card?: PaymentMethod | null` - Payment method object from API
- `cardDetails?: { brand?, last4?, expiryMonth?, expiryYear?, complete? }` - Card details for preview mode

### Display Options
- `showDefaultBadge?: boolean` - Show "DEFAULT" badge if card is default (default: false)
- `showControls?: boolean` - Show control buttons (Set as Default, Delete) (default: false)
- `isPreview?: boolean` - Show preview-specific elements like checkmark (default: false)
- `variant?: 'default' | 'compact' | 'preview'` - Card size variant (default: 'default')

### Interaction Handlers
- `onPress?: () => void` - Called when card is pressed
- `onSetDefault?: (cardId: string) => void` - Called when "Set as Default" is pressed
- `onDelete?: (cardId: string) => void` - Called when "Delete" is pressed

### Style Overrides
- `style?: any` - Additional styles to apply to the card

## Variants

### Default
Standard card size used in home screen and cards listing.

### Compact
Slightly smaller card with reduced padding.

### Preview
Optimized for card preview in add-card screen with fixed aspect ratio.

## Features

- **Premium Design**: Realistic card appearance with gradients, shadows, and shine effects
- **Golden Chip**: Authentic-looking 3D golden chip with realistic patterns
- **Brand-based Colors**: Authentic colors for Visa, Mastercard, Amex, Discover
- **Text Shadows**: Enhanced readability with subtle text shadows
- **Gradient Backgrounds**: Beautiful linear gradients for each card brand
- **Enhanced Shadows**: Deep, realistic shadows for premium appearance
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Proper touch targets and accessibility features
- **Type Safe**: Full TypeScript support with proper type definitions

## Premium Design Features

### Visual Enhancements
- **Linear Gradients**: Each card brand has authentic gradient colors
- **3D Golden Chip**: Realistic EMV chip with golden gradient and inner patterns
- **Enhanced Shadows**: Deep shadows with increased opacity and radius
- **Text Shadows**: All text has subtle shadows for better readability
- **Shine Effect**: Subtle diagonal shine overlay for premium appearance
- **Brand Colors**: 
  - Visa: Premium blue gradient (#1e3c72 → #2a5298)
  - Mastercard: Red to orange gradient (#eb1c26 → #f79e1b)
  - Amex: Green gradient (#2e7d32 → #4caf50)
  - Discover: Orange gradient (#ff6000 → #ff8500)
  - UnionPay: Red gradient (#d32f2f → #f44336)
  - JCB: Blue gradient (#1976d2 → #2196f3)
  - Diners Club: Grey gradient (#424242 → #616161)
  - Maestro: Purple gradient (#7b1fa2 → #9c27b0)

### Technical Implementation
- Uses `expo-linear-gradient` for smooth color transitions
- Absolute positioning for chip and shine effects
- Z-index layering for proper element stacking
- **Responsive Design**: Automatically adapts for tablets and phones
- **Tablet Optimization**: Cards maintain proper aspect ratio on larger screens
- **Dynamic Sizing**: Font sizes and spacing adjust based on device type
- **Brand Recognition**: Supports 8+ major card brands with unique colors

## Benefits of Refactoring

1. **Code Reuse**: Single component used across home, cards, and add-card screens
2. **Consistency**: Ensures all cards look and behave the same
3. **Maintainability**: Changes to card design only need to be made in one place
4. **Bundle Size**: Reduces duplicate code and styling
5. **Type Safety**: Centralized type definitions prevent errors
6. **Premium UX**: Realistic card appearance enhances user trust and engagement 