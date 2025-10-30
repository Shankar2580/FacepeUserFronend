# PayByFaceAI - Project Structure

## 📁 **Clean & Organized File Structure**

```
PayByFaceAI/
├── 📁 app/                          # Expo Router - App screens & navigation
│   ├── 📁 (tabs)/                   # Tab-based navigation
│   │   ├── _layout.tsx              # Tab layout configuration
│   │   ├── index.tsx                # Home/Dashboard screen
│   │   ├── cards.tsx                # Payment cards management
│   │   ├── history.tsx              # Transaction history
│   │   └── profile.tsx              # User profile & settings
│   ├── 📁 auth/                     # Authentication screens
│   │   ├── _layout.tsx              # Auth layout
│   │   ├── login.tsx                # Login screen
│   │   ├── register.tsx             # Registration screen
│   │   ├── verification.tsx         # Phone verification
│   │   └── forgot-password/         # Password recovery
│   ├── _layout.tsx                  # Root app layout
│   ├── +not-found.tsx               # 404 error screen
│   ├── add-card.tsx                 # Add payment method
│   ├── autopay-settings.tsx         # Auto-pay configuration
│   ├── change-password.tsx          # Password change
│   ├── face-registration.tsx        # Face recognition setup
│   ├── pin-reset.tsx                # PIN reset functionality
│   ├── transaction-detail.tsx       # Transaction details view
│   └── update-face.tsx              # Update face recognition
│
├── 📁 src/                          # Source code (organized)
│   ├── 📁 components/               # Reusable UI components
│   │   ├── 📁 ui/                   # Core UI components
│   │   │   ├── AlertModal.tsx       # Alert/notification modal
│   │   │   ├── CardSuccessModal.tsx # Card addition success
│   │   │   ├── EmptyState.tsx       # Empty state component
│   │   │   ├── FaceRegistrationInstructionModal.tsx
│   │   │   ├── FaceSuccessModal.tsx # Face registration success
│   │   │   ├── IconSymbol.tsx       # Icon symbol component
│   │   │   ├── PasswordStrengthIndicator.tsx
│   │   │   ├── PaymentCard.tsx      # Payment card display
│   │   │   ├── PrivacyPolicyModal.tsx
│   │   │   ├── ProcessingAnimation.tsx
│   │   │   ├── SimpleErrorBoundary.tsx
│   │   │   ├── TabBarBackground.tsx # Tab bar styling
│   │   │   └── TermsModal.tsx       # Terms & conditions
│   │   ├── HapticTab.tsx            # Haptic feedback tabs
│   │   └── NotificationTestButton.tsx
│   │
│   ├── 📁 constants/                # App constants & configuration
│   │   ├── api.ts                   # API endpoints & URLs
│   │   ├── Colors.ts                # Color palette
│   │   ├── config.ts                # Environment configuration
│   │   ├── DesignSystem.ts          # Design system tokens
│   │   ├── Stripe.ts                # Stripe configuration
│   │   └── types.ts                 # TypeScript type definitions
│   │
│   ├── 📁 hooks/                    # Custom React hooks
│   │   ├── useAuth.ts               # Authentication logic
│   │   ├── useNotifications.ts      # Push notifications
│   │   └── useUpdates.ts            # App updates handling
│   │
│   ├── 📁 services/                 # External service integrations
│   │   ├── api.ts                   # Main API service
│   │   ├── notificationService.ts   # Push notification service
│   │   ├── stripeService.ts         # Stripe payment service
│   │   └── updateService.ts         # App update service
│   │
│   └── 📁 types/                    # TypeScript definitions
│       └── global.d.ts              # Global type declarations
│
├── 📁 assets/                       # Static assets
│   ├── 📁 images/                   # Images & icons
│   │   ├── icon.png                 # App icon
│   │   ├── adaptive-icon.png        # Android adaptive icon
│   │   ├── splash-icon.png          # Splash screen icon
│   │   ├── favicon.png              # Web favicon
│   │   ├── facerec1.png             # Face recognition guide
│   │   ├── facerec2.png             # Face recognition guide
│   │   ├── Visa.png                 # Visa card brand
│   │   ├── mastercard.png           # Mastercard brand
│   │   ├── AMX.png                  # American Express brand
│   │   └── discover.png             # Discover card brand
│   └── 📁 fonts/                    # Custom fonts
│       └── SpaceMono-Regular.ttf    # Monospace font
│
├── 📁 scripts/                      # Build & utility scripts
│   ├── remove-console-production.js # Remove console logs
│   ├── update-imports.js            # Update import paths
│   ├── clean-restart.ps1            # Clean restart script
│   ├── install-dependencies.ps1     # Dependency installer
│   ├── publish-update.ps1           # Publish app updates
│   └── reset-expo.ps1               # Reset Expo cache
│
├── 📁 docs/                         # Documentation
│   ├── README.md                    # Project overview
│   ├── STRIPE_SETUP.md              # Stripe integration guide
│   ├── FACE_REGISTRATION_GUIDE.md   # Face recognition setup
│   ├── NOTIFICATION_SYSTEM.md       # Push notifications
│   ├── UPDATE_GUIDE.md              # App update system
│   ├── PaymentCard.md               # Payment card component
│   └── api-spec.json                # API specification
│
├── 📁 .expo/                        # Expo build cache (auto-generated)
├── 📁 .git/                         # Git version control
├── 📁 .vscode/                      # VS Code settings
├── 📁 node_modules/                 # Dependencies (auto-generated)
│
├── .env                             # Environment variables (PROTECTED)
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── app.json                         # Expo app configuration
├── babel.config.js                  # Babel configuration
├── eas.json                         # Expo Application Services
├── eslint.config.js                 # ESLint configuration
├── expo-env.d.ts                    # Expo type definitions
├── package.json                     # Dependencies & scripts
├── package-lock.json                # Dependency lock file
├── tsconfig.json                    # TypeScript configuration
└── PROJECT_STRUCTURE.md             # This file
```

