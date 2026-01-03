import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';
import { getBusinessById } from '../../services/businessService';
import { createBooking } from '../../services/bookingService';
import { CustomerStackParamList } from '../../types/navigation';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, Wallet, Banknote, Clock, MapPin, Tag, ShieldCheck, Info } from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { validateCoupon, Coupon, checkCouponUsage } from '../../services/couponService';

type CheckoutRouteProp = RouteProp<CustomerStackParamList, 'Checkout'>;

export const CheckoutScreen: React.FC = () => {
    const route = useRoute<CheckoutRouteProp>();
    const navigation = useNavigation<any>();
    const { businessId, serviceId, startTime, endTime } = route.params;
    const { profile } = useAuth();
    const { showAlert } = useAlert();

    const [business, setBusiness] = useState<any>(null);
    const [service, setService] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital_wallet'>('digital_wallet');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isCashAvailable, setIsCashAvailable] = useState(false);

    // Using a simpler error state for checkout since it's mostly dynamic validation
    // But setting up the structure for consistency
    const [couponError, setCouponError] = useState<string | null>(null);

    useEffect(() => {
        fetchDetails();
    }, []);

    const fetchDetails = async () => {
        try {
            setIsLoading(true);
            const { data: bizData, success } = await getBusinessById(businessId);
            if (success && bizData) {
                setBusiness(bizData);
                const foundService = bizData.services?.find((s: any) => s.id === serviceId);
                if (!foundService) throw new Error('Service not found');
                setService(foundService);
            }
        } catch (error) {
            showAlert({ title: 'Error', message: 'Failed to load details', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const calculateTotals = () => {
        if (!service) return { original: 0, discount: 0, saleDiscount: 0, total: 0, finalPlatformFee: 0 };

        const original = Number(service.price);
        const basePrice = service.is_on_sale ? Number(service.sale_price) : original;
        const saleDiscount = original - basePrice;

        let couponDiscount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.discount_type === 'percentage') {
                couponDiscount = basePrice * (Number(appliedCoupon.value) / 100);
            } else {
                couponDiscount = Number(appliedCoupon.value);
            }
        }

        const total = Math.max(0, basePrice - couponDiscount);
        const rate = Number(business?.commission_rate) || 0.1;
        const finalPlatformFee = total * rate;

        return { original, discount: couponDiscount, saleDiscount, total, finalPlatformFee };
    };

    const totals = calculateTotals();

    useEffect(() => {
        if (!business || !service) return;

        const fee = totals.finalPlatformFee;
        const hasBalance = Number(business.wallet_balance || 0) >= fee;
        const bizAcceptsCash = business.accepts_cash;
        const isCurrentlyAvailable = bizAcceptsCash && hasBalance;

        setIsCashAvailable(isCurrentlyAvailable);

        if (!isCurrentlyAvailable && paymentMethod === 'cash') {
            setPaymentMethod('digital_wallet');
        }
    }, [totals.finalPlatformFee, business?.wallet_balance, business?.accepts_cash, service]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        setIsValidatingCoupon(true);
        try {
            const basePrice = service.is_on_sale ? Number(service.sale_price) : Number(service.price);
            const { success, data, error } = await validateCoupon(couponCode, businessId, basePrice);

            if (!success || !data) {
                let userMessage = error || 'Something went wrong while applying the coupon.';
                setCouponError(userMessage);
                return;
            }

            const { data: hasUsed, success: usageSuccess } = await checkCouponUsage(couponCode, businessId, profile!.id);
            if (usageSuccess && hasUsed) {
                setCouponError('You have already used this promo code for this business.');
                return;
            }

            setAppliedCoupon(data);
            setCouponError(null);
            // Optional: Success toast or small inline message instead of blocking alert
            // showAlert({ title: 'Success', message: 'Promo code applied!', type: 'success' });
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!profile || !service || !business) return;

        setIsSubmitting(true);
        try {
            const bookingData = {
                customer_id: profile.id,
                business_id: businessId,
                service_id: serviceId,
                start_time: startTime,
                end_time: endTime,
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'digital_wallet' ? 'paid' : 'unpaid',
                original_price: totals.original,
                discount_amount: totals.discount + totals.saleDiscount,
                voucher_code_used: appliedCoupon?.code || null,
                tip_amount: 0,
                platform_fee: totals.finalPlatformFee,
                final_total: totals.total,
                updated_by: profile.id,
                created_by: profile.id
            };

            const result = await createBooking(bookingData as any);

            if (result.success) {
                showAlert({
                    title: 'Booking Confirmed!',
                    message: paymentMethod === 'cash'
                        ? 'Your appointment has been requested.'
                        : 'Your appointment is confirmed!',
                    type: 'success',
                    onConfirm: () => navigation.navigate('CustomerTabs')
                });
            } else {
                showAlert({ title: 'Booking Failed', message: result.error || 'Something went wrong', type: 'error' });
            }
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <ScreenWrapper safeArea>
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
                <Text style={styles.title}>Review & Pay</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>{service?.name}</Text>
                        <View style={styles.summaryRow}>
                            <Clock size={16} color={Colors.text.secondary} />
                            <Text style={styles.summaryText}>
                                {format(parseISO(startTime), 'MMMM d, yyyy • h:mm a')}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <MapPin size={16} color={Colors.text.secondary} />
                            <Text style={styles.summaryText}>{business?.name}</Text>
                        </View>
                    </View>

                    {/* Promo Code */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Promotion Code</Text>
                        <View style={styles.couponInputContainer}>
                            <TextInput
                                style={[styles.couponInput, couponError && { borderColor: Colors.status.error }]}
                                placeholder="Enter Code"
                                placeholderTextColor={Colors.text.tertiary}
                                value={couponCode}
                                onChangeText={(val) => {
                                    setCouponCode(val);
                                    if (couponError) setCouponError(null);
                                }}
                                autoCapitalize="characters"
                                editable={!appliedCoupon && !isValidatingCoupon}
                            />
                            <TouchableOpacity
                                style={[styles.applyButton, (!couponCode.trim() || appliedCoupon) && styles.applyButtonDisabled]}
                                onPress={handleApplyCoupon}
                                disabled={!couponCode.trim() || !!appliedCoupon || isValidatingCoupon}
                            >
                                {isValidatingCoupon ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.applyButtonText}>{appliedCoupon ? 'Applied' : 'Apply'}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        {couponError && <Text style={{ color: Colors.status.error, fontSize: 12, marginTop: -4, marginBottom: 8 }}>{couponError}</Text>}
                        {appliedCoupon && (
                            <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponCode(''); }}>
                                <Text style={styles.removeCouponText}>Remove coupon</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Price Breakdown */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Price Details</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Original Price</Text>
                            <Text style={styles.priceValue}>{formatCurrency(totals.original)}</Text>
                        </View>

                        {totals.saleDiscount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Sale Discount</Text>
                                <Text style={[styles.priceValue, { color: Colors.status.success }]}>-{formatCurrency(totals.saleDiscount)}</Text>
                            </View>
                        )}

                        {totals.discount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Promo Code ({appliedCoupon?.code})</Text>
                                <Text style={[styles.priceValue, { color: Colors.status.success }]}>-{formatCurrency(totals.discount)}</Text>
                            </View>
                        )}

                        <View style={[styles.priceRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total to Pay</Text>
                            <Text style={styles.totalValue}>{formatCurrency(totals.total)}</Text>
                        </View>
                    </View>

                    {/* Payment Methods */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>

                        <TouchableOpacity
                            style={[styles.paymentOption, paymentMethod === 'digital_wallet' && styles.paymentSelected]}
                            onPress={() => setPaymentMethod('digital_wallet')}
                        >
                            <View style={styles.paymentIconContainer}>
                                <Wallet size={20} color={paymentMethod === 'digital_wallet' ? '#fff' : Colors.primary.main} />
                            </View>
                            <View style={styles.paymentInfo}>
                                <Text style={[styles.paymentName, paymentMethod === 'digital_wallet' && styles.textWhite]}>
                                    Digital Wallet / GCash
                                </Text>
                                <Text style={[styles.paymentDesc, paymentMethod === 'digital_wallet' && styles.textWhiteDim]}>
                                    Pay now securely
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            disabled={!isCashAvailable}
                            style={[
                                styles.paymentOption,
                                paymentMethod === 'cash' && styles.paymentSelected,
                                !isCashAvailable && styles.paymentDisabled
                            ]}
                            onPress={() => setPaymentMethod('cash')}
                        >
                            <View style={styles.paymentIconContainer}>
                                <Banknote size={20} color={!isCashAvailable ? Colors.text.tertiary : (paymentMethod === 'cash' ? '#fff' : Colors.primary.main)} />
                            </View>
                            <View style={styles.paymentInfo}>
                                <Text style={[styles.paymentName, paymentMethod === 'cash' && styles.textWhite, !isCashAvailable && styles.textDisabled]}>
                                    Pay at Venue (Cash)
                                </Text>
                                <Text style={[styles.paymentDesc, paymentMethod === 'cash' && styles.textWhiteDim, !isCashAvailable && styles.textDisabled]}>
                                    {isCashAvailable ? 'Pay after your appointment' : 'Temporarily unavailable'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {!isCashAvailable && (
                            <View style={styles.infoAlert}>
                                <Info size={14} color={Colors.text.secondary} />
                                <Text style={styles.infoAlertText}>
                                    Cash payments are currently unavailable for this service.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Secure Badge */}
                    <View style={styles.secureBadge}>
                        <ShieldCheck size={16} color={Colors.status.success} />
                        <Text style={styles.secureText}>Secure Booking Guarantee</Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Button
                            title={paymentMethod === 'digital_wallet' ? 'Pay & Confirm' : 'Confirm Booking'}
                            loading={isSubmitting}
                            onPress={handleConfirmBooking}
                            variant="primary"
                            style={styles.confirmButton}
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
        paddingVertical: Layout.spacing.lg,
    },
    container: {
        paddingHorizontal: Layout.spacing.lg,
    },
    summaryCard: {
        backgroundColor: Colors.background.secondary,
        padding: Layout.spacing.lg,
        borderRadius: Layout.borderRadius.xl,
        marginBottom: Layout.spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: Layout.spacing.sm,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    summaryText: {
        fontSize: 14,
        color: Colors.text.secondary,
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
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Layout.spacing.sm,
    },
    priceLabel: {
        color: Colors.text.secondary,
    },
    priceValue: {
        fontWeight: '600',
        color: Colors.text.primary,
    },
    totalRow: {
        marginTop: Layout.spacing.sm,
        paddingTop: Layout.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border.primary,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary.main,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.secondary,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        marginBottom: Layout.spacing.md,
    },
    paymentSelected: {
        backgroundColor: Colors.primary.main,
        borderColor: Colors.primary.main,
    },
    paymentDisabled: {
        opacity: 0.6,
        backgroundColor: Colors.background.secondary,
    },
    paymentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Layout.spacing.md,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    paymentDesc: {
        fontSize: 12,
        color: Colors.text.secondary,
    },
    textWhite: {
        color: '#fff',
    },
    textWhiteDim: {
        color: 'rgba(255,255,255,0.7)',
    },
    textDisabled: {
        color: Colors.text.tertiary,
    },
    infoAlert: {
        flexDirection: 'row',
        backgroundColor: Colors.primary.light + '10',
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        gap: 8,
    },
    infoAlertText: {
        flex: 1,
        fontSize: 12,
        color: Colors.text.secondary,
        lineHeight: 18,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: Layout.spacing.md,
    },
    secureText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.status.success,
    },
    footer: {
        marginTop: Layout.spacing.xl,
        marginBottom: Layout.spacing.xl,
    },
    confirmButton: {
        height: 54,
    },
    couponInputContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    couponInput: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.md,
        paddingHorizontal: Layout.spacing.md,
        height: 48,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    applyButton: {
        backgroundColor: Colors.primary.main,
        borderRadius: Layout.borderRadius.md,
        paddingHorizontal: 20,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    applyButtonDisabled: {
        backgroundColor: Colors.background.tertiary,
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    removeCouponText: {
        color: Colors.status.error,
        fontSize: 12,
        fontWeight: '600',
    },
});
