import { supabase } from './supabase';
import { ApiResponse } from '../types/models';
import { Database } from '../types/database.types';

export type WalletTransaction = Database['public']['Tables']['wallet_transactions']['Row'];
export type WalletTransactionInsert = Database['public']['Tables']['wallet_transactions']['Insert'];

export const getWalletTransactions = async (businessId: string): Promise<ApiResponse<WalletTransaction[]>> => {
    try {
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [], error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};

export const requestTopUp = async (transaction: WalletTransactionInsert): Promise<ApiResponse<WalletTransaction>> => {
    try {
        const { data, error } = await (supabase
            .from('wallet_transactions')
            .insert(transaction as any)
            .select()
            .single() as any);

        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null as any };
    }
};

export const getWalletBalance = async (businessId: string): Promise<ApiResponse<number>> => {
    try {
        const { data, error } = await supabase
            .from('businesses')
            .select('wallet_balance')
            .eq('id', businessId)
            .single();

        const balance = (data as any)?.wallet_balance ?? 0;
        return { success: true, data: balance, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: 0 };
    }
};

// --- Admin Functions ---

export const getPendingTransactions = async (): Promise<ApiResponse<WalletTransaction[]>> => {
    try {
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select(`
                *,
                business:businesses(id, name)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false }) as any;

        if (error) throw error;
        return { success: true, data: data || [], error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};

export const verifyTransaction = async (
    transactionId: string,
    status: 'approved' | 'rejected',
    adminNotes?: string
): Promise<ApiResponse<null>> => {
    try {
        const { error } = await (supabase.rpc as any)('handle_transaction_verification', {
            p_transaction_id: transactionId,
            p_status: status,
            p_admin_notes: adminNotes || null
        });

        if (error) throw error;

        return { success: true, data: null, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};
