// Business Dashboard Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { useBusiness } from '../../contexts/BusinessContext';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { BusinessStackParamList, DashboardScreenNavigationProp } from '../../types/navigation';
import { Button } from '../../components/common/Button';
import { format, isToday, parseISO } from 'date-fns';
import { getBusinessBookings } from '../../services/bookingService';
import { Star, Ticket, Wallet, Store, Scissors, Calendar, Image as ImageIcon, User } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../services/supabase';

type NavigationProp = DashboardScreenNavigationProp;

export const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { business, isLoading, refreshBusiness } = useBusiness();
    const { profile } = useAuth();

    const [appointments, setAppointments] = React.useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const fetchAppointments = React.useCallback(async () => {
        if (!business?.id) return;
        setIsRefreshing(true);
        try {
            const { data, success } = await getBusinessBookings(business.id);
            if (success) setAppointments(data || []);
        } finally {
            setIsRefreshing(false);
        }
    }, [business?.id]);

    const handleRefresh = React.useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([fetchAppointments(), refreshBusiness()]);
        setIsRefreshing(false);
    }, [fetchAppointments, refreshBusiness]);

    useFocusEffect(
        React.useCallback(() => {
            handleRefresh();
        }, [handleRefresh])
    );

    React.useEffect(() => {
        if (!business?.id) return;

        const channel = supabase
            .channel(`business_bookings_${business.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `business_id=eq.${business.id}`,
                },
                () => {
                    fetchAppointments();
                    refreshBusiness();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [business?.id, fetchAppointments, refreshBusiness]);

    const handlePreviewProfile = () => {
        if (business) {
            navigation.navigate('BusinessProfile', { businessId: business.id });
        }
    };

    const todayBookingsCount = appointments.filter(b => {
        try {
            if (b.status === 'cancelled' || b.status === 'declined') return false;
            const date = typeof b.start_time === 'string' ? parseISO(b.start_time) : new Date(b.start_time);
            return isToday(date);
        } catch (e) {
            return false;
        }
    }).length;

    if (isLoading) {
        return (
            <ScreenWrapper>
                <View style={styles.centerContainer}>
                    <Text>Loading business...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    if (!business) {
        return (
            <ScreenWrapper>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Business not found. Please reload or contact support.</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper
            scrollable
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerTitleRow}
                        onPress={() => navigation.navigate('Profile')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.avatarButton}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatar} />
                            ) : (
                                <View style={[styles.headerAvatar, styles.placeholderAvatar]}>
                                    <User size={24} color={Colors.primary.main} />
                                </View>
                            )}
                        </View>
                        <View>
                            <View style={styles.greetingRow}>
                                <Text style={styles.greeting}>Welcome back,</Text>
                                <View style={styles.statusBadge}>
                                    <View style={[styles.statusDot, { backgroundColor: business.is_verified ? Colors.status.success : Colors.status.pending }]} />
                                    <Text style={styles.statusText}>{business.is_verified ? 'Verified' : 'Pending Verification'}</Text>
                                </View>
                            </View>
                            <Text style={styles.businessName}>{profile?.full_name || 'Business Owner'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Wallet Balance Card */}
                <TouchableOpacity
                    style={styles.balanceCard}
                    onPress={() => navigation.navigate('WalletScreen')}
                    activeOpacity={0.7}
                >
                    <View style={styles.balanceInfo}>
                        <Text style={styles.balanceLabel}>Wallet Points Balance</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(business.wallet_balance || 0)}</Text>
                    </View>
                    <View style={styles.balanceIconContainer}>
                        <Wallet size={32} color={Colors.primary.main} />
                    </View>
                </TouchableOpacity>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => navigation.navigate('BusinessAppointments', { filter: 'today' })}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Today's Bookings</Text>
                        <Text style={styles.statValue}>{todayBookingsCount}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => navigation.navigate('BusinessProfile', { businessId: business.id, initialTab: 'reviews' })}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Total Reviews</Text>
                        <Text style={styles.statValue}>{business.review_count || 0}</Text>
                    </TouchableOpacity>
                    {business.average_rating ? (
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Rating</Text>
                            <View style={styles.ratingValue}>
                                <Star size={18} color={Colors.primary.light} fill={Colors.primary.light} />
                                <Text style={styles.statValue}>{business.average_rating.toFixed(1)}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.gridItem} onPress={handlePreviewProfile}>
                        <View style={[styles.iconBox, { backgroundColor: '#4C6EF515' }]}>
                            <Store size={32} color="#4C6EF5" />
                        </View>
                        <Text style={styles.gridLabel}>Business</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Services')}>
                        <View style={[styles.iconBox, { backgroundColor: '#FAB00515' }]}>
                            <Scissors size={32} color="#FAB005" />
                        </View>
                        <Text style={styles.gridLabel}>Services</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ManageCoupons')}>
                        <View style={[styles.iconBox, { backgroundColor: '#FA525215' }]}>
                            <Ticket size={32} color="#FA5252" />
                        </View>
                        <Text style={styles.gridLabel}>Coupons</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ManageSchedule')}>
                        <View style={[styles.iconBox, { backgroundColor: '#12B88615' }]}>
                            <Calendar size={32} color="#12B886" />
                        </View>
                        <Text style={styles.gridLabel}>Schedule</Text>
                    </TouchableOpacity>

                </View>

                {/* Upcoming Appointments */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{appointments.length}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('BusinessAppointments')}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>
                {appointments.length > 0 ? (
                    appointments.slice(0, 4).map((appointment) => (
                        <TouchableOpacity
                            key={appointment.id}
                            style={styles.appointmentCard}
                            onPress={() => navigation.navigate('BookingDetails', { bookingId: appointment.id })}
                        >
                            <View style={styles.appointmentMain}>
                                <View style={styles.appointmentTimeBox}>
                                    <Text style={styles.appointmentTime}>{format(new Date(appointment.start_time), 'h:mm a')}</Text>
                                    <Text style={styles.appointmentDate}>{format(new Date(appointment.start_time), 'MMM d')}</Text>
                                </View>
                                <View style={styles.appointmentInfo}>
                                    <View style={styles.serviceStatusRow}>
                                        <Text style={styles.appointmentService} numberOfLines={1}>{appointment.service?.name}</Text>
                                        <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(appointment.status) + '15' }]}>
                                            <Text style={[styles.statusTextSmall, { color: getStatusColor(appointment.status) }]}>
                                                {appointment.status.replace('_', ' ').toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.appointmentCustomer} numberOfLines={1}>{appointment.customer?.full_name}</Text>
                                    <Text style={styles.appointmentPrice}>{formatCurrency(appointment.final_total)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No upcoming appointments.</Text>
                    </View>
                )}

            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: Layout.spacing.lg,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Layout.spacing.md,
    },
    avatarButton: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.background.secondary,
    },
    placeholderAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary.light + '20',
        borderWidth: 1,
        borderColor: Colors.primary.main + '30',
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    greeting: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.secondary,
    },
    businessName: {
        fontSize: 24,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.text.primary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.tertiary,
        paddingHorizontal: Layout.spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: Layout.fontSize.xs,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    errorText: {
        color: Colors.status.error,
        fontSize: Layout.fontSize.md,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: Layout.spacing.md,
        marginBottom: Layout.spacing.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: Layout.fontSize.xs,
        color: Colors.text.secondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.primary.light,
    },
    ratingValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
    },
    sectionTitle: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.text.primary,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    countBadge: {
        backgroundColor: Colors.primary.main + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.primary.main,
    },
    viewAllText: {
        color: Colors.primary.main,
        fontSize: Layout.fontSize.sm,
        fontWeight: '600',
    },
    balanceCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.lg,
        marginBottom: Layout.spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    balanceInfo: {
        gap: 4,
    },
    balanceLabel: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.primary.main,
    },
    balanceIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: Layout.spacing.xl,
    },
    gridItem: {
        width: '20%',
        alignItems: 'center',
    },
    iconBox: {
        width: 70,
        height: 70,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    gridLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
        textAlign: 'center',
        width: 80,
    },
    emptyCard: {
        backgroundColor: Colors.background.secondary,
        padding: Layout.spacing.xl,
        borderRadius: Layout.borderRadius.md,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    emptyText: {
        color: Colors.text.tertiary,
    },
    appointmentCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.md,
        padding: Layout.spacing.md,
        marginBottom: Layout.spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    appointmentMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appointmentTimeBox: {
        alignItems: 'center',
        paddingRight: Layout.spacing.sm,
        borderRightWidth: 1,
        borderRightColor: Colors.border.primary,
        width: 85,
    },
    appointmentTime: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.primary.main,
    },
    appointmentDate: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    appointmentInfo: {
        flex: 1,
        paddingHorizontal: Layout.spacing.md,
    },
    appointmentService: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text.primary,
        flex: 1,
        marginRight: Layout.spacing.sm,
    },
    serviceStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    appointmentCustomer: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    appointmentPrice: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.primary.main,
        marginTop: 2,
    },
    statusBadgeSmall: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTextSmall: {
        fontSize: 9,
        fontWeight: 'bold',
    },
});

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
