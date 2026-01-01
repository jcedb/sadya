// Date/Time Utilities with Asia/Manila timezone handling
import { format, parseISO, isValid } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Manila';

/**
 * Convert UTC date string to Manila timezone Date object
 */
export const toManilaTime = (utcDateString: string): Date => {
    const date = parseISO(utcDateString);
    return toZonedTime(date, TIMEZONE);
};

/**
 * Convert local Manila time to UTC for database storage
 */
export const toUTC = (manilaDate: Date): Date => {
    return fromZonedTime(manilaDate, TIMEZONE);
};

/**
 * Format date for display (e.g., "Dec 30, 2025")
 */
export const formatDate = (dateString: string): string => {
    const date = toManilaTime(dateString);
    return format(date, 'MMM d, yyyy');
};

/**
 * Format time for display (e.g., "2:30 PM")
 */
export const formatTime = (dateString: string): string => {
    const date = toManilaTime(dateString);
    return format(date, 'h:mm a');
};

/**
 * Format date and time together (e.g., "Dec 30, 2025 at 2:30 PM")
 */
export const formatDateTime = (dateString: string): string => {
    const date = toManilaTime(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
};

/**
 * Format as full date (e.g., "Monday, December 30, 2025")
 */
export const formatFullDate = (dateString: string): string => {
    const date = toManilaTime(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
};

/**
 * Format as relative date (e.g., "Today", "Tomorrow", or "Dec 30")
 */
export const formatRelativeDate = (dateString: string): string => {
    const date = toManilaTime(dateString);
    const now = toZonedTime(new Date(), TIMEZONE);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.floor((dateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    return format(date, 'MMM d');
};

/**
 * Format time slot range (e.g., "2:30 PM - 3:30 PM")
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

/**
 * Calculate duration in minutes between two times
 */
export const getDurationMinutes = (startTime: string, endTime: string): number => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Format duration for display (e.g., "1h 30m" or "45m")
 */
export const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
};

/**
 * Check if a date string is valid
 */
export const isValidDate = (dateString: string): boolean => {
    const date = parseISO(dateString);
    return isValid(date);
};

/**
 * Get current time in Manila timezone as ISO string
 */
export const nowManila = (): Date => {
    return toZonedTime(new Date(), TIMEZONE);
};

/**
 * Create a Date object from date and time components in Manila timezone
 */
export const createManilaDate = (
    year: number,
    month: number, // 0-indexed
    day: number,
    hour: number = 0,
    minute: number = 0
): Date => {
    const date = new Date(year, month, day, hour, minute);
    return fromZonedTime(date, TIMEZONE);
};

/**
 * Get array of available hours for time picker
 */
export const getAvailableHours = (): { label: string; value: number }[] => {
    const hours: { label: string; value: number }[] = [];
    for (let i = 0; i < 24; i++) {
        const hour = i % 12 === 0 ? 12 : i % 12;
        const period = i < 12 ? 'AM' : 'PM';
        hours.push({ label: `${hour}:00 ${period}`, value: i });
    }
    return hours;
};
