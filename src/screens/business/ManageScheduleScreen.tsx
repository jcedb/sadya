import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Platform, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAlert } from '../../contexts/AlertContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { getBusinessHours, updateBusinessHours, getAvailabilityExceptions, deleteAvailabilityException, initializeBusinessHours } from '../../services/businessService';
import { ChevronLeft, Plus, Trash2, Clock, Calendar as CalendarIcon, Info } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse, isBefore, addMinutes } from 'date-fns';
import { checkExistingBookings } from '../../services/bookingService';

const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const ManageScheduleScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { business } = useBusiness();
    const { showAlert } = useAlert();

    const [activeTab, setActiveTab] = useState<'hours' | 'exceptions'>('hours');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hours, setHours] = useState<any[]>([]);
    const [exceptions, setExceptions] = useState<any[]>([]);

    // Time picker state
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pickerType, setPickerType] = useState<'open' | 'close'>('open');
    const [selectedHourId, setSelectedHourId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!business?.id) return;
        setIsLoading(true);
        try {
            const [hoursRes, exceptionsRes] = await Promise.all([
                getBusinessHours(business.id),
                getAvailabilityExceptions(business.id)
            ]);

            if (hoursRes.success) {
                if (hoursRes.data && hoursRes.data.length > 0) {
                    setHours(hoursRes.data);
                } else {
                    const initRes = await initializeBusinessHours(business.id);
                    if (initRes.success) setHours(initRes.data || []);
                }
            }
            if (exceptionsRes.success) setExceptions(exceptionsRes.data || []);
        } finally {
            setIsLoading(false);
        }
    }, [business?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleToggleClosed = async (hour: any) => {
        const newlyClosed = !hour.is_closed;

        if (newlyClosed) {
            // Check for existing bookings
            setIsSaving(true);
            try {
                const { data: bookingCount } = await checkExistingBookings(business!.id, undefined, hour.day_of_week);
                if (bookingCount && bookingCount > 0) {
                    showAlert({
                        title: 'Warning: Existing Bookings',
                        message: `You have ${bookingCount} confirmed/pending bookings for ${DAYS_OF_WEEK[hour.day_of_week]}. If you close this day, you will need to manually manage these appointments. Proceed?`,
                        type: 'warning',
                        showCancel: true,
                        onConfirm: () => performToggle(hour)
                    });
                    return;
                }
            } finally {
                setIsSaving(false);
            }
        }

        performToggle(hour);
    };

    const performToggle = async (hour: any) => {
        const updatedHours = hours.map(h =>
            h.id === hour.id ? { ...h, is_closed: !h.is_closed } : h
        );
        setHours(updatedHours);

        const { success } = await updateBusinessHours(hour.id, { is_closed: !hour.is_closed });
        if (!success) {
            showAlert({ title: 'Error', message: 'Failed to update hours', type: 'error' });
            fetchData();
        }
    };

    const handleTimePress = (hourId: string, type: 'open' | 'close') => {
        setSelectedHourId(hourId);
        setPickerType(type);
        setShowTimePicker(true);
    };

    const onTimeChange = async (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime && selectedHourId) {
            const timeStr = format(selectedTime, 'HH:mm:ss');
            const field = pickerType === 'open' ? 'open_time' : 'close_time';

            // Find current hour to validate
            const currentHour = hours.find(h => h.id === selectedHourId);
            if (!currentHour) return;

            const newOpen = pickerType === 'open' ? timeStr : currentHour.open_time;
            const newClose = pickerType === 'close' ? timeStr : currentHour.close_time;

            // 1. Time Sequence Validation
            const openDate = parse(newOpen, 'HH:mm:ss', new Date());
            const closeDate = parse(newClose, 'HH:mm:ss', new Date());

            if (!isBefore(openDate, closeDate)) {
                showAlert({ title: 'Invalid Time', message: 'Opening time must be before closing time.', type: 'error' });
                return;
            }

            // 2. Minimum Duration (30 mins)
            if (isBefore(closeDate, addMinutes(openDate, 30))) {
                showAlert({ title: 'Invalid Duration', message: 'Operating hours must be at least 30 minutes.', type: 'error' });
                return;
            }

            const updatedHours = hours.map(h =>
                h.id === selectedHourId ? { ...h, [field]: timeStr } : h
            );
            setHours(updatedHours);

            const { success } = await updateBusinessHours(selectedHourId, { [field]: timeStr });
            if (!success) {
                showAlert({ title: 'Error', message: 'Failed to update time', type: 'error' });
                fetchData();
            }
        }
    };

    const handleDeleteException = async (id: string) => {
        showAlert({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this availability exception?',
            type: 'warning',
            showCancel: true,
            onConfirm: async () => {
                const { success } = await deleteAvailabilityException(id);
                if (success) {
                    setExceptions(exceptions.filter(e => e.id !== id));
                } else {
                    showAlert({ title: 'Error', message: 'Failed to delete exception', type: 'error' });
                }
            }
        });
    };

    const formatTimeDisplay = (timeStr: string) => {
        if (!timeStr) return '--:--';
        try {
            return format(parse(timeStr, 'HH:mm:ss', new Date()), 'h:mm a');
        } catch (e) {
            return timeStr;
        }
    };

    if (isLoading) {
        return (
            <ScreenWrapper>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary.main} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper safeArea padded={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Manage Schedule</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'hours' && styles.activeTab]}
                    onPress={() => setActiveTab('hours')}
                >
                    <Text style={[styles.tabText, activeTab === 'hours' && styles.activeTabText]}>Weekly Hours</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'exceptions' && styles.activeTab]}
                    onPress={() => setActiveTab('exceptions')}
                >
                    <Text style={[styles.tabText, activeTab === 'exceptions' && styles.activeTabText]}>Exceptions</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {activeTab === 'hours' ? (
                    <View style={styles.section}>
                        <View style={styles.infoBox}>
                            <Info size={16} color={Colors.text.secondary} />
                            <Text style={styles.infoText}>Set your regular weekly operating hours here.</Text>
                        </View>

                        {hours.map((hour) => (
                            <View key={hour.id} style={[styles.hourRow, hour.is_closed && styles.hourRowClosed]}>
                                <View style={styles.hourInfo}>
                                    <Text style={styles.dayText}>{DAYS_OF_WEEK[hour.day_of_week]}</Text>
                                    <Text style={styles.statusText}>{hour.is_closed ? 'Closed' : 'Open'}</Text>
                                </View>

                                {!hour.is_closed && (
                                    <View style={styles.timeInputs}>
                                        <TouchableOpacity
                                            style={styles.timeButton}
                                            onPress={() => handleTimePress(hour.id, 'open')}
                                        >
                                            <Text style={styles.timeText}>{formatTimeDisplay(hour.open_time)}</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.timeSeparator}>-</Text>
                                        <TouchableOpacity
                                            style={styles.timeButton}
                                            onPress={() => handleTimePress(hour.id, 'close')}
                                        >
                                            <Text style={styles.timeText}>{formatTimeDisplay(hour.close_time)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <Switch
                                    value={!hour.is_closed}
                                    onValueChange={() => handleToggleClosed(hour)}
                                    trackColor={{ false: Colors.border.primary, true: Colors.primary.main }}
                                    thumbColor="#fff"
                                />
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>Availability Exceptions</Text>
                                <Text style={styles.sectionSubtitle}>Specific dates where you are closed or have different hours.</Text>
                            </View>
                        </View>

                        {exceptions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <CalendarIcon size={48} color={Colors.text.tertiary} />
                                <Text style={styles.emptyText}>No exceptions added yet.</Text>
                                <Button
                                    title="Add New Exception"
                                    onPress={() => navigation.navigate('AddEditException', { businessId: business?.id })}
                                    variant="outline"
                                    style={styles.emptyButton}
                                />
                            </View>
                        ) : (
                            <View>
                                <Button
                                    title="Add New Exception"
                                    onPress={() => navigation.navigate('AddEditException', { businessId: business?.id })}
                                    style={{ marginBottom: Layout.spacing.md }}
                                    variant="outline"
                                />
                                {exceptions.map((exc) => (
                                    <View key={exc.id} style={styles.exceptionCard}>
                                        <View style={styles.exceptionInfo}>
                                            <Text style={styles.exceptionDate}>{format(new Date(exc.exception_date), 'MMMM d, yyyy')}</Text>
                                            <Text style={styles.exceptionReason}>{exc.reason || 'No reason provided'}</Text>
                                            <View style={styles.statusBadge}>
                                                <Text style={styles.statusBadgeText}>
                                                    {exc.is_closed && !exc.open_time
                                                        ? 'CLOSED'
                                                        : exc.is_closed
                                                            ? `BLOCK: ${formatTimeDisplay(exc.open_time)} - ${formatTimeDisplay(exc.close_time)}`
                                                            : `${formatTimeDisplay(exc.open_time)} - ${formatTimeDisplay(exc.close_time)}`
                                                    }
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteException(exc.id)}
                                        >
                                            <Trash2 size={20} color={Colors.status.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {showTimePicker && (
                <DateTimePicker
                    value={(() => {
                        const h = hours.find(h => h.id === selectedHourId);
                        const t = pickerType === 'open' ? h?.open_time : h?.close_time;
                        return t ? parse(t, 'HH:mm:ss', new Date()) : new Date();
                    })()}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    tabs: {
        flexDirection: 'row',
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.primary,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary.main,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    activeTabText: {
        color: Colors.primary.main,
    },
    scrollContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 40,
    },
    section: {
        gap: Layout.spacing.md,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary.light + '15',
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        gap: 10,
        marginBottom: Layout.spacing.sm,
    },
    infoText: {
        fontSize: 13,
        color: Colors.text.secondary,
        flex: 1,
    },
    hourRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface.primary,
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.lg,
        borderRadius: Layout.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        gap: 8,
    },
    hourRowClosed: {
        opacity: 0.7,
        backgroundColor: Colors.background.secondary,
    },
    hourInfo: {
        flex: 1,
    },
    dayText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
        minWidth: 90,
    },
    statusText: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    timeInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeButton: {
        backgroundColor: Colors.background.primary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    timeSeparator: {
        color: Colors.text.tertiary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Layout.spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.text.tertiary,
        marginTop: 16,
    },
    emptyButton: {
        marginTop: 20,
        minWidth: 180,
    },
    exceptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface.primary,
        padding: Layout.spacing.lg,
        borderRadius: Layout.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        marginBottom: Layout.spacing.md,
    },
    exceptionInfo: {
        flex: 1,
    },
    exceptionDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    exceptionReason: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.status.pending + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 8,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.status.pending,
    },
    deleteButton: {
        padding: 8,
    },
});
