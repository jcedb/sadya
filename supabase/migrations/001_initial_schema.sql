-- =====================================================
-- Service Booking App - Initial Database Schema
-- Target: Supabase (PostgreSQL)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('customer', 'business_owner', 'admin');
CREATE TYPE booking_status AS ENUM ('pending_approval', 'confirmed', 'completed', 'cancelled', 'no_show', 'declined');
CREATE TYPE payment_method AS ENUM ('cash', 'digital_wallet');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
CREATE TYPE wallet_transaction_type AS ENUM ('top_up', 'commission_deduction', 'refund', 'withdrawal');
CREATE TYPE wallet_transaction_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- TABLES
-- =====================================================

-- A. Core Users: Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- B. Business Data: Businesses
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address_text TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone_number TEXT,
    accepts_cash BOOLEAN NOT NULL DEFAULT true,
    wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    commission_rate DECIMAL(4, 2) NOT NULL DEFAULT 0.10,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- B. Business Data: Business Hours
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    UNIQUE(business_id, day_of_week)
);

-- B. Business Data: Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    sale_price DECIMAL(10, 2),
    is_on_sale BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- B. Business Data: Portfolio Items
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- C. Financials: Coupons
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type discount_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    min_spend DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    usage_limit INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    UNIQUE(business_id, code)
);

-- C. Financials: Wallet Transactions (Ledger)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type wallet_transaction_type NOT NULL,
    status wallet_transaction_status NOT NULL DEFAULT 'pending',
    reference_id TEXT,
    proof_image_url TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- C. Booking: Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending_approval',
    payment_method payment_method NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    original_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    voucher_code_used TEXT,
    tip_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_total DECIMAL(10, 2) NOT NULL,
    decline_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- D. Social: Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    UNIQUE(booking_id) -- One review per booking
);

-- D. Logs: Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- TRIGGERS: Auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON business_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES: Performance Optimization
-- =====================================================

CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_location ON businesses(latitude, longitude);
CREATE INDEX idx_business_hours_business_id ON business_hours(business_id);
CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_portfolio_items_business_id ON portfolio_items(business_id);
CREATE INDEX idx_coupons_business_id ON coupons(business_id);
CREATE INDEX idx_wallet_transactions_business_id ON wallet_transactions(business_id);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_business_id ON bookings(business_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_reviews_business_id ON reviews(business_id);

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Businesses: Public read, owners can modify
CREATE POLICY "Businesses are viewable by everyone" ON businesses
    FOR SELECT USING (true);

CREATE POLICY "Business owners can insert" ON businesses
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Business owners can update own business" ON businesses
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Business owners can delete own business" ON businesses
    FOR DELETE USING (auth.uid() = owner_id);

-- Business Hours: Public read, owners can modify
CREATE POLICY "Business hours are viewable by everyone" ON business_hours
    FOR SELECT USING (true);

CREATE POLICY "Business owners can manage hours" ON business_hours
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = business_hours.business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Services: Public read, owners can modify
CREATE POLICY "Services are viewable by everyone" ON services
    FOR SELECT USING (true);

CREATE POLICY "Business owners can manage services" ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = services.business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Portfolio Items: Public read, owners can modify
CREATE POLICY "Portfolio items are viewable by everyone" ON portfolio_items
    FOR SELECT USING (true);

CREATE POLICY "Business owners can manage portfolio" ON portfolio_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = portfolio_items.business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Coupons: Public read, owners can modify
CREATE POLICY "Coupons are viewable by everyone" ON coupons
    FOR SELECT USING (true);

CREATE POLICY "Business owners can manage coupons" ON coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = coupons.business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Wallet Transactions: Owner and admin access
CREATE POLICY "Business owners can view own transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = wallet_transactions.business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Business owners can insert transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = wallet_transactions.business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Bookings: Customer and business owner access
CREATE POLICY "Customers can view own bookings" ON bookings
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Business owners can view bookings for their business" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = bookings.business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Customers can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Business owners can update bookings" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = bookings.business_id 
            AND businesses.owner_id = auth.uid()
        )
    );

-- Reviews: Public read, customers can create for own bookings
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews for own bookings" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id AND
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = reviews.booking_id 
            AND bookings.customer_id = auth.uid()
            AND bookings.status = 'completed'
        )
    );

-- Audit Logs: Read only for admins (configured separately)
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- FUNCTION: Auto-create profile on user signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name, phone_number, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- =====================================================

-- Note: Create these buckets in Supabase Dashboard -> Storage:
-- 1. "avatars" - For profile pictures (public)
-- 2. "portfolios" - For business portfolio images (public)
-- 3. "receipts" - For wallet top-up proof screenshots (private)
