// Business Context - Global state for business owner data
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Business } from '../types/database.types';
import { BusinessWithDetails } from '../types/models';
import { getMyBusiness } from '../services/businessService';
import { useAuth } from './AuthContext';

interface BusinessContextType {
    business: BusinessWithDetails | null;
    isLoading: boolean;
    refreshBusiness: () => Promise<void>;
    setBusiness: (business: BusinessWithDetails | null) => void;
    hasBusiness: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { profile, isAuthenticated } = useAuth();
    const [business, setBusiness] = useState<BusinessWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const businessRef = useRef<BusinessWithDetails | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        businessRef.current = business;
    }, [business]);

    const fetchBusiness = useCallback(async () => {
        if (!isAuthenticated || profile?.role !== 'business_owner' || !profile?.id) {
            setBusiness(null);
            setIsLoading(false);
            return;
        }

        // Only set loading true if we don't have business data yet
        if (!businessRef.current) {
            setIsLoading(true);
        }

        try {
            const { data } = await getMyBusiness(profile.id);
            setBusiness(data);
        } catch (error) {
            console.error('[BusinessContext] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, profile?.id, profile?.role]);

    useEffect(() => {
        fetchBusiness();
    }, [isAuthenticated, profile]);

    const value: BusinessContextType = {
        business,
        isLoading,
        refreshBusiness: fetchBusiness,
        setBusiness, // Expose setter for optimistic updates
        hasBusiness: !!business,
    };

    return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};

export const useBusiness = (): BusinessContextType => {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
};
