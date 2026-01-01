import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getPendingBusinesses, verifyBusiness, declineBusiness } from '../../services/businessService';
import { Business } from '../../types/database.types';

import { MapPin, Phone, ShieldCheck, ShieldX, Wallet, Store, ChevronRight, AlertCircle, ShieldAlert, User, UserX, Ban } from 'lucide-react-native';
import { useAlert } from '../../contexts/AlertContext';
import { getPendingTransactions } from '../../services/walletService';
import { WalletTransaction } from '../../types/database.types';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../services/supabase';

export const AdminDashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { signOut } = useAuth();
    const { showAlert } = useAlert();
    const [activeTab, setActiveTab] = useState<'businesses' | 'transactions' | 'trust'>('businesses');
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [trustMetrics, setTrustMetrics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'businesses') {
                const { data, error } = await getPendingBusinesses();
                if (error) throw new Error(error);
                setBusinesses(data || []);
            } else if (activeTab === 'transactions') {
                const { data, error } = await getPendingTransactions();
                if (error) throw new Error(error);
                setTransactions(data || []);
            } else {
                // Fetch Trust Metrics (Rejections/Cancellations)
                const { data, error } = await supabase
                    .from('bookings')
                    .select('status, customer:profiles!bookings_customer_id_fkey(full_name), business:businesses(name)')
                    .in('status', ['declined', 'cancelled']);

                if (error) throw error;

                // Aggregate rejections per name (simplified for now)
                const counts: any = {};
                (data || []).forEach((b: any) => {
                    const name = b.status === 'declined' ? b.business?.name : b.customer?.full_name;
                    const type = b.status === 'declined' ? 'Business' : 'Customer';
                    if (!counts[name]) counts[name] = { name, count: 0, type };
                    counts[name].count++;
                });

                const sorted = Object.values(counts).sort((a: any, b: any) => b.count - a.count);
                setTrustMetrics(sorted);
            }
        } catch (error: any) {
            showAlert({ title: 'Fetch Error', message: error.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    // Also fetch when tab changes
    useEffect(() => {
        fetchData();
    }, [activeTab, fetchData]);

    const handleVerifyBusiness = async (businessId: string, businessName: string) => {
        showAlert({
            title: 'Verify Business',
            message: `Approve ${businessName} for the platform?`,
            type: 'warning',
            showCancel: true,
            confirmText: 'Verify',
            onConfirm: async () => {
                const { success, error } = await verifyBusiness(businessId);
                if (success) {
                    showAlert({ title: 'Success', message: 'Business verified', type: 'success' });
                    fetchData();
                } else {
                    showAlert({ title: 'Error', message: error || 'Failed to verify', type: 'error' });
                }
            }
        });
    };

    const handleDeclineBusiness = async (businessId: string, businessName: string) => {
        showAlert({
            title: 'Decline Business',
            message: `Remove ${businessName}'s application?`,
            type: 'warning',
            showCancel: true,
            confirmText: 'Decline',
            onConfirm: async () => {
                const { success, error } = await declineBusiness(businessId);
                if (success) {
                    showAlert({ title: 'Success', message: 'Business declined', type: 'success' });
                    fetchData();
                } else {
                    showAlert({ title: 'Error', message: error || 'Failed to decline', type: 'error' });
                }
            }
        });
    };

    const renderBusinessItem = ({ item }: { item: Business }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VerifyBusiness', { businessId: item.id })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.businessName}>{item.name}</Text>
                <View style={[styles.badge, styles.pendingBadge]}>
                    <Text style={styles.badgeText}>Pending</Text>
                </View>
                <ChevronRight size={18} color={Colors.text.secondary} />
            </View>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

            <View style={styles.infoRow}>
                <MapPin size={14} color={Colors.text.secondary} />
                <Text style={styles.infoText}>{item.address_text}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderTrustItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.bizMiniInfo}>
                    {item.type === 'Business' ? <Store size={16} color={Colors.status.error} /> : <User size={16} color={Colors.status.error} />}
                    <Text style={styles.txBizName}>{item.name}</Text>
                </View>
                <View style={[styles.badge, styles.errorBadge]}>
                    <Text style={[styles.badgeText, { color: Colors.status.error }]}>{item.type}</Text>
                </View>
            </View>
            <View style={styles.txMainInfo}>
                <Text style={styles.trustCount}>{item.count} Rejections/Cancellations</Text>
                <TouchableOpacity style={styles.banBtn} onPress={() => showAlert({ title: 'Developer Note', message: 'Banning functionality will be implemented in the next phase.', type: 'info' })}>
                    <Ban size={16} color="#fff" />
                    <Text style={styles.banText}>Review</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderTransactionItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('VerifyTransaction', { transactionId: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.bizMiniInfo}>
                    <Wallet size={16} color={Colors.primary.main} />
                    <Text style={styles.txBizName}>{item.business?.name}</Text>
                </View>
                <ChevronRight size={18} color={Colors.text.secondary} />
            </View>

            <View style={styles.txMainInfo}>
                <Text style={styles.txAmount}>{formatCurrency(item.amount)}</Text>
                <View style={[styles.badge, styles.pendingBadge]}>
                    <Text style={styles.badgeText}>Pending Top-Up</Text>
                </View>
            </View>

            <Text style={styles.txDate}>
                Requested: {new Date(item.created_at).toLocaleDateString()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Admin Panel</Text>
                    <Text style={styles.subtitle}>Platform Oversight</Text>
                </View>
                <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'businesses' && styles.activeTab]}
                    onPress={() => setActiveTab('businesses')}
                >
                    <Store size={18} color={activeTab === 'businesses' ? Colors.primary.main : Colors.text.secondary} />
                    <Text style={[styles.tabText, activeTab === 'businesses' && styles.activeTabText]}>Businesses</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
                    onPress={() => setActiveTab('transactions')}
                >
                    <Wallet size={18} color={activeTab === 'transactions' ? Colors.primary.main : Colors.text.secondary} />
                    <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>Top-Ups</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'trust' && styles.activeTab]}
                    onPress={() => setActiveTab('trust')}
                >
                    <ShieldAlert size={18} color={activeTab === 'trust' ? Colors.primary.main : Colors.text.secondary} />
                    <Text style={[styles.tabText, activeTab === 'trust' && styles.activeTabText]}>Trust</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={(activeTab === 'businesses' ? businesses : activeTab === 'transactions' ? transactions : trustMetrics) as any}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={activeTab === 'businesses' ? renderBusinessItem : activeTab === 'transactions' ? renderTransactionItem : renderTrustItem}
                contentContainerStyle={styles.list}
                refreshing={isLoading && (activeTab === 'businesses' ? businesses.length > 0 : transactions.length > 0)}
                onRefresh={fetchData}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <AlertCircle size={48} color={Colors.text.secondary} />
                            <Text style={styles.emptyText}>No pending items found.</Text>
                        </View>
                    ) : null
                }
            />
            {isLoading && (activeTab === 'businesses' ? businesses.length === 0 : transactions.length === 0) && (
                <View style={styles.centeredLoading}>
                    <ActivityIndicator size="large" color={Colors.primary.main} />
                </View>
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Layout.spacing.lg,
        paddingBottom: Layout.spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
    logoutBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: Colors.status.error + '15',
    },
    logoutText: {
        color: Colors.status.error,
        fontWeight: '600',
        fontSize: 13,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: Layout.spacing.lg,
        marginBottom: Layout.spacing.md,
        gap: Layout.spacing.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: Layout.borderRadius.md,
        backgroundColor: Colors.background.secondary,
        gap: 8,
    },
    activeTab: {
        backgroundColor: Colors.primary.main + '15',
        borderWidth: 1,
        borderColor: Colors.primary.main + '30',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    activeTabText: {
        color: Colors.primary.main,
    },
    list: {
        padding: Layout.spacing.lg,
        paddingTop: 0,
    },
    card: {
        backgroundColor: Colors.surface.primary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.md,
        marginBottom: Layout.spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.sm,
    },
    businessName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.text.primary,
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    pendingBadge: {
        backgroundColor: Colors.status.pending + '20',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    description: {
        fontSize: 14,
        color: Colors.text.secondary,
        marginBottom: Layout.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
        gap: 8,
    },
    infoText: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    actions: {
        flexDirection: 'row',
        gap: Layout.spacing.sm,
    },
    verifyButton: {
        flex: 1,
        backgroundColor: Colors.status.success,
        height: 38,
    },
    declineButton: {
        flex: 1,
        borderColor: Colors.status.error,
        borderWidth: 1,
        height: 38,
    },
    declineButtonText: {
        color: Colors.status.error,
        fontSize: 14,
    },
    bizMiniInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    txBizName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    txMainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: Layout.spacing.sm,
    },
    txAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    txDate: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    centeredLoading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    errorBadge: {
        backgroundColor: Colors.status.error + '15',
    },
    trustCount: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    banBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.status.error,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 6,
    },
    banText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
