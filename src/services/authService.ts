// Authentication Service - Direct Supabase auth operations
import { supabase } from './supabase';
import { UserRole } from '../types/database.types';
import { ApiResponse } from '../types/models';

export interface SignUpParams {
    email: string;
    password: string;
    role: UserRole;
    fullName: string;
    phoneNumber: string;
}

export interface SignInParams {
    email: string;
    password: string;
}

/**
 * Sign up a new user
 */
export const signUp = async (params: SignUpParams): Promise<ApiResponse<string>> => {
    try {
        const { email, password, role, fullName, phoneNumber } = params;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role,
                    full_name: fullName,
                    phone_number: phoneNumber,
                },
            },
        });

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        // Profile creation is now handled by the 'handle_new_user' database trigger
        // using the metadata passed in options.data

        return { data: data.user?.id ?? null, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Sign in an existing user
 */
export const signIn = async (params: SignInParams): Promise<ApiResponse<string>> => {
    try {
        const { email, password } = params;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: data.user?.id ?? null, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<ApiResponse<null>> => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: null, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Request password reset email
 */
export const resetPassword = async (email: string): Promise<ApiResponse<null>> => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'sadya://reset-password',
        });

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: null, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string): Promise<ApiResponse<null>> => {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            return { data: null, error: error.message, success: false };
        }

        return { data: null, error: null, success: true };
    } catch (error) {
        return { data: null, error: 'An unexpected error occurred', success: false };
    }
};

/**
 * Get current session
 */
export const getCurrentSession = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            return { session: null, error: error.message };
        }

        return { session: data.session, error: null };
    } catch (error) {
        return { session: null, error: 'An unexpected error occurred' };
    }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
    try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            return { user: null, error: error.message };
        }

        return { user: data.user, error: null };
    } catch (error) {
        return { user: null, error: 'An unexpected error occurred' };
    }
};
