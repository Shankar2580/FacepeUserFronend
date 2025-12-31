/**
 * UI Components Barrel Export
 * 
 * Usage:
 * import { Button, Input, OTPInput, PINInput, AppText } from '@/components/ui';
 */

// Core Components
export { AppText, AppTextAccessible, AppTextInput, withNoFontScaling } from './AppText';
export type { TextInputProps, TextProps } from './AppText';

// Form Components
export { Button } from './Button';
export { Input } from './Input';
export { OTPInput } from './OTPInput';
export { PINInput } from './PINInput';

// Feedback Components
export { useAlert } from './AlertModal';
export { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
export { ProcessingAnimation } from './ProcessingAnimation';

// Modal Components
export { AddPaymentMethodModal } from './AddPaymentMethodModal';
export { CardSuccessModal } from './CardSuccessModal';
export { FaceRegistrationInstructionModal } from './FaceRegistrationInstructionModal';
export { FaceSuccessModal } from './FaceSuccessModal';
export { FilterModal } from './FilterModal';
export { PinVerificationModal } from './PinVerificationModal';
export { PrivacyPolicyModal } from './PrivacyPolicyModal';
export { TermsModal } from './TermsModal';

// Display Components
export { EmptyState } from './EmptyState';
export { PaymentCard } from './PaymentCard';
export { SecurityOverlay } from './SecurityOverlay';

// Utility Components
export { SimpleErrorBoundary } from './SimpleErrorBoundary';

// Default exports for convenience
export { default as AppTextDefault } from './AppText';
export { default as ButtonDefault } from './Button';
export { default as InputDefault } from './Input';
export { default as OTPInputDefault } from './OTPInput';
export { default as PINInputDefault } from './PINInput';

