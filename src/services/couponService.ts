import { supabase } from './supabase';
import { ApiResponse } from '../types/models';
import { Database } from '../types/database.types';

export type Coupon = Database['public']['Tables']['coupons']['Row'];
export type CouponInsert = Database['public']['Tables']['coupons']['Insert'];
export type CouponUpdate = Database['public']['Tables']['coupons']['Update'];

export const getCoupons = async (businessId: string): Promise<ApiResponse<Coupon[]>> => {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [], error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};

export const createCoupon = async (coupon: CouponInsert): Promise<ApiResponse<Coupon>> => {
    try {
        const { data, error } = await (supabase
            .from('coupons')
            .insert(coupon as any)
            .select()
            .single() as any);

        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null as any };
    }
};

export const updateCoupon = async (couponId: string, updates: CouponUpdate): Promise<ApiResponse<Coupon>> => {
    try {
        const { data, error } = await ((supabase
            .from('coupons') as any)
            .update(updates as any)
            .eq('id', couponId)
            .select()
            .single() as any);

        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null as any };
    }
};

export const deleteCoupon = async (couponId: string): Promise<ApiResponse<null>> => {
    try {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', couponId);

        if (error) throw error;
        return { success: true, data: null, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

export const validateCoupon = async (
    code: string,
    businessId: string,
    minSpend: number = 0
): Promise<ApiResponse<Coupon>> => {
    try {
        const { data, error } = await (supabase
            .from('coupons')
            .select('*')
            .eq('business_id', businessId)
            .eq('code', code)
            .single() as any);

        if (error) throw error;
        if (!data) throw new Error('Invalid coupon code');

        const now = new Date();
        const expiry = new Date(data.expires_at);
        if (now > expiry) {
            throw new Error('Coupon has expired');
        }

        if (minSpend < Number(data.min_spend)) {
            throw new Error(`Minimum spend of ₱${data.min_spend} required`);
        }

        return { success: true, data, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null as any };
    }
};

/**
 * Check if a customer has already used a specific coupon code
 */
export const checkCouponUsage = async (
    code: string,
    businessId: string,
    customerId: string
): Promise<ApiResponse<boolean>> => {
    try {
        const { count, error } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('customer_id', customerId)
            .eq('voucher_code_used', code)
            .neq('status', 'cancelled')
            .neq('status', 'declined'); // Don't count cancelled or declined bookings

        if (error) throw error;
        return { success: true, data: (count || 0) > 0, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: false };
    }
};
