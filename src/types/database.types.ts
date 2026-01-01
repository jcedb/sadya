// TypeScript types for Supabase Database
// Generated based on PROJECT_BLUEPRINT.md schema

export type UserRole = 'customer' | 'business_owner' | 'admin';
export type BookingStatus = 'pending_approval' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'declined';
export type PaymentMethod = 'cash' | 'digital_wallet';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type DiscountType = 'percentage' | 'fixed';
export type WalletTransactionStatus = 'pending' | 'approved' | 'rejected';
export type WalletTransactionType = 'top_up' | 'commission_deduction' | 'refund' | 'withdrawal';

// Audit columns present on all tables
export interface AuditColumns {
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
}

// Core Users
export interface Profile extends AuditColumns {
    id: string;
    email: string;
    full_name: string | null;
    phone_number: string | null;
    role: UserRole;
    avatar_url: string | null;
}

// Business Data
export interface Business extends AuditColumns {
    id: string;
    owner_id: string;
    name: string;
    description: string | null;
    category: string | null;
    address_text: string | null;
    latitude: number | null;
    longitude: number | null;
    phone_number: string | null;
    accepts_cash: boolean;
    wallet_balance: number;
    commission_rate: number;
    is_verified: boolean;
    image_url: string | null;
}

export interface BusinessHours extends AuditColumns {
    id: string;
    business_id: string;
    day_of_week: number; // 0-6 (Sunday-Saturday)
    open_time: string; // Time format HH:MM:SS
    close_time: string;
    is_closed: boolean;
}

export interface Service extends AuditColumns {
    id: string;
    business_id: string;
    name: string;
    description: string | null;
    price: number;
    duration_minutes: number;
    sale_price: number | null;
    is_on_sale: boolean;
}

export interface PortfolioItem extends AuditColumns {
    id: string;
    business_id: string;
    image_url: string;
    description: string | null;
    service_id: string | null;
}

// Financials & Booking
export interface Coupon extends AuditColumns {
    id: string;
    business_id: string;
    code: string;
    discount_type: DiscountType;
    value: number;
    min_spend: number;
    usage_limit: number;
    expires_at: string;
}

export interface WalletTransaction extends AuditColumns {
    id: string;
    business_id: string;
    amount: number;
    type: WalletTransactionType;
    status: WalletTransactionStatus;
    reference_id: string | null;
    proof_image_url: string | null;
    admin_notes: string | null;
}

export interface Booking extends AuditColumns {
    id: string;
    customer_id: string;
    business_id: string;
    service_id: string;
    start_time: string;
    end_time: string;
    status: BookingStatus;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    original_price: number;
    discount_amount: number;
    voucher_code_used: string | null;
    tip_amount: number;
    platform_fee: number;
    final_total: number;
    decline_reason: string | null;
}

export interface Favorite extends AuditColumns {
    id: string;
    user_id: string;
    business_id: string;
}

// Social & Logs
export interface Review extends AuditColumns {
    id: string;
    booking_id: string;
    customer_id: string;
    business_id: string;
    rating: number; // 1-5
    comment: string | null;
}

export interface AuditLog extends AuditColumns {
    id: string;
    user_id: string;
    action: string;
    details: Record<string, unknown>;
}

// Database type for Supabase client
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
            };
            businesses: {
                Row: Business;
                Insert: Omit<Business, 'id' | 'created_at' | 'updated_at' | 'wallet_balance'>;
                Update: Partial<Omit<Business, 'id' | 'created_at' | 'updated_at'>>;
            };
            business_hours: {
                Row: BusinessHours;
                Insert: Omit<BusinessHours, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<BusinessHours, 'id' | 'created_at' | 'updated_at'>>;
            };
            services: {
                Row: Service;
                Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>;
            };
            portfolio_items: {
                Row: PortfolioItem;
                Insert: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>>;
            };
            coupons: {
                Row: Coupon;
                Insert: Omit<Coupon, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Coupon, 'id' | 'created_at' | 'updated_at'>>;
            };
            wallet_transactions: {
                Row: WalletTransaction;
                Insert: Omit<WalletTransaction, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<WalletTransaction, 'id' | 'created_at' | 'updated_at'>>;
            };
            bookings: {
                Row: Booking;
                Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at'>>;
            };
            reviews: {
                Row: Review;
                Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Review, 'id' | 'created_at' | 'updated_at'>>;
            };
            audit_logs: {
                Row: AuditLog;
                Insert: Omit<AuditLog, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<AuditLog, 'id' | 'created_at' | 'updated_at'>>;
            };
            favorites: {
                Row: Favorite;
                Insert: Omit<Favorite, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Favorite, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
        Enums: {
            user_role: UserRole;
            booking_status: BookingStatus;
            payment_method: PaymentMethod;
            payment_status: PaymentStatus;
            discount_type: DiscountType;
            wallet_transaction_type: WalletTransactionType;
            wallet_transaction_status: WalletTransactionStatus;
        };
    };
}
