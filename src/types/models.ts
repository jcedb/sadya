// App-specific model interfaces and utility types
import {
    Profile,
    Business,
    Service,
    Booking,
    Review,
    WalletTransaction,
    PortfolioItem,
} from './database.types';

// Extended Business with computed/joined data
export interface BusinessWithDetails extends Business {
    services?: Service[];
    reviews?: Review[];
    portfolio_items?: PortfolioItem[];
    average_rating?: number;
    review_count?: number;
    owner?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

// Extended Booking with joined data
export interface BookingWithDetails extends Booking {
    service?: Service;
    business?: Pick<Business, 'id' | 'name' | 'phone_number' | 'address_text'>;
    customer?: Pick<Profile, 'id' | 'full_name' | 'phone_number' | 'avatar_url'>;
}

// Extended WalletTransaction with business info
export interface WalletTransactionWithBusiness extends WalletTransaction {
    business?: Pick<Business, 'id' | 'name'>;
}

// Time Slot for booking
export interface TimeSlot {
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
}

// Map Marker data
export interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
}

// Form State Types
export interface LoginFormData {
    email: string;
    password: string;
}

export interface SignupFormData {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    phoneNumber: string;
    role: 'customer' | 'business_owner';
}

export interface BusinessFormData {
    name: string;
    description: string;
    category: string;
    addressText: string;
    phoneNumber: string;
    latitude?: number;
    longitude?: number;
    acceptsCash: boolean;
}

export interface ServiceFormData {
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
    salePrice?: number;
    isOnSale: boolean;
}

export interface TopUpRequestFormData {
    amount: number;
    proofImageUri: string;
}

// API Response Types
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// Filter Types
export interface BusinessFilter {
    searchQuery?: string;
    category?: string;
    minRating?: number;
    acceptsCash?: boolean;
    nearbyLatitude?: number;
    nearbyLongitude?: number;
    radiusKm?: number;
}

export interface BookingFilter {
    status?: Booking['status'];
    startDate?: Date;
    endDate?: Date;
}
