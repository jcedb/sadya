// PHP Currency Formatting Utilities

const PHP_LOCALE = 'en-PH';
const CURRENCY = 'PHP';

/**
 * Format number as PHP currency (e.g., "₱1,500.00")
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(PHP_LOCALE, {
        style: 'currency',
        currency: CURRENCY,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Format number as PHP currency without decimals if whole number
 */
export const formatCurrencyCompact = (amount: number): string => {
    const hasDecimals = amount % 1 !== 0;
    return new Intl.NumberFormat(PHP_LOCALE, {
        style: 'currency',
        currency: CURRENCY,
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Format as short currency (e.g., "₱1.5K" for 1500)
 */
export const formatCurrencyShort = (amount: number): string => {
    if (amount >= 1000000) {
        return `₱${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `₱${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrencyCompact(amount);
};

/**
 * Parse currency string to number (removes ₱ and commas)
 */
export const parseCurrency = (currencyString: string): number => {
    const cleaned = currencyString.replace(/[₱,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculate percentage discount
 */
export const calculateDiscount = (
    originalPrice: number,
    discountedPrice: number
): number => {
    if (originalPrice <= 0) return 0;
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

/**
 * Apply percentage discount to price
 */
export const applyPercentageDiscount = (
    price: number,
    percentage: number
): number => {
    return price - (price * percentage) / 100;
};

/**
 * Apply fixed discount to price
 */
export const applyFixedDiscount = (
    price: number,
    discount: number,
    minTotal: number = 0
): number => {
    const discounted = price - discount;
    return Math.max(discounted, minTotal);
};

/**
 * Calculate platform fee (commission)
 */
export const calculatePlatformFee = (
    amount: number,
    commissionRate: number
): number => {
    return amount * commissionRate;
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(PHP_LOCALE).format(num);
};

/**
 * Check if wallet has sufficient balance for commission
 */
export const hasSufficientBalance = (
    walletBalance: number,
    bookingAmount: number,
    commissionRate: number
): boolean => {
    const commission = calculatePlatformFee(bookingAmount, commissionRate);
    return walletBalance >= commission;
};
