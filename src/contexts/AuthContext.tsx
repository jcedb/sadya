// Authentication Context for global auth state management
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Profile, UserRole } from '../types/database.types';

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (
        email: string,
        password: string,
        role: UserRole,
        fullName: string,
        phoneNumber: string
    ) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: string | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch profile from database
    const fetchProfile = async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }

            return data as Profile;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    };

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Get current session
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    const userProfile = await fetchProfile(currentSession.user.id);
                    setProfile(userProfile);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                // If it's a sign-in or initial session, we might want to stay in loading
                // until the profile is fetched to prevent navigation flickering
                if (newSession?.user && event !== 'SIGNED_OUT') {
                    setIsLoading(true); // Re-enter loading if we have a user but maybe no profile yet
                    setSession(newSession);
                    setUser(newSession.user);
                    const userProfile = await fetchProfile(newSession.user.id);
                    setProfile(userProfile);
                } else {
                    setSession(newSession);
                    setUser(newSession?.user ?? null);
                    setProfile(null);
                }

                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Sign in with email and password
    const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (error) {
            return { error: 'An unexpected error occurred' };
        }
    };

    // Sign up with email and password
    const signUp = async (
        email: string,
        password: string,
        role: UserRole,
        fullName: string,
        phoneNumber: string
    ): Promise<{ error: string | null }> => {
        try {
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
                return { error: error.message };
            }

            // Update profile with additional info
            if (data.user) {
                // Using type assertion since tables are not yet created
                await (supabase
                    .from('profiles') as any)
                    .update({
                        full_name: fullName,
                        phone_number: phoneNumber,
                        role,
                        updated_by: data.user.id,
                    })
                    .eq('id', data.user.id);
            }

            return { error: null };
        } catch (error) {
            return { error: 'An unexpected error occurred' };
        }
    };

    // Sign out
    const signOut = async (): Promise<void> => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setProfile(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Reset password
    const resetPassword = async (email: string): Promise<{ error: string | null }> => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (error) {
            return { error: 'An unexpected error occurred' };
        }
    };

    // Refresh profile data
    const refreshProfile = async (): Promise<void> => {
        if (user) {
            const userProfile = await fetchProfile(user.id);
            setProfile(userProfile);
        }
    };

    const value: AuthContextType = {
        user,
        session,
        profile,
        isLoading,
        isAuthenticated: !!session,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
