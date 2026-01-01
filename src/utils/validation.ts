// Form Validation Utilities

export interface ValidationResult {
    isValid: boolean;
    error: string | null;
}

/**
 * Validate required field
 */
export const validateRequired = (
    value: string | null | undefined,
    fieldName: string = 'This field'
): ValidationResult => {
    if (!value || value.trim().length === 0) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true, error: null };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
    const required = validateRequired(email, 'Email');
    if (!required.isValid) return required;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true, error: null };
};

/**
 * Validate Philippine phone number
 * Accepts: 09XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
    const required = validateRequired(phone, 'Phone number');
    if (!required.isValid) return required;

    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');

    // Philippine mobile number patterns
    const patterns = [
        /^09\d{9}$/,           // 09XXXXXXXXX
        /^\+639\d{9}$/,        // +639XXXXXXXXX
        /^639\d{9}$/,          // 639XXXXXXXXX
    ];

    const isValid = patterns.some((pattern) => pattern.test(cleaned));
    if (!isValid) {
        return { isValid: false, error: 'Please enter a valid Philippine phone number' };
    }
    return { isValid: true, error: null };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): ValidationResult => {
    const required = validateRequired(password, 'Password');
    if (!required.isValid) return required;

    if (password.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters' };
    }

    // Optional: Add more rules
    // if (!/[A-Z]/.test(password)) {
    //   return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    // }
    // if (!/[0-9]/.test(password)) {
    //   return { isValid: false, error: 'Password must contain at least one number' };
    // }

    return { isValid: true, error: null };
};

/**
 * Validate password confirmation
 */
export const validatePasswordMatch = (
    password: string,
    confirmPassword: string
): ValidationResult => {
    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }
    return { isValid: true, error: null };
};

/**
 * Validate minimum length
 */
export const validateMinLength = (
    value: string,
    minLength: number,
    fieldName: string = 'This field'
): ValidationResult => {
    if (value.length < minLength) {
        return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }
    return { isValid: true, error: null };
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (
    value: string,
    maxLength: number,
    fieldName: string = 'This field'
): ValidationResult => {
    if (value.length > maxLength) {
        return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
    }
    return { isValid: true, error: null };
};

/**
 * Validate numeric value
 */
export const validateNumber = (
    value: string | number,
    fieldName: string = 'This field'
): ValidationResult => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
        return { isValid: false, error: `${fieldName} must be a valid number` };
    }
    return { isValid: true, error: null };
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (
    value: string | number,
    fieldName: string = 'This field'
): ValidationResult => {
    const numResult = validateNumber(value, fieldName);
    if (!numResult.isValid) return numResult;

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num <= 0) {
        return { isValid: false, error: `${fieldName} must be greater than 0` };
    }
    return { isValid: true, error: null };
};

/**
 * Validate price (positive number with max 2 decimal places)
 */
export const validatePrice = (
    value: string | number,
    fieldName: string = 'Price'
): ValidationResult => {
    const positiveResult = validatePositiveNumber(value, fieldName);
    if (!positiveResult.isValid) return positiveResult;

    const numStr = typeof value === 'number' ? value.toString() : value;
    const decimalMatch = numStr.match(/\.(\d+)$/);
    if (decimalMatch && decimalMatch[1].length > 2) {
        return { isValid: false, error: `${fieldName} can have at most 2 decimal places` };
    }
    return { isValid: true, error: null };
};

/**
 * Combine multiple validations
 */
export const combineValidations = (
    ...validations: ValidationResult[]
): ValidationResult => {
    for (const validation of validations) {
        if (!validation.isValid) {
            return validation;
        }
    }
    return { isValid: true, error: null };
};

/**
 * Normalize Philippine phone number to +63 format
 */
export const normalizePhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/[\s-]/g, '');

    if (cleaned.startsWith('09')) {
        return '+63' + cleaned.slice(1);
    }
    if (cleaned.startsWith('639')) {
        return '+' + cleaned;
    }
    if (cleaned.startsWith('+639')) {
        return cleaned;
    }
    return cleaned;
};
