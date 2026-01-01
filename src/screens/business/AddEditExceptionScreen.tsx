import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAlert } from '../../contexts/AlertContext';
import { createAvailabilityException } from '../../services/businessService';
import { checkExistingBookings } from '../../services/bookingService';
import { ChevronLeft, Info, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import { format, isBefore, startOfDay, addMinutes, parse } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from '../../components/common/Input';

export const AddEditExceptionScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { businessId } = route.params;
    const { showAlert } = useAlert();

    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState(new Date());
    const [isWholeDay, setIsWholeDay] = useState(true);
    const [isClosed, setIsClosed] = useState(true);
    const [reason, setReason] = useState('');
    const [openTime, setOpenTime] = useState('12:00:00');
    const [closeTime, setCloseTime] = useState('13:00:00');

    // UI state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pickerType, setPickerType] = useState<'open' | 'close'>('open');

    const handleSave = async () => {
        // 1. Reason Validation
        if (reason.trim().length < 3) {
            showAlert({ title: 'Validation Error', message: 'Please provide a valid reason (at least 3 characters).', type: 'error' });
            return;
        }

        // 2. Past Date Validation
        if (isBefore(startOfDay(date), startOfDay(new Date()))) {
            showAlert({ title: 'Validation Error', message: 'Exceptions cannot be set for past dates.', type: 'error' });
            return;
        }

        // 3. Special Hours Time Sequence Validation
        if (!isClosed) {
            const openDate = parse(openTime, 'HH:mm:ss', new Date());
            const closeDate = parse(closeTime, 'HH:mm:ss', new Date());

            if (!isBefore(openDate, closeDate)) {
                showAlert({ title: 'Invalid Time', message: 'Opening time must be before closing time.', type: 'error' });
                return;
            }

            if (isBefore(closeDate, addMinutes(openDate, 30))) {
                showAlert({ title: 'Invalid Duration', message: 'Special operating hours must be at least 30 minutes.', type: 'error' });
                return;
            }
        }

        setIsLoading(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');

            // 4. Multiple Exceptions Support
            // We removed the strict checkDuplicateException that blocked ANY multiple exceptions.
            // Business owners can now add multiple blocks (e.g., Lunch, Meeting).

            // 5. Existing Booking Warning
            const { data: bookingCount } = await checkExistingBookings(businessId, dateStr);
            if (bookingCount && bookingCount > 0) {
                setIsLoading(false);
                showAlert({
                    title: 'Warning: Existing Bookings',
                    message: `You have ${bookingCount} confirmed/pending bookings for this date. If you proceed, you will need to manually manage these appointments. Proceed?`,
                    type: 'warning',
                    showCancel: true,
                    onConfirm: () => performSave()
                });
                return;
            }

            await performSave();
        } finally {
            setIsLoading(false);
        }
    };

    const performSave = async () => {
        setIsLoading(true);
        try {
            const exceptionData = {
                business_id: businessId,
                exception_date: format(date, 'yyyy-MM-dd'),
                is_closed: isClosed || isWholeDay,
                reason: reason.trim(),
                open_time: isWholeDay ? null : openTime,
                close_time: isWholeDay ? null : closeTime,
                created_by: businessId,
            };

            const { success, error } = await createAvailabilityException(exceptionData);
            if (success) {
                showAlert({
                    title: 'Success',
                    message: 'Availability exception saved!',
                    type: 'success',
                    onConfirm: () => navigation.goBack()
                });
            } else {
                showAlert({ title: 'Error', message: error || 'Failed to save exception', type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimeDisplay = (timeStr: string) => {
        const [h, m] = timeStr.split(':');
        const d = new Date();
        d.setHours(parseInt(h), parseInt(m));
        return format(d, 'h:mm a');
    };

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>New Exception</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoRow}>
                    <Info size={16} color={Colors.text.tertiary} />
                    <Text style={styles.infoText}>Exceptions override your normal weekly schedule for a specific date.</Text>
                </View>

                {/* Date Selection */}
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity style={styles.inputCard} onPress={() => setShowDatePicker(true)}>
                    <CalendarIcon size={20} color={Colors.primary.main} />
                    <Text style={styles.inputText}>{format(date, 'MMMM d, yyyy')}</Text>
                </TouchableOpacity>

                {/* Reason */}
                <Input
                    label="Reason / Note"
                    placeholder="e.g., Public Holiday, Staff Outing"
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    required
                />


                {/* Whole Day Toggle */}
                <View style={styles.switchRow}>
                    <View>
                        <Text style={styles.switchLabel}>Whole Day Exception</Text>
                        <Text style={styles.switchSublabel}>Toggle off to set specific hours (like lunch breaks).</Text>
                    </View>
                    <Switch
                        value={isWholeDay}
                        onValueChange={setIsWholeDay}
                        trackColor={{ false: Colors.border.primary, true: Colors.primary.main }}
                    />
                </View>

                {!isWholeDay && (
                    <>
                        {/* Toggle Closed/Open */}
                        <View style={[styles.switchRow, { borderTopWidth: 0, marginTop: 0 }]}>
                            <View>
                                <Text style={styles.switchLabel}>Closure / Blackout</Text>
                                <Text style={styles.switchSublabel}>Toggle off for special "Open" hours instead.</Text>
                            </View>
                            <Switch
                                value={isClosed}
                                onValueChange={setIsClosed}
                                trackColor={{ false: Colors.border.primary, true: Colors.primary.main }}
                            />
                        </View>

                        {/* Special Hours */}
                        <View style={styles.hoursContainer}>
                            <Text style={styles.label}>
                                {isClosed ? 'Blocked Hours' : 'Special Operating Hours'}
                            </Text>
                            <View style={styles.timeRow}>
                                <TouchableOpacity
                                    style={styles.timeButton}
                                    onPress={() => { setPickerType('open'); setShowTimePicker(true); }}
                                >
                                    <Clock size={18} color={Colors.text.secondary} />
                                    <Text style={styles.timeText}>{formatTimeDisplay(openTime)}</Text>
                                </TouchableOpacity>
                                <Text style={styles.timeSeparator}>to</Text>
                                <TouchableOpacity
                                    style={styles.timeButton}
                                    onPress={() => { setPickerType('close'); setShowTimePicker(true); }}
                                >
                                    <Clock size={18} color={Colors.text.secondary} />
                                    <Text style={styles.timeText}>{formatTimeDisplay(closeTime)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                <Button
                    title="Save Exception"
                    onPress={handleSave}
                    loading={isLoading}
                    style={styles.saveButton}
                />
            </ScrollView>


            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) setDate(selectedDate);
                    }}
                />
            )}

            {showTimePicker && (
                <DateTimePicker
                    value={parse(pickerType === 'open' ? openTime : closeTime, 'HH:mm:ss', new Date())}
                    mode="time"
                    onChange={(event, selectedTime) => {
                        setShowTimePicker(false);
                        if (selectedTime) {
                            const timeStr = format(selectedTime, 'HH:mm:ss');
                            if (pickerType === 'open') setOpenTime(timeStr);
                            else setCloseTime(timeStr);
                        }
                    }}
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.md,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.primary,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginLeft: Layout.spacing.sm,
    },
    scrollContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 40,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.background.secondary,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        marginBottom: Layout.spacing.xl,
    },
    infoText: {
        fontSize: 13,
        color: Colors.text.secondary,
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: Layout.spacing.xs,
        marginTop: Layout.spacing.lg,
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface.primary,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        gap: 12,
    },
    inputText: {
        fontSize: 16,
        color: Colors.text.primary,
    },
    textInput: {
        backgroundColor: Colors.surface.primary,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        padding: Layout.spacing.md,
        fontSize: 16,
        color: Colors.text.primary,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Layout.spacing.xl,
        paddingTop: Layout.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border.primary,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    switchSublabel: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    hoursContainer: {
        marginTop: Layout.spacing.lg,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: Layout.spacing.sm,
    },
    timeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface.primary,
        paddingVertical: 12,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        gap: 10,
    },
    timeText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    timeSeparator: {
        color: Colors.text.tertiary,
    },
    saveButton: {
        marginTop: 40,
        backgroundColor: Colors.primary.main,
    },
});
