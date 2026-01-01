import { supabase } from './supabase';
import { ApiResponse } from '../types/models';
import { Review } from '../types/database.types';

/**
 * Create a new review
 */
export const createReview = async (
    reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
): Promise<ApiResponse<Review>> => {
    try {
        const { data, error } = await (supabase
            .from('reviews') as any)
            .insert(reviewData)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: data as Review, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null as any };
    }
};

/**
 * Get review for a specific booking
 */
export const getBookingReview = async (
    bookingId: string
): Promise<ApiResponse<Review | null>> => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                customer:profiles!reviews_customer_id_fkey(id, full_name, avatar_url)
            `)
            .eq('booking_id', bookingId)
            .maybeSingle();

        if (error) throw error;
        return { success: true, data: data as any, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

/**
 * Get reviews for a business
 */
export const getBusinessReviews = async (
    businessId: string
): Promise<ApiResponse<Review[]>> => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                customer:profiles!reviews_customer_id_fkey(id, full_name, avatar_url)
            `)
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [], error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};
