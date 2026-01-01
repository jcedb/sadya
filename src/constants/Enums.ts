// Shared Enums matching database schema
// These should mirror the PostgreSQL enums

export enum UserRole {
    CUSTOMER = 'customer',
    BUSINESS_OWNER = 'business_owner',
    ADMIN = 'admin',
}

export enum BookingStatus {
    PENDING_APPROVAL = 'pending_approval',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
    DECLINED = 'declined',
}

export enum PaymentMethod {
    CASH = 'cash',
    DIGITAL_WALLET = 'digital_wallet',
}

export enum PaymentStatus {
    UNPAID = 'unpaid',
    PAID = 'paid',
    REFUNDED = 'refunded',
}

export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed',
}

export enum WalletTransactionType {
    TOP_UP = 'top_up',
    COMMISSION_DEDUCTION = 'commission_deduction',
    REFUND = 'refund',
    WITHDRAWAL = 'withdrawal',
}

export enum WalletTransactionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

// Day of Week (0 = Sunday, 6 = Saturday)
export enum DayOfWeek {
    SUNDAY = 0,
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6,
}

// Display labels for enums
export const BookingStatusLabels: Record<BookingStatus, string> = {
    [BookingStatus.PENDING_APPROVAL]: 'Pending Approval',
    [BookingStatus.CONFIRMED]: 'Confirmed',
    [BookingStatus.COMPLETED]: 'Completed',
    [BookingStatus.CANCELLED]: 'Cancelled',
    [BookingStatus.NO_SHOW]: 'No Show',
    [BookingStatus.DECLINED]: 'Declined',
};

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'Pay at Venue',
    [PaymentMethod.DIGITAL_WALLET]: 'GCash',
};

export const DayOfWeekLabels: Record<DayOfWeek, string> = {
    [DayOfWeek.SUNDAY]: 'Sunday',
    [DayOfWeek.MONDAY]: 'Monday',
    [DayOfWeek.TUESDAY]: 'Tuesday',
    [DayOfWeek.WEDNESDAY]: 'Wednesday',
    [DayOfWeek.THURSDAY]: 'Thursday',
    [DayOfWeek.FRIDAY]: 'Friday',
    [DayOfWeek.SATURDAY]: 'Saturday',
};

export const DayOfWeekShortLabels: Record<DayOfWeek, string> = {
    [DayOfWeek.SUNDAY]: 'Sun',
    [DayOfWeek.MONDAY]: 'Mon',
    [DayOfWeek.TUESDAY]: 'Tue',
    [DayOfWeek.WEDNESDAY]: 'Wed',
    [DayOfWeek.THURSDAY]: 'Thu',
    [DayOfWeek.FRIDAY]: 'Fri',
    [DayOfWeek.SATURDAY]: 'Sat',
};
