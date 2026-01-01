// Business Service - Supabase interactions for business data
import { supabase } from './supabase';
import { Business, Service, PortfolioItem, Review } from '../types/database.types';
import { BusinessWithDetails, ApiResponse, BusinessFilter } from '../types/models';

/**
 * Get list of businesses with optional filters
 */
export const getBusinesses = async (
    filter?: BusinessFilter
): Promise<ApiResponse<BusinessWithDetails[]>> => {
    try {
        let query = supabase
            .from('businesses')
            .select(`
        *,
        owner:profiles!businesses_owner_id_fkey(id, full_name, avatar_url)
      `)
            .eq('is_verified', true);

        // Apply filters
        if (filter?.searchQuery) {
            query = query.ilike('name', `%${filter.searchQuery}%`);
        }

        if (filter?.acceptsCash) {
            query = query.eq('accepts_cash', true);
        }

        if (filter?.category) {
            query = query.eq('category', filter.category);
        }

        const { data, error } = await query;

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: data as BusinessWithDetails[], error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Get full business details by ID
 */
export const getBusinessById = async (
    businessId: string
): Promise<ApiResponse<BusinessWithDetails>> => {
    try {
        const { data, error } = await supabase
            .from('businesses')
            .select(`
        *,
        owner:profiles!businesses_owner_id_fkey(id, full_name, avatar_url),
        services(*),
        reviews(*, customer:profiles!reviews_customer_id_fkey(id, full_name, avatar_url)),
        portfolio_items(*)
      `)
            .eq('id', businessId)
            .single();

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        // Calculate aggregations
        const result = data as any;
        const reviews = (result.reviews || []) as Review[];
        const reviewCount = reviews.length;
        const averageRating =
            reviewCount > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
                : 0;

        const businessWithComputed: BusinessWithDetails = {
            ...result,
            average_rating: averageRating,
            review_count: reviewCount,
        };

        return { data: businessWithComputed, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Search businesses by name
 */
export const searchBusinesses = async (
    queryText: string
): Promise<ApiResponse<Business[]>> => {
    try {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .ilike('name', `%${queryText}%`)
            .eq('is_verified', true)
            .limit(10);

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Create a new business (Owner only)
 */
export const createBusiness = async (
    businessData: Omit<Business, 'id' | 'created_at' | 'updated_at' | 'wallet_balance' | 'is_verified'>
): Promise<ApiResponse<Business>> => {
    try {
        const { data, error } = await (supabase
            .from('businesses') as any)
            .insert({
                ...businessData,
                wallet_balance: 0,
                is_verified: false
            })
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

export const updateBusiness = async (
    id: string,
    updates: Partial<Business>
): Promise<ApiResponse<Business>> => {
    try {
        const { data, error } = await (supabase
            .from('businesses') as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: data as Business, error: null, success: true };
    } catch (error: any) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};
/**
 * Get business owned by current user
 */
export const getMyBusiness = async (
    ownerId: string
): Promise<ApiResponse<BusinessWithDetails>> => {
    try {
        const { data, error } = await supabase
            .from('businesses')
            .select(`
                *,
                owner:profiles!businesses_owner_id_fkey(id, full_name, avatar_url),
                services(*),
                reviews(*),
                portfolio_items(*)
            `)
            .eq('owner_id', ownerId)
            // We only support single business per owner for now, so take the first one
            // This handles cases where bad state allowed multiple creations
            .limit(1);

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        const business = data && data.length > 0 ? data[0] : null;

        if (!business) {
            return { data: null, error: null, success: true };
        }

        // Calculate aggregations
        const result = business as any;
        const reviews = (result.reviews || []) as Review[];
        const reviewCount = reviews.length;
        const averageRating =
            reviewCount > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
                : 0;

        const businessWithComputed: BusinessWithDetails = {
            ...result,
            average_rating: averageRating,
            review_count: reviewCount,
        };

        return { data: businessWithComputed, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Get services for a business
 */
export const getServices = async (businessId: string): Promise<ApiResponse<Service[]>> => {
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('business_id', businessId)
            .order('name');

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: data as Service[], error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Create a new service
 */
export const createService = async (
    serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Service>> => {
    try {
        const { data, error } = await (supabase
            .from('services') as any)
            .insert(serviceData)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Update a service
 */
export const updateService = async (
    id: string,
    updates: Partial<Service>
): Promise<ApiResponse<Service>> => {
    try {
        const { data, error } = await (supabase
            .from('services') as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Delete a service
 */
/**
 * Delete a service
 */
export const deleteService = async (id: string): Promise<ApiResponse<null>> => {
    try {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: null, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

// --- Admin Functions ---

/**
 * Get pending businesses (Admin only)
 */
export const getPendingBusinesses = async (): Promise<ApiResponse<Business[]>> => {
    try {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('is_verified', false)
            .order('created_at', { ascending: false });

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Verify a business (Admin only)
 */
/**
 * Verify a business (Admin only)
 */
export const verifyBusiness = async (businessId: string): Promise<ApiResponse<null>> => {
    try {
        const { data, error } = await (supabase
            .from('businesses') as any)
            .update({ is_verified: true })
            .eq('id', businessId)
            .select();

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        if (!data || data.length === 0) {
            return { data: null, error: 'Permission denied: Unable to verify business. Check access rights.', success: false };
        }

        return { data: null, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Decline/Delete a business (Admin only)
 */
export const declineBusiness = async (businessId: string): Promise<ApiResponse<null>> => {
    try {
        const { count, error } = await supabase
            .from('businesses')
            .delete({ count: 'exact' })
            .eq('id', businessId);

        if (error) {
            console.error('Decline error:', error);
            return { data: null, error: error.message, success: false };
        }

        // Note: delete might not return count if RLS blocks it, similar to update
        // But let's assume if no error, it's ok, or we can check count if needed.
        // For delete, usually 'error' is populated if failed.

        return { data: null, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};
// --- Portfolio Functions ---

export const getPortfolioItems = async (businessId: string): Promise<ApiResponse<PortfolioItem[]>> => {
    try {
        const { data, error } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: data as PortfolioItem[], error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

export const createPortfolioItem = async (
    itemData: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<PortfolioItem>> => {
    try {
        const { data, error } = await (supabase
            .from('portfolio_items') as any)
            .insert(itemData)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

export const deletePortfolioItem = async (id: string): Promise<ApiResponse<null>> => {
    try {
        const { error } = await supabase
            .from('portfolio_items')
            .delete()
            .eq('id', id);

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: null, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};
// --- Business Hours & Availability Exceptions ---

export const getBusinessHours = async (businessId: string): Promise<ApiResponse<any[]>> => {
    try {
        const { data, error } = await supabase
            .from('business_hours')
            .select('*')
            .eq('business_id', businessId)
            .order('day_of_week', { ascending: true });

        if (error) throw error;
        return { data: data || [], error: null, success: true };
    } catch (error: any) {
        return { data: null, error: error.message, success: false };
    }
};

export const updateBusinessHours = async (
    id: string,
    updates: any
): Promise<ApiResponse<null>> => {
    try {
        const { error } = await (supabase
            .from('business_hours') as any)
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return { data: null, error: null, success: true };
    } catch (error: any) {
        return { data: null, error: error.message, success: false };
    }
};
export const getAvailabilityExceptions = async (businessId: string): Promise<ApiResponse<any[]>> => {
    try {
        const { data, error } = await supabase
            .from('business_availability_exceptions')
            .select('*')
            .eq('business_id', businessId)
            .order('exception_date', { ascending: true });

        if (error) throw error;
        return { data: data || [], error: null, success: true };
    } catch (error: any) {
        return { data: null, error: error.message, success: false };
    }
};

export const checkDuplicateException = async (
    businessId: string,
    date: string
): Promise<ApiResponse<boolean>> => {
    try {
        const { data, error } = await supabase
            .from('business_availability_exceptions')
            .select('id')
            .eq('business_id', businessId)
            .eq('exception_date', date)
            .maybeSingle();

        if (error) throw error;
        return { data: !!data, error: null, success: true };
    } catch (error: any) {
        return { data: false, error: error.message, success: false };
    }
};

export const createAvailabilityException = async (exceptionData: any): Promise<ApiResponse<any>> => {
    try {
        const { data, error } = await (supabase
            .from('business_availability_exceptions') as any)
            .insert(exceptionData)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null, success: true };
    } catch (error: any) {
        return { data: null, error: error.message, success: false };
    }
};

export const deleteAvailabilityException = async (id: string): Promise<ApiResponse<null>> => {
    try {
        const { error } = await supabase
            .from('business_availability_exceptions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { data: null, error: null, success: true };
    } catch (error: any) {
        return { data: null, error: error.message, success: false };
    }
};
export const initializeBusinessHours = async (businessId: string): Promise<ApiResponse<any[]>> => {
    try {
        const defaultHours = DAYS_OF_WEEK_NUMS.map(day => ({
            business_id: businessId,
            day_of_week: day,
            open_time: '09:00:00',
            close_time: '17:00:00',
            is_closed: day === 0 || day === 6 // Closed on weekends by default
        }));

        const { data, error } = await (supabase
            .from('business_hours') as any)
            .insert(defaultHours)
            .select();

        if (error) throw error;
        return { data: data || [], error: null, success: true };
    } catch (error: any) {
        return { data: null, error: error.message, success: false };
    }
};

const DAYS_OF_WEEK_NUMS = [0, 1, 2, 3, 4, 5, 6];
// --- Favorites Functions ---

export const toggleFavorite = async (userId: string, businessId: string): Promise<ApiResponse<boolean>> => {
    try {
        // Check if already favorite
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('business_id', businessId)
            .single();

        if (existing) {
            // Remove from favorites
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('id', (existing as any).id);

            if (error) return { data: null, error: error.message, success: false };
            return { data: false, error: null, success: true };
        } else {
            // Add to favorites
            const { error } = await (supabase
                .from('favorites') as any)
                .insert({
                    user_id: userId,
                    business_id: businessId
                });

            if (error) return { data: null, error: error.message, success: false };
            return { data: true, error: null, success: true };
        }
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

export const getIsFavorite = async (userId: string, businessId: string): Promise<boolean> => {
    try {
        const { data } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('business_id', businessId)
            .single();
        return !!data;
    } catch {
        return false;
    }
};