## 🎯 **Key Improvements Made**

### **✅ Cleaned Up:**
- ❌ Removed 15+ unused files (test scripts, unused images, etc.)
- ❌ Deleted unused React logo images
- ❌ Removed unused components (`ThemedText`, `ThemedView`, `ExternalLink`)
- ❌ Cleaned up unused hooks (`useThemeColor`, `useColorScheme`)

### **✅ Organized Structure:**
- 📁 **src/** - All source code properly organized
- 📁 **docs/** - All documentation centralized
- 📁 **scripts/** - Build and utility scripts separated
- 🔧 **Updated imports** - All import paths automatically updated

### **✅ Environment Security:**
- 🔐 **Environment variables** properly configured
- 🛡️ **Sensitive data** moved to `.env` (protected by `.gitignore`)
- 📝 **Template** provided in `.env.example`

## 🚀 **Benefits of New Structure**

1. **🧹 Cleaner Root Directory** - Only essential config files
2. **📦 Better Organization** - Logical grouping of related files
3. **🔍 Easier Navigation** - Clear separation of concerns
4. **👥 Team Collaboration** - Consistent structure for all developers
5. **🛡️ Security** - Sensitive data properly protected
6. **📈 Scalability** - Easy to add new features and components

## 🔧 **Development Workflow**

- **App Screens**: Add new screens in `app/`
- **Components**: Create reusable components in `src/components/`
- **Business Logic**: Add services in `src/services/`
- **Types**: Define types in `src/types/`
- **Configuration**: Update constants in `src/constants/`
- **Documentation**: Add docs in `docs/`

## 📝 **Import Path Examples**

```typescript
// Components
import { PaymentCard } from '@/src/components/ui/PaymentCard';

// Services
import { apiService } from '@/src/services/api';

// Constants
import { STRIPE_CONFIG } from '@/src/constants/Stripe';

// Types
import { User, PaymentMethod } from '@/src/constants/types';

// Hooks
import { useAuth } from '@/src/hooks/useAuth';
```

---

**🎉 Your PayByFaceAI project is now clean, organized, and production-ready!**
