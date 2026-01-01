import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, Linking } from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';
import { format, parseISO } from 'date-fns';
import {
    Calendar,
    Clock,
    User,
    Store,
    Scissors,
    MapPin,
    Phone,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Info,
    MessageSquare,
    Star
} from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { updateBookingStatus, acceptBooking } from '../../services/bookingService';
import { getBookingReview } from '../../services/reviewService';
import { BookingDetailsScreenRouteProp, BookingDetailsScreenNavigationProp } from '../../types/navigation';

export const BookingDetailsScreen: React.FC = () => {
    const route = useRoute<BookingDetailsScreenRouteProp>();
    const navigation = useNavigation<BookingDetailsScreenNavigationProp>();
    const { bookingId } = route.params;
    const { showAlert } = useAlert();
    const { profile } = useAuth();

    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [existingReview, setExistingReview] = useState<any>(null);
    const [isLoadingReview, setIsLoadingReview] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const isBusinessOwner = (profile?.role as string) === 'business_owner';

    const fetchBookingDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    business:businesses(*, owner:profiles!businesses_owner_id_fkey(*)),
                    customer:profiles!bookings_customer_id_fkey(*),
                    service:services(*)
                `)
                .eq('id', bookingId)
                .single();

            if (error) throw error;
            setBooking(data);
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchBookingDetails();
    }, [fetchBookingDetails]);

    const checkReview = useCallback(async () => {
        if (booking?.status === 'completed') {
            setIsLoadingReview(true);
            const { data, success } = await getBookingReview(bookingId);
            if (success) setExistingReview(data);
            setIsLoadingReview(false);
        }
    }, [booking?.status, bookingId]);

    useFocusEffect(
        useCallback(() => {
            checkReview();
        }, [checkReview])
    );

    const { canComplete, waitMessage } = useMemo(() => {
        if (!booking || booking.status !== 'confirmed' || !isBusinessOwner) return { canComplete: true, waitMessage: '' };

        const startTime = parseISO(booking.start_time);
        const serviceDuration = booking.service?.duration_minutes || 0;
        const requiredWait = Math.min(20, serviceDuration);
        const completionAllowedAt = new Date(startTime.getTime() + requiredWait * 60 * 1000);

        const isTimeMet = currentTime >= completionAllowedAt;

        if (isTimeMet) return { canComplete: true, waitMessage: '' };

        const diffMs = completionAllowedAt.getTime() - currentTime.getTime();
        const diffMins = Math.ceil(diffMs / (1000 * 60));

        return {
            canComplete: false,
            waitMessage: `Can complete in ${diffMins} min${diffMins !== 1 ? 's' : ''}`
        };
    }, [booking, currentTime, isBusinessOwner]);

    useEffect(() => {
        if (booking?.status === 'confirmed' && isBusinessOwner) {
            const timer = setInterval(() => setCurrentTime(new Date()), 30000);
            return () => clearInterval(timer);
        }
    }, [booking?.status, isBusinessOwner]);

    const handleStatusUpdate = async (newStatus: any, reason?: string) => {
        setIsUpdating(true);
        try {
            let res;
            if (newStatus === 'confirmed' && isBusinessOwner) {
                res = await acceptBooking(bookingId, profile!.id);
            } else {
                res = await updateBookingStatus(bookingId, newStatus, reason);
            }

            const { success, error } = res;
            if (success) {
                showAlert({ title: 'Success', message: `Booking ${newStatus} successfully.`, type: 'success' });
                fetchBookingDetails();
                setShowRejectModal(false);
            } else {
                throw new Error(error || 'Failed to update status');
            }
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmReject = () => {
        if (rejectReason.trim().length < 5) {
            showAlert({ title: 'Reason Required', message: 'Please provide a reason (at least 5 characters).', type: 'error' });
            return;
        }
        handleStatusUpdate('declined', rejectReason);
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

    if (!booking) return null;

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

    return (
        <ScreenWrapper scrollable>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Booking Details</Text>
            </View>

            <View style={styles.container}>
                {/* Status Card */}
                <View style={[styles.statusCard, { borderColor: getStatusColor(booking.status) + '40' }]}>
                    <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(booking.status) }]} />
                    <View>
                        <Text style={styles.statusLabel}>Status</Text>
                        <Text style={[styles.statusValue, { color: getStatusColor(booking.status) }]}>
                            {booking.status.toUpperCase().replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                {booking.decline_reason && (
                    <View style={styles.reasonCard}>
                        <Info size={20} color={Colors.status.error} />
                        <View style={styles.reasonContent}>
                            <Text style={styles.reasonLabel}>Decline Reason</Text>
                            <Text style={styles.reasonText}>{booking.decline_reason}</Text>
                        </View>
                    </View>
                )}

                {/* Service Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Service Information</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.serviceHeader}>
                            <View style={styles.iconContainer}>
                                <Scissors size={24} color={Colors.primary.main} />
                            </View>
                            <View>
                                <Text style={styles.serviceName}>{booking.service?.name}</Text>
                                <Text style={styles.durationText}>{booking.service?.duration_minutes} Minutes</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Calendar size={20} color={Colors.text.secondary} />
                            <Text style={styles.infoText}>{format(parseISO(booking.start_time), 'EEEE, MMMM d, yyyy')}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Clock size={20} color={Colors.text.secondary} />
                            <Text style={styles.infoText}>{format(parseISO(booking.start_time), 'h:mm a')} - {format(parseISO(booking.end_time), 'h:mm a')}</Text>
                        </View>
                    </View>
                </View>

                {/* Customer/Business Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isBusinessOwner ? 'Customer' : 'Business'} Details</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.profileHeader}>
                            <View style={styles.iconContainer}>
                                {isBusinessOwner ? <User size={24} color={Colors.primary.main} /> : <Store size={24} color={Colors.primary.main} />}
                            </View>
                            <View>
                                <Text style={styles.profileName}>
                                    {isBusinessOwner ? booking.customer?.full_name : booking.business?.name}
                                </Text>
                                <Text style={styles.profileSub}>
                                    {isBusinessOwner ? booking.customer?.phone_number : (booking.business?.owner?.phone_number || booking.business?.address_text || 'Business Location')}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.actionRow}
                            onPress={() => {
                                const phoneNumber = isBusinessOwner ? booking.customer?.phone_number : (booking.business?.phone_number || booking.business?.owner?.phone_number);
                                if (phoneNumber) {
                                    Linking.openURL(`tel:${phoneNumber}`);
                                } else {
                                    Alert.alert('Error', 'Phone number not available');
                                }
                            }}
                        >
                            <Phone size={20} color={Colors.primary.main} />
                            <Text style={styles.actionText}>Call {isBusinessOwner ? 'Customer' : 'Business'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Payment Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Price</Text>
                            <Text style={styles.priceValue}>{formatCurrency(booking.original_price)}</Text>
                        </View>
                        {booking.discount_amount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Discount</Text>
                                <Text style={[styles.priceValue, { color: Colors.status.success }]}>-{formatCurrency(booking.discount_amount)}</Text>
                            </View>
                        )}
                        <View style={styles.divider} />
                        <View style={styles.priceRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.totalLabel}>Total Paid via {booking.payment_method.toUpperCase()}</Text>
                            </View>
                            <Text style={styles.totalValue}>{formatCurrency(booking.final_total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                {isBusinessOwner && booking.status === 'pending_approval' && (
                    <View style={styles.actionContainer}>
                        <Button
                            title="Confirm Booking"
                            onPress={() => handleStatusUpdate('confirmed')}
                            icon={<CheckCircle2 size={20} color="#fff" />}
                            loading={isUpdating}
                        />
                        <View style={{ height: 12 }} />
                        <Button
                            title="Decline Booking"
                            variant="danger"
                            onPress={() => setShowRejectModal(true)}
                            icon={<XCircle size={20} color="#fff" />}
                            disabled={isUpdating}
                        />
                    </View>
                )}

                {isBusinessOwner && booking.status === 'confirmed' && (
                    <View style={styles.actionContainer}>
                        {waitMessage ? (
                            <Text style={styles.waitHint}>{waitMessage}</Text>
                        ) : null}
                        <Button
                            title="Complete Service"
                            onPress={() => handleStatusUpdate('completed')}
                            icon={<CheckCircle2 size={20} color="#fff" />}
                            loading={isUpdating}
                            variant="primary"
                            disabled={!canComplete || isUpdating}
                        />
                    </View>
                )}

                {!isBusinessOwner && booking.status === 'completed' && !existingReview && !isLoadingReview && (
                    <View style={styles.actionContainer}>
                        <Button
                            title="Leave a Review"
                            onPress={() => navigation.navigate('LeaveReview' as any, { bookingId, businessId: booking.business_id })}
                            icon={<MessageSquare size={20} color="#fff" />}
                            variant="primary"
                        />
                    </View>
                )}

                {booking.status === 'completed' && existingReview && (
                    <View style={styles.reviewShowcase}>
                        <Text style={styles.reviewShowcaseLabel}>
                            {isBusinessOwner ? `${existingReview.customer?.full_name || 'Customer'}'s Review` : 'Your Review'}
                        </Text>
                        <View style={styles.reviewContent}>
                            <View style={styles.reviewHeader}>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={16}
                                            color={s <= existingReview.rating ? Colors.primary.light : Colors.border.primary}
                                            fill={s <= existingReview.rating ? Colors.primary.light : 'transparent'}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.reviewDate}>{format(parseISO(existingReview.created_at), 'MMM d, yyyy')}</Text>
                            </View>
                            {existingReview.comment && (
                                <Text style={styles.reviewComment}>{existingReview.comment}</Text>
                            )}
                        </View>
                    </View>
                )}

                {!isBusinessOwner && booking.status === 'pending_approval' && (
                    <View style={styles.actionContainer}>
                        <Button
                            title="Cancel Booking"
                            variant="danger"
                            onPress={() => handleStatusUpdate('cancelled', 'Cancelled by customer')}
                            icon={<XCircle size={20} color="#fff" />}
                            loading={isUpdating}
                        />
                    </View>
                )}
            </View>

            {/* Reject Modal */}
            <Modal
                visible={showRejectModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRejectModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Decline Booking</Text>
                        <Text style={styles.modalSubtitle}>Please provide a reason for declining this booking. The customer will see this.</Text>

                        <TextInput
                            style={styles.reasonInput}
                            placeholder="e.g., Staff unavailable, Slot already taken..."
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                            numberOfLines={4}
                            placeholderTextColor={Colors.text.tertiary}
                        />

                        <View style={styles.modalActions}>
                            <Button
                                title="Cancel"
                                variant="outline"
                                onPress={() => setShowRejectModal(false)}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title="Decline"
                                variant="danger"
                                onPress={confirmReject}
                                loading={isUpdating}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingVertical: Layout.spacing.sm,
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
    container: {
        padding: Layout.spacing.md,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.secondary,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.lg,
        borderWidth: 1,
        marginBottom: Layout.spacing.lg,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    statusLabel: {
        fontSize: 12,
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    statusValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 2,
    },
    reasonCard: {
        flexDirection: 'row',
        backgroundColor: Colors.status.error + '10',
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.status.error + '30',
        marginBottom: Layout.spacing.lg,
        alignItems: 'flex-start',
    },
    reasonContent: {
        marginLeft: 12,
        flex: 1,
    },
    reasonLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.status.error,
    },
    reasonText: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginTop: 4,
        lineHeight: 20,
    },
    section: {
        marginBottom: Layout.spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Layout.spacing.md,
    },
    infoCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Layout.spacing.md,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    durationText: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border.primary,
        marginVertical: Layout.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 15,
        color: Colors.text.secondary,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    profileSub: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary.main,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary.main,
    },
    actionContainer: {
        marginTop: Layout.spacing.md,
        marginBottom: Layout.spacing.xl,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Layout.spacing.xl,
    },
    modalContent: {
        backgroundColor: Colors.background.primary,
        borderRadius: Layout.borderRadius.xl,
        padding: Layout.spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginBottom: Layout.spacing.lg,
        lineHeight: 20,
    },
    reasonInput: {
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.md,
        padding: Layout.spacing.md,
        color: Colors.text.primary,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: Colors.border.primary,
        marginBottom: Layout.spacing.xl,
    },
    modalActions: {
        flexDirection: 'row',
        gap: Layout.spacing.md,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: Layout.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.background.tertiary,
    },
    cancelButtonText: {
        color: Colors.text.primary,
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: Colors.status.error,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    reviewShowcase: {
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        marginBottom: Layout.spacing.xl,
    },
    reviewShowcaseLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: Layout.spacing.md,
    },
    reviewContent: {
        gap: 8,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewDate: {
        fontSize: 12,
        color: Colors.text.tertiary,
    },
    reviewComment: {
        fontSize: 14,
        color: Colors.text.secondary,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    waitHint: {
        fontSize: 13,
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '600',
    },
});
