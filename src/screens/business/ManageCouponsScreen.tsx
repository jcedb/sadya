// Manage Coupons Screen - List of all active discount codes
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Plus, Ticket, ChevronLeft, Calendar } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { BusinessStackParamList } from '../../types/navigation';
import { useBusiness } from '../../contexts/BusinessContext';
import { getCoupons, deleteCoupon, Coupon } from '../../services/couponService';
import { useAlert } from '../../contexts/AlertContext';
import { format } from 'date-fns';

type NavigationProp = StackNavigationProp<BusinessStackParamList, 'ManageCoupons'>;

export const ManageCouponsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { business } = useBusiness();
    const { showAlert } = useAlert();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCoupons = useCallback(async () => {
        if (!business?.id) return;
        try {
            const { success, data, error } = await getCoupons(business.id);
            if (success) {
                setCoupons(data || []);
            } else {
                showAlert({ title: 'Error', message: error || 'Failed to fetch coupons', type: 'error' });
            }
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [business?.id, showAlert]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCoupons();
    };

    useFocusEffect(
        useCallback(() => {
            fetchCoupons();
        }, [fetchCoupons])
    );



    const renderCoupon = ({ item }: { item: Coupon }) => (
        <TouchableOpacity
            style={styles.couponCard}
            onPress={() => navigation.navigate('AddEditCoupon', { coupon: item })}
            activeOpacity={0.7}
        >
            <View style={styles.couponHeader}>
                <View style={styles.codeContainer}>
                    <Ticket size={16} color={Colors.primary.main} />
                    <Text style={styles.couponCode}>{item.code}</Text>
                </View>
            </View>

            <View style={styles.couponDetails}>
                <Text style={styles.discountText}>
                    {item.discount_type === 'percentage' ? `${item.value}% Off` : `₱${item.value} Off`}
                </Text>
                <View style={styles.expiryRow}>
                    <Calendar size={14} color={Colors.text.tertiary} />
                    <Text style={styles.expiryText}>Expires: {format(new Date(item.expires_at), 'MM/dd/yyyy')}</Text>
                </View>
            </View>

            <View style={styles.couponFooter}>
                <Text style={styles.limitText}>Limit: {item.usage_limit} uses</Text>
                <Text style={styles.minSpendText}>Min Spend: ₱{item.min_spend}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Your Coupons</Text>
            </View>

            {/* Scrollable Content */}
            <FlatList
                data={coupons}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary.main} />
                }
                renderItem={renderCoupon}
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary.main} />
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ticket size={48} color={Colors.text.tertiary} style={styles.emptyIcon} />
                            <Text style={styles.emptyTitle}>No Coupons Yet</Text>
                            <Text style={styles.emptyText}>
                                Start adding coupons so customers can enjoy discounts.
                            </Text>
                        </View>
                    )
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddEditCoupon', {})}
                activeOpacity={0.8}
            >
                <Plus color="#fff" size={32} />
            </TouchableOpacity>
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
    listContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 100,
    },
    couponCard: {
        backgroundColor: Colors.surface.primary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.md,
        marginBottom: Layout.spacing.sm,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary.main,
    },
    couponHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.background.tertiary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    couponCode: {
        fontSize: Layout.fontSize.md,
        fontWeight: 'bold',
        color: Colors.primary.main,
    },
    discountText: {
        fontSize: Layout.fontSize.lg,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    couponDetails: {
        marginBottom: 12,
    },
    expiryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expiryText: {
        fontSize: Layout.fontSize.xs,
        color: Colors.text.tertiary,
    },
    couponFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: Colors.border.primary,
        paddingTop: 8,
    },
    limitText: {
        fontSize: Layout.fontSize.xs,
        color: Colors.text.secondary,
    },
    minSpendText: {
        fontSize: Layout.fontSize.xs,
        color: Colors.text.secondary,
    },
    emptyContainer: {
        padding: Layout.spacing.xl,
        alignItems: 'center',
        marginTop: Layout.spacing.xl,
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.lg,
        marginHorizontal: Layout.spacing.lg,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: Colors.border.primary,
    },
    emptyIcon: {
        marginBottom: Layout.spacing.md,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    emptyText: {
        color: Colors.text.secondary,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    deleteButton: {
        padding: 4,
    },
    loadingContainer: {
        padding: Layout.spacing.xl,
        marginTop: Layout.spacing.xl,
        alignItems: 'center',
    },
});
