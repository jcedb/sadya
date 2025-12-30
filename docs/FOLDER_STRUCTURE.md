/src
 ├── /assets                 # Images, fonts, and static resources
 │
 ├── /components             # Reusable UI components
 │    ├── /common            # Generic components (Buttons, Inputs, Cards)
 │    │    ├── Button.tsx
 │    │    ├── Input.tsx
 │    │    └── ScreenWrapper.tsx
 │    │
 │    ├── /booking           # Booking-specific components
 │    │    ├── TimeSlotPicker.tsx
 │    │    └── BookingStatusBadge.tsx
 │    │
 │    ├── /business          # Business-related components
 │    │    ├── ServiceCard.tsx
 │    │    └── PortfolioGrid.tsx
 │    │
 │    └── /maps              # Map components
 │         └── CustomMarker.tsx
 │
 ├── /constants              # App-wide constants
 │    ├── Colors.ts          # Color palette
 │    ├── Layout.ts          # Dimensions
 │    └── Enums.ts           # Shared Enums (Roles, Statuses)
 │
 ├── /contexts               # React Contexts
 │    └── AuthContext.tsx    # Authentication State & Logic
 │
 ├── /hooks                  # Custom React Hooks (Logic Separation)
 │    ├── useAuth.ts
 │    ├── useBookings.ts
 │    ├── useWallet.ts
 │    └── useLocation.ts
 │
 ├── /navigation             # React Navigation Configuration
 │    ├── RootNavigator.tsx  # Main stack
 │    ├── TabNavigator.tsx   # Bottom tabs (Home, Bookings, Profile)
 │    └── AuthNavigator.tsx  # Login/Signup stack
 │
 ├── /screens                # Screen Components (Pages)
 │    ├── /auth              # Authentication Screens
 │    │    ├── LoginScreen.tsx
 │    │    ├── SignupScreen.tsx
 │    │    └── ForgotPasswordScreen.tsx
 │    │
 │    ├── /customer          # Customer-facing screens
 │    │    ├── HomeScreen.tsx
 │    │    ├── MapScreen.tsx
 │    │    ├── BusinessProfileScreen.tsx
 │    │    ├── CheckoutScreen.tsx
 │    │    └── BookingDetailsScreen.tsx
 │    │
 │    ├── /business          # Business Owner screens
 │    │    ├── DashboardScreen.tsx
 │    │    ├── ManageServicesScreen.tsx
 │    │    ├── ManageScheduleScreen.tsx
 │    │    ├── WalletScreen.tsx      # Wallet Dashboard
 │    │    └── TopUpRequestScreen.tsx # Manual Top-Up Form
 │    │
 │    ├── /admin             # Admin screens (Optional/Mobile)
 │    │    ├── AdminDashboardScreen.tsx
 │    │    └── VerifyTransactionScreen.tsx
 │    │
 │    └── /shared            # Shared screens
 │         ├── ProfileScreen.tsx
 │         └── SettingsScreen.tsx
 │
 ├── /services               # API & Supabase Interaction Layer
 │    ├── supabase.ts        # Supabase Client Initialization
 │    ├── authService.ts     # Login/Signup functions
 │    ├── bookingService.ts  # Booking CRUD
 │    ├── businessService.ts # Business Profile & Search
 │    ├── walletService.ts   # Top-Ups & Commission Logic
 │    └── storageService.ts  # Image Uploads (Supabase Storage)
 │
 ├── /types                  # TypeScript Definitions
 │    ├── database.types.ts  # Generated Supabase types
 │    ├── navigation.ts      # Navigation prop types
 │    └── models.ts          # App-specific interfaces
 │
 ├── /utils                  # Helper functions
 │    ├── dateTime.ts        # Date formatting (Asia/Manila)
 │    ├── currency.ts        # PHP Currency formatting
 │    └── validation.ts      # Form validation helpers
 │
 ├── App.tsx                 # Entry Point
 └── app.json                # Expo Config