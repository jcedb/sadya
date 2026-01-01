// Navigation Type Definitions
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { Service } from './database.types';

// Auth Stack
export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    ForgotPassword: undefined;
};

// Customer Stack
export type CustomerStackParamList = {
    CustomerTabs: undefined;
    BusinessProfile: { businessId: string; initialTab?: 'services' | 'portfolio' | 'reviews' | 'about' };
    SlotSelection: { businessId: string; serviceId: string };
    Checkout: { businessId: string; serviceId: string; startTime: string; endTime: string };
    BookingDetails: { bookingId: string };
    Favorites: undefined;
    LeaveReview: { bookingId: string; businessId: string };
};

// Business Owner Stack
export type BusinessStackParamList = {
    Dashboard: undefined;
    Services: undefined;
    ManageCoupons: undefined;
    Profile: undefined;
    CreateBusiness: undefined;
    AddEditService: { service?: Service };
    ManageSchedule: undefined;
    WalletScreen: undefined;
    TopUp: undefined;
    ServiceDetails: { serviceId?: string };
    BusinessProfile: { businessId: string; initialTab?: 'services' | 'portfolio' | 'reviews' | 'about' };
    PortfolioScreen: undefined;
    AddPortfolioItem: undefined;
    EditBusinessProfile: undefined;
    AddEditCoupon: { coupon?: any };
    AddEditException: { businessId: string; exception?: any };
    BusinessAppointments: { filter?: 'today' | 'all' } | undefined;
    BookingDetails: { bookingId: string };
};

// Admin Stack
export type AdminStackParamList = {
    AdminDashboard: undefined;
    VerifyTransaction: { transactionId: string };
    VerifyBusiness: { businessId: string };
};

// Customer Tab Navigator
export type CustomerTabParamList = {
    Home: undefined;
    Map: undefined;
    MyBookings: undefined;
    Profile: undefined;
};

// Business Tab Navigator
export type BusinessTabParamList = {
    Dashboard: undefined;
    Services: undefined;
    Coupons: undefined;
    Profile: undefined;
};

// Root Navigator
export type RootStackParamList = {
    Auth: undefined;
    Customer: undefined;
    Business: undefined;
    Admin: undefined;
    Settings: undefined;
};

// Navigation Props for Auth Screens
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
export type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;
export type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

// Navigation Props for Customer Screens
export type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<CustomerTabParamList, 'Home'>,
    StackNavigationProp<CustomerStackParamList>
>;

export type BusinessProfileScreenRouteProp = RouteProp<CustomerStackParamList, 'BusinessProfile'>;
export type BusinessProfileScreenNavigationProp = StackNavigationProp<CustomerStackParamList, 'BusinessProfile'>;

export type CheckoutScreenRouteProp = RouteProp<CustomerStackParamList, 'Checkout'>;
export type CheckoutScreenNavigationProp = StackNavigationProp<CustomerStackParamList, 'Checkout'>;

export type BookingDetailsScreenRouteProp = RouteProp<CustomerStackParamList, 'BookingDetails'>;
export type BookingDetailsScreenNavigationProp = StackNavigationProp<CustomerStackParamList, 'BookingDetails'>;

// Navigation Props for Business Screens
export type DashboardScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<BusinessTabParamList, 'Dashboard'>,
    StackNavigationProp<BusinessStackParamList>
>;

export type WalletScreenNavigationProp = StackNavigationProp<BusinessStackParamList, 'WalletScreen'>;
export type TopUpScreenNavigationProp = StackNavigationProp<BusinessStackParamList, 'TopUp'>;
