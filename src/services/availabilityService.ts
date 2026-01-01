import { supabase } from './supabase';
import { ApiResponse } from '../types/models';
import { format, addMinutes, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';

export interface TimeSlot {
    startTime: string; // ISO string
    endTime: string; // ISO string
    isAvailable: boolean;
}

/**
 * Get available slots for a business on a specific date
 */
export const getAvailableSlots = async (
    businessId: string,
    serviceId: string,
    date: Date
): Promise<ApiResponse<TimeSlot[]>> => {
    try {
        // 1. Check for specific date exceptions
        const { data: allExceptions, error: exceptionError } = await (supabase
            .from('business_availability_exceptions')
            .select('*')
            .eq('business_id', businessId)
            .eq('exception_date', format(date, 'yyyy-MM-dd')) as any);

        if (exceptionError) throw exceptionError;

        // "Whole Day Closed" check: is_closed = true and open_time is NULL
        const isWholeDayClosed = allExceptions?.some((ex: any) => ex.is_closed && !ex.open_time);
        if (isWholeDayClosed) {
            return { success: true, data: [], error: null };
        }

        // "Open Override" check: is_closed = false
        const openOverride = allExceptions?.find((ex: any) => !ex.is_closed);

        // 2. Fetch business hours for the day if no 'open' override exists
        const dayOfWeek = date.getDay();
        const { data: hoursData, error: hoursError } = await (supabase
            .from('business_hours')
            .select('*')
            .eq('business_id', businessId)
            .eq('day_of_week', dayOfWeek)
            .single() as any);

        const hours = openOverride
            ? { open_time: openOverride.open_time, close_time: openOverride.close_time, is_closed: false }
            : hoursData as any;

        if (!hours || hours.is_closed) {
            return { success: true, data: [], error: null };
        }

        // 3. Identify Blackout Periods: is_closed = true and has times
        const blackouts = allExceptions?.filter((ex: any) => ex.is_closed && ex.open_time && ex.close_time) || [];

        // 4. Fetch service duration
        const { data: serviceData, error: serviceError } = await (supabase
            .from('services')
            .select('duration_minutes')
            .eq('id', serviceId)
            .single() as any);

        const service = serviceData as any;
        if (serviceError || !service) throw new Error('Service not found');

        // 5. Fetch existing bookings
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const { data: existingBookings, error: bookingsError } = await (supabase
            .from('bookings')
            .select('start_time, end_time')
            .eq('business_id', businessId)
            .neq('status', 'cancelled')
            .neq('status', 'declined')
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd) as any);

        if (bookingsError) throw bookingsError;

        // 6. Generate slots
        const slots: TimeSlot[] = [];
        const datePart = format(date, 'yyyy-MM-dd');
        let currentSlotStart = parseISO(`${datePart}T${hours.open_time}`);
        const closeTime = parseISO(`${datePart}T${hours.close_time}`);

        while (isBefore(addMinutes(currentSlotStart, service.duration_minutes), closeTime) ||
            format(addMinutes(currentSlotStart, service.duration_minutes), 'HH:mm') === format(closeTime, 'HH:mm')) {

            const currentSlotEnd = addMinutes(currentSlotStart, service.duration_minutes);

            // Check collision with existing bookings
            const isCollidingWithBooking = (existingBookings as any[])?.some(booking => {
                const bStart = parseISO(booking.start_time);
                const bEnd = parseISO(booking.end_time);
                return isBefore(currentSlotStart, bEnd) && isAfter(currentSlotEnd, bStart);
            });

            // Check collision with Blackout Periods
            const isCollidingWithBlackout = blackouts.some((ex: any) => {
                const bStart = parseISO(`${datePart}T${ex.open_time}`);
                const bEnd = parseISO(`${datePart}T${ex.close_time}`);
                return isBefore(currentSlotStart, bEnd) && isAfter(currentSlotEnd, bStart);
            });

            // Also check if slot is in the past
            const isPast = isBefore(currentSlotStart, new Date());

            slots.push({
                startTime: currentSlotStart.toISOString(),
                endTime: currentSlotEnd.toISOString(),
                isAvailable: !isCollidingWithBooking && !isCollidingWithBlackout && !isPast
            });

            currentSlotStart = addMinutes(currentSlotStart, 30);
        }

        return { success: true, data: slots, error: null };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};
