import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAlert } from '../../contexts/AlertContext';
import { getAvailableSlots, TimeSlot } from '../../services/availabilityService';
import { getBusinessById } from '../../services/businessService';
import { CustomerStackParamList } from '../../types/navigation';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, Info, Clock, Calendar as CalendarIcon } from 'lucide-react-native';

type SlotSelectionRouteProp = RouteProp<CustomerStackParamList, 'SlotSelection'>;

export const SlotSelectionScreen: React.FC = () => {
    const route = useRoute<SlotSelectionRouteProp>();
    const navigation = useNavigation<any>();
    const { businessId, serviceId } = route.params;
    const { showAlert } = useAlert();

    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [business, setBusiness] = useState<any>(null);
    const [service, setService] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: bizData } = await getBusinessById(businessId);
            setBusiness(bizData);

            const foundService = bizData?.services?.find((s: any) => s.id === serviceId);
            setService(foundService);

            await fetchSlots(selectedDate);
        } catch (error) {
            showAlert({ title: 'Error', message: 'Failed to load availability', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [businessId, serviceId, selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchSlots = async (dateStr: string) => {
        const { data, success } = await getAvailableSlots(businessId, serviceId, new Date(dateStr));
        if (success && data) {
            setSlots(data);
        }
    };

    const handleDateSelect = async (day: any) => {
        const dateStr = day.dateString;
        setSelectedDate(dateStr);
        setSelectedSlot(null);

        setIsLoadingSlots(true);
        try {
            await fetchSlots(dateStr);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleContinue = () => {
        if (!selectedSlot) return;
        navigation.navigate('Checkout', {
            businessId,
            serviceId,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
        });
    };

    if (isLoading && !business) {
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
            {/* Standard Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Select Date & Time</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    {/* Service Info Brief */}
                    <View style={styles.serviceBrief}>
                        <View style={styles.serviceIconContainer}>
                            <Clock size={20} color={Colors.primary.main} />
                        </View>
                        <View>
                            <Text style={styles.serviceName}>{service?.name}</Text>
                            <Text style={styles.serviceDuration}>{service?.duration_minutes} Minutes</Text>
                        </View>
                    </View>

                    {/* Calendar */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Select Date</Text>
                        </View>
                        <Calendar
                            current={selectedDate}
                            minDate={format(new Date(), 'yyyy-MM-dd')}
                            onDayPress={handleDateSelect}
                            markedDates={{
                                [selectedDate]: { selected: true, selectedColor: Colors.primary.main }
                            }}
                            theme={{
                                backgroundColor: Colors.background.primary,
                                calendarBackground: Colors.background.primary,
                                textSectionTitleColor: Colors.text.secondary,
                                selectedDayBackgroundColor: Colors.primary.main,
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: Colors.primary.main,
                                dayTextColor: Colors.text.primary,
                                textDisabledColor: Colors.text.tertiary,
                                dotColor: Colors.primary.main,
                                selectedDotColor: '#ffffff',
                                arrowColor: Colors.primary.main,
                                disabledArrowColor: Colors.text.tertiary,
                                monthTextColor: Colors.text.primary,
                                indicatorColor: Colors.primary.main,
                                textMonthFontWeight: 'bold',
                            }}
                            style={styles.calendar}
                        />
                    </View>

                    {/* Slots */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Available Slots</Text>
                            {isLoadingSlots && <ActivityIndicator size="small" color={Colors.primary.main} />}
                        </View>
                        <View style={styles.slotsContainer}>
                            {slots.length > 0 ? (
                                slots.map((slot, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        disabled={!slot.isAvailable}
                                        onPress={() => setSelectedSlot(slot)}
                                        style={[
                                            styles.slotCard,
                                            !slot.isAvailable && styles.slotDisabled,
                                            selectedSlot?.startTime === slot.startTime && styles.slotSelected
                                        ]}
                                    >
                                        <View style={styles.slotTimeContainer}>
                                            <Clock size={16} color={selectedSlot?.startTime === slot.startTime ? '#fff' : (slot.isAvailable ? Colors.primary.main : Colors.text.tertiary)} />
                                            <Text style={[
                                                styles.slotTimeText,
                                                !slot.isAvailable && styles.slotTextDisabled,
                                                selectedSlot?.startTime === slot.startTime && styles.slotTextSelected
                                            ]}>
                                                {format(parseISO(slot.startTime), 'h:mm a')}
                                            </Text>
                                        </View>
                                        <View style={styles.slotStatus}>
                                            <Text style={[
                                                styles.slotStatusText,
                                                !slot.isAvailable && styles.slotTextDisabled,
                                                selectedSlot?.startTime === slot.startTime && styles.slotTextSelected
                                            ]}>
                                                {slot.isAvailable ? 'Available' : 'Booked'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Info size={24} color={Colors.text.tertiary} />
                                    <Text style={styles.emptyText}>No available slots for this date.</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action */}
                    <View style={styles.footer}>
                        <Button
                            title="Continue to Checkout"
                            disabled={!selectedSlot}
                            onPress={handleContinue}
                            style={styles.continueButton}
                        />
                    </View>
                </View>
            </ScrollView>
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
    scrollContent: {
        padding: Layout.spacing.lg,
    },
    container: {
        // No extra padding here
    },
    serviceBrief: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.secondary,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.lg,
        marginBottom: Layout.spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    serviceIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary.light + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Layout.spacing.md,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    serviceDuration: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    section: {
        marginBottom: Layout.spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Layout.spacing.md,
    },
    calendar: {
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        padding: 4,
        backgroundColor: Colors.background.primary,
    },
    slotsContainer: {
        gap: 10,
    },
    slotCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: 14,
        borderRadius: Layout.borderRadius.md,
        backgroundColor: Colors.background.secondary,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    slotSelected: {
        backgroundColor: Colors.primary.main,
        borderColor: Colors.primary.main,
    },
    slotDisabled: {
        backgroundColor: Colors.background.secondary,
        borderColor: Colors.border.primary,
        opacity: 0.5,
    },
    slotTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    slotTimeText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    slotStatus: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    slotStatusText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    slotTextSelected: {
        color: '#fff',
    },
    slotTextDisabled: {
        color: Colors.text.tertiary,
    },
    emptyContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Layout.spacing.xl,
    },
    emptyText: {
        marginTop: 8,
        color: Colors.text.secondary,
        fontSize: 14,
    },
    footer: {
        marginTop: Layout.spacing.lg,
    },
    continueButton: {
        backgroundColor: Colors.primary.main,
    },
});
