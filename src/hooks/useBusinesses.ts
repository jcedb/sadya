// Hook for managing business data
import { useState, useCallback, useEffect } from 'react';
import { getBusinesses, getBusinessById } from '../services/businessService';
import { BusinessWithDetails, BusinessFilter } from '../types/models';

export const useBusinesses = () => {
    const [businesses, setBusinesses] = useState<BusinessWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBusinesses = useCallback(async (filter?: BusinessFilter) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: apiError, success } = await getBusinesses(filter);

            if (success && data) {
                setBusinesses(data);
            } else {
                setError(apiError || 'Failed to fetch businesses');
            }
        } catch (err) {
            console.error('[useBusinesses] fetchBusinesses unexpected error:', err);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Use a separate function for single business fetching to allow use in specific screens
    // without hooking it to the main list state automatically if not desired.
    // But for the hook, maybe we just expose the fetcher.

    return {
        businesses,
        isLoading,
        error,
        fetchBusinesses,
    };
};

export const useBusinessDetails = (businessId: string | undefined) => {
    const [business, setBusiness] = useState<BusinessWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBusiness = useCallback(async () => {
        if (!businessId) return;

        setIsLoading(true);
        setError(null);
        try {
            const { data, error: apiError, success } = await getBusinessById(businessId);

            if (success && data) {
                setBusiness(data);
            } else {
                setError(apiError || 'Failed to fetch business details');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [businessId]);

    useEffect(() => {
        fetchBusiness();
    }, [fetchBusiness]);

    return {
        business,
        isLoading,
        error,
        refresh: fetchBusiness,
    };
};
