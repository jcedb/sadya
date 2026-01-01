import { supabase } from './supabase';
import { ApiResponse } from '../types/models';
import { Booking, BookingStatus } from '../types/database.types';

/**
 * Create a new booking
 */
export const createBooking = async (
    bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'status'>
): Promise<ApiResponse<Booking>> => {
    try {
        // 1. Get business details for commission calculation
        const { data: business, error: bizError } = await supabase
            .from('businesses')
            .select('wallet_balance, commission_rate, accepts_cash')
            .eq('id', bookingData.business_id)
            .single();

        if (bizError) throw bizError;
        const biz = business as any;

        const commissionRate = biz.commission_rate || 0.10;
        const platformFee = bookingData.original_price * commissionRate;

        // 2. If Cash Booking, handle commission induction from business wallet
        if (bookingData.payment_method === 'cash') {
            if (biz.wallet_balance < platformFee) {
                throw new Error('Business wallet balance too low for this booking.');
            }

            // Perform transaction: Insert booking AND update wallet balance
            // In a real app, this should be a Supabase RPC or Database Transaction
            const { data, error } = await (supabase.rpc as any)('handle_cash_booking', {
                p_customer_id: bookingData.customer_id,
                p_business_id: bookingData.business_id,
                p_service_id: bookingData.service_id,
                p_start_time: bookingData.start_time,
                p_end_time: bookingData.end_time,
                p_payment_method: 'cash',
                p_original_price: bookingData.original_price,
                p_discount_amount: bookingData.discount_amount,
                p_final_total: bookingData.final_total,
                p_platform_fee: platformFee,
                p_voucher_code: bookingData.voucher_code_used || null
            });

            if (error) throw error;
            return { success: true, data: data as Booking, error: null };
        } else {
            // Digital Wallet Flow (Immediate Confirmation for now)
            const { data, error } = await (supabase
                .from('bookings')
                .insert({
                    ...bookingData,
                    status: 'confirmed',
                    platform_fee: platformFee,
                    payment_status: 'paid'
                } as any)
                .select()
                .single() as any);

            if (error) throw error;
            return { success: true, data: data as Booking, error: null };
        }
    } catch (error: any) {
        return { success: false, error: error.message, data: null as any };
    }
};

/**
 * Get bookings for a customer
 */
export const getCustomerBookings = async (
    customerId: string
): Promise<ApiResponse<any[]>> => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        business:businesses(id, name, address_text, image_url),
        service:services(id, name, duration_minutes)
      `)
            .eq('customer_id', customerId)
            .order('start_time', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [], error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};

/**
 * Get bookings for a business
 */
export const getBusinessBookings = async (
    businessId: string
): Promise<ApiResponse<any[]>> => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        customer:profiles!bookings_customer_id_fkey(id, full_name, avatar_url, phone_number),
        service:services(id, name, duration_minutes)
      `)
            .eq('business_id', businessId)
            .order('start_time', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [], error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
    bookingId: string,
    status: BookingStatus,
    declineReason?: string
): Promise<ApiResponse<null>> => {
    try {
        const { error } = await (supabase.from('bookings') as any)
            .update({
                status,
                decline_reason: declineReason || null,
            })
            .eq('id', bookingId);

        if (error) throw error;
        return { success: true, data: null, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

/**
 * Accept a booking (triggers wallet deduction if cash)
 */
export const acceptBooking = async (
    bookingId: string,
    adminId: string
): Promise<ApiResponse<null>> => {
    try {
        const { error } = await (supabase.rpc as any)('accept_booking', {
            p_booking_id: bookingId,
            p_admin_id: adminId
        });

        if (error) throw error;
        return { success: true, data: null, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

/**
 * Check if there are confirmed/pending bookings for a business on a specific date
 */
export const checkExistingBookings = async (
    businessId: string,
    date?: string,
    dayOfWeek?: number
): Promise<ApiResponse<number>> => {
    try {
        let query = supabase
            .from('bookings')
            .select('id', { count: 'exact' })
            .eq('business_id', businessId)
            .in('status', ['confirmed', 'pending_approval']);

        if (date) {
            // Check for bookings starting on this specific date
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
        } else if (dayOfWeek !== undefined) {
            // This is harder in Supabase without a custom function or fetching all
            // For simplicity, we'll just fetch upcoming bookings and filter in JS
            const tomorrow = new Date();
            tomorrow.setHours(0, 0, 0, 0);
            const { data, error } = await (query as any).gte('start_time', tomorrow.toISOString());
            if (error) throw error;

            const count = (data as any[] || []).filter(b => {
                const d = new Date(b.start_time);
                return d.getDay() === dayOfWeek;
            }).length;

            return { success: true, data: count, error: null };
        }

        const { count, error } = await query;
        if (error) throw error;
        return { success: true, data: count || 0, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: 0 };
    }
};
