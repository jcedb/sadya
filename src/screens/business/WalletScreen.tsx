import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useBusiness } from '../../contexts/BusinessContext';
import { getWalletTransactions, WalletTransaction } from '../../services/walletService';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';

export const WalletScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { business, refreshBusiness } = useBusiness();
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = useCallback(async () => {
        if (!business?.id) return;
        try {
            const { success, data } = await getWalletTransactions(business.id);
            if (success) {
                setTransactions(data || []);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [business?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
            refreshBusiness();

            return () => { };
        }, [fetchTransactions, refreshBusiness])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
        refreshBusiness();
    };

    const renderTransaction = ({ item }: { item: WalletTransaction }) => {
        const status = item.status || 'pending';
        const isPositive = ['top_up', 'refund'].includes(item.type);
        const typeLabel = (item.type || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        return (
            <View style={styles.transactionItem}>
                <View style={[styles.transactionIcon, { backgroundColor: isPositive ? '#40C05715' : '#FF922B15' }]}>
                    {isPositive ? (
                        <ArrowDownLeft size={20} color="#40C057" />
                    ) : (
                        <ArrowUpRight size={20} color="#FF922B" />
                    )}
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionType}>{typeLabel}</Text>
                    <Text style={styles.transactionDate}>
                        {item.created_at ? format(new Date(item.created_at), 'MMM dd, yyyy • HH:mm') : 'N/A'}
                    </Text>
                </View>
                <View style={styles.transactionAmountContainer}>
                    <Text style={[styles.transactionAmount, { color: isPositive ? '#40C057' : '#FF922B' }]}>
                        {isPositive ? '+' : '-'}{formatCurrency(item.amount)}
                    </Text>
                    <View style={[styles.statusBadge, styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}` as keyof typeof styles] as any]}>
                        <Text style={[styles.statusText, styles[`statusText${status.charAt(0).toUpperCase() + status.slice(1)}` as keyof typeof styles] as any]}>
                            {status.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Wallet</Text>
            </View>

            {/* Scrollable Content */}
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={renderTransaction}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary.main} />
                }
                ListHeaderComponent={
                    <View>
                        <View style={styles.balanceCard}>
                            <View>
                                <Text style={styles.balanceLabel}>Available Balance</Text>
                                <Text style={styles.balanceValue}>{formatCurrency(business?.wallet_balance || 0)}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.topUpButton}
                                onPress={() => navigation.navigate('TopUp')}
                            >
                                <Plus size={20} color="#fff" />
                                <Text style={styles.topUpText}>Top Up</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>Transaction History</Text>
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator size="large" color={Colors.primary.main} style={{ marginTop: 40 }} />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Clock size={48} color={Colors.text.tertiary} style={styles.emptyIcon} />
                            <Text style={styles.emptyTitle}>No Transactions</Text>
                            <Text style={styles.emptyText}>Your financial activities will appear here.</Text>
                        </View>
                    )
                }
            />
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
        paddingBottom: Layout.spacing.xl,
    },
    balanceCard: {
        backgroundColor: Colors.primary.main,
        borderRadius: Layout.borderRadius.xl,
        padding: Layout.spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    balanceValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    topUpButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    topUpText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: Layout.spacing.md,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface.primary,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.lg,
        marginBottom: Layout.spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Layout.spacing.md,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionType: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 12,
        color: Colors.text.tertiary,
    },
    transactionAmountContainer: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusPending: {
        backgroundColor: '#FFF4E6',
    },
    statusApproved: {
        backgroundColor: '#EBFBEE',
    },
    statusRejected: {
        backgroundColor: '#FFF5F5',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusTextPending: {
        color: '#FD7E14',
    },
    statusTextApproved: {
        color: '#40C057',
    },
    statusTextRejected: {
        color: '#FA5252',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: Layout.spacing.xl,
        marginTop: 20,
    },
    emptyIcon: {
        marginBottom: Layout.spacing.md,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.secondary,
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.tertiary,
    },
});
