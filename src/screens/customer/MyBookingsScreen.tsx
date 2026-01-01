import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getCustomerBookings } from '../../services/bookingService';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, ChevronRight, AlertCircle, X, Filter } from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export const MyBookingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { profile } = useAuth();

    const [bookings, setBookings] = useState<any[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const fetchBookings = useCallback(async () => {
        if (!profile) return;

        try {
            const { data, success } = await getCustomerBookings(profile.id);
            if (success) {
                setBookings(data || []);
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        let filtered = [...bookings];
        if (startDate) {
            const startOfStart = new Date(startDate);
            startOfStart.setHours(0, 0, 0, 0);
            filtered = filtered.filter(b => new Date(b.start_time) >= startOfStart);
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            filtered = filtered.filter(b => new Date(b.start_time) <= endOfDay);
        }
        setFilteredBookings(filtered);
    }, [bookings, startDate, endDate]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchBookings();
    };

    const clearFilters = () => {
        setStartDate(null);
        setEndDate(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return Colors.status.success;
            case 'pending_approval': return Colors.status.pending;
            case 'cancelled':
            case 'declined': return Colors.status.error;
            case 'confirmed': return Colors.primary.main;
            default: return Colors.text.secondary;
        }
    };

    const renderBookingItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.bookingCard}
            onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.serviceName}>{item.service?.name}</Text>
                    <Text style={styles.businessName}>{item.business?.name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.detailsRow}>
                <View style={[styles.detailItem, { marginRight: 16 }]}>
                    <Calendar size={14} color={Colors.text.secondary} />
                    <Text style={styles.detailText}>{format(parseISO(item.start_time), 'MMM d, yyyy')}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Clock size={14} color={Colors.text.secondary} />
                    <Text style={styles.detailText}>{format(parseISO(item.start_time), 'h:mm a')}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.priceContainer}>
                    {Number(item.discount_amount) > 0 && (
                        <Text style={styles.originalPriceText}>{formatCurrency(Number(item.original_price))}</Text>
                    )}
                    <Text style={styles.amountText}>{formatCurrency(item.final_total)}</Text>
                </View>
                <ChevronRight size={18} color={Colors.text.tertiary} />
            </View>
        </TouchableOpacity>
    );

    if (isLoading && !isRefreshing) {
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
                <Text style={styles.title}>My Bookings</Text>
            </View>

            {/* Date Filters */}
            <View style={styles.filterContainer}>
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterBtn, startDate && styles.filterBtnActive]}
                        onPress={() => setShowStartPicker(true)}
                    >
                        <Calendar size={16} color={startDate ? Colors.primary.main : Colors.text.secondary} />
                        <Text style={[styles.filterBtnText, startDate && styles.filterBtnTextActive]}>
                            {startDate ? format(startDate, 'MMM d') : 'Start Date'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterBtn, endDate && styles.filterBtnActive]}
                        onPress={() => setShowEndPicker(true)}
                    >
                        <Calendar size={16} color={endDate ? Colors.primary.main : Colors.text.secondary} />
                        <Text style={[styles.filterBtnText, endDate && styles.filterBtnTextActive]}>
                            {endDate ? format(endDate, 'MMM d') : 'End Date'}
                        </Text>
                    </TouchableOpacity>

                    {(startDate || endDate) && (
                        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                            <X size={16} color={Colors.status.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {showStartPicker && (
                <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    textColor={Colors.text.primary}
                    onChange={(event, date) => {
                        setShowStartPicker(false);
                        if (date) setStartDate(date);
                    }}
                />
            )}

            {showEndPicker && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    textColor={Colors.text.primary}
                    onChange={(event, date) => {
                        setShowEndPicker(false);
                        if (date) setEndDate(date);
                    }}
                />
            )}

            <FlatList
                data={filteredBookings}
                keyExtractor={(item) => item.id}
                renderItem={renderBookingItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.primary.main]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <AlertCircle size={48} color={Colors.text.tertiary} />
                        <Text style={styles.emptyTitle}>No bookings yet</Text>
                        <Text style={styles.emptySubtitle}>When you book a service, it will appear here.</Text>
                    </View>
                }
            />
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
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.primary,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    listContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 100,
    },
    bookingCard: {
        backgroundColor: Colors.surface.primary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.md,
        marginBottom: Layout.spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Layout.spacing.md,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    businessName: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: Layout.spacing.md,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.border.primary,
        paddingTop: Layout.spacing.sm,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        flex: 1,
    },
    originalPriceText: {
        fontSize: 12,
        color: Colors.text.tertiary,
        textDecorationLine: 'line-through',
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary.main,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginTop: 8,
    },
    filterContainer: {
        padding: Layout.spacing.md,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.primary,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Layout.spacing.sm,
    },
    filterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.tertiary,
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.md,
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    filterBtnActive: {
        borderColor: Colors.primary.main,
        backgroundColor: Colors.primary.light + '10',
    },
    filterBtnText: {
        fontSize: 13,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    filterBtnTextActive: {
        color: Colors.primary.main,
        fontWeight: 'bold',
    },
    clearBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.status.error + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
