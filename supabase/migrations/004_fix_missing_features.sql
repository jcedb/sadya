-- 1. Add category to businesses table
ALTER TABLE businesses ADD COLUMN category TEXT;

-- 2. Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    UNIQUE(user_id, business_id)
);

-- 3. Enable RLS and add policies for favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- 4. Add updated_at trigger for favorites
CREATE TRIGGER update_favorites_updated_at BEFORE UPDATE ON favorites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_business_id ON favorites(business_id);
