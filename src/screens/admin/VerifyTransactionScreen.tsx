import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAlert } from '../../contexts/AlertContext';
import { verifyTransaction } from '../../services/walletService';
import { AdminStackParamList } from '../../types/navigation';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import { ChevronLeft, Calendar, User, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';
import { supabase } from '../../services/supabase';

type VerifyTransactionRouteProp = RouteProp<AdminStackParamList, 'VerifyTransaction'>;

export const VerifyTransactionScreen: React.FC = () => {
    const route = useRoute<VerifyTransactionRouteProp>();
    const navigation = useNavigation();
    const { showAlert } = useAlert();
    const { transactionId } = route.params;

    const [transaction, setTransaction] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        fetchTransaction();
    }, [transactionId]);

    const fetchTransaction = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('wallet_transactions')
                .select('*, business:businesses(id, name)')
                .eq('id', transactionId)
                .single();

            if (error) throw error;
            setTransaction(data);
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (status: 'approved' | 'rejected') => {
        const title = status === 'approved' ? 'Approve Top-Up' : 'Reject Top-Up';
        const message = status === 'approved'
            ? `Are you sure you want to approve this top-up of ${formatCurrency(transaction.amount)}?`
            : `Are you sure you want to reject this top-up?`;

        showAlert({
            title,
            message,
            type: 'warning',
            showCancel: true,
            confirmText: status === 'approved' ? 'Approve' : 'Reject',
            onConfirm: async () => {
                setIsProcessing(true);
                const { success, error } = await verifyTransaction(transactionId, status, adminNotes);
                setIsProcessing(false);

                if (success) {
                    showAlert({
                        title: 'Success',
                        message: `Transaction ${status} successfully`,
                        type: 'success',
                        onConfirm: () => navigation.goBack()
                    });
                } else {
                    showAlert({ title: 'Error', message: error || 'Failed to process transaction', type: 'error' });
                }
            }
        });
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

    if (!transaction) return null;

    return (
        <ScreenWrapper scrollable>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Verify Top-Up</Text>
            </View>

            <View style={styles.container}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, transaction.status === 'pending' ? styles.pendingBadge : styles.completedBadge]}>
                    <Text style={styles.statusText}>{transaction.status.toUpperCase()}</Text>
                </View>

                {/* Amount Section */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Requested Amount</Text>
                    <Text style={styles.amountValue}>{formatCurrency(transaction.amount)}</Text>
                </View>

                {/* Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Transaction Details</Text>

                    <View style={styles.detailRow}>
                        <User size={18} color={Colors.text.secondary} />
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Business</Text>
                            <Text style={styles.detailValue}>{transaction.business?.name}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Calendar size={18} color={Colors.text.secondary} />
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Date Requested</Text>
                            <Text style={styles.detailValue}>
                                {format(new Date(transaction.created_at), 'MMMM d, yyyy • h:mm a')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <FileText size={18} color={Colors.text.secondary} />
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Reference ID</Text>
                            <Text style={styles.detailValue}>{transaction.reference_id || 'Not provided'}</Text>
                        </View>
                    </View>
                </View>

                {/* Proof of Payment */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Proof of Payment</Text>
                    {transaction.proof_image_url ? (
                        <TouchableOpacity
                            onPress={() => showAlert({ title: 'Proof of Payment', message: 'See high-resolution proof image.', type: 'info' })}
                        >
                            <Image source={{ uri: transaction.proof_image_url }} style={styles.proofImage} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.noProofContainer}>
                            <AlertCircle size={32} color={Colors.text.secondary} />
                            <Text style={styles.noProofText}>No proof of payment uploaded</Text>
                        </View>
                    )}
                </View>

                {/* Admin Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Admin Notes (Internal)</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Add notes for this transaction..."
                        placeholderTextColor={Colors.text.secondary}
                        multiline
                        numberOfLines={3}
                        value={adminNotes}
                        onChangeText={setAdminNotes}
                        editable={transaction.status === 'pending'}
                    />
                </View>

                {/* Action Buttons */}
                {transaction.status === 'pending' && (
                    <View style={styles.actions}>
                        <Button
                            title="Approve Top-Up"
                            onPress={() => handleAction('approved')}
                            loading={isProcessing}
                            style={styles.approveButton}
                            icon={<CheckCircle2 size={20} color="white" />}
                        />
                        <Button
                            title="Reject Request"
                            onPress={() => handleAction('rejected')}
                            loading={isProcessing}
                            variant="outline"
                            style={styles.rejectButton}
                            textStyle={styles.rejectButtonText}
                            icon={<XCircle size={20} color={Colors.status.error} />}
                        />
                    </View>
                )}
            </View>
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
        padding: Layout.spacing.lg,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: Layout.spacing.lg,
    },
    pendingBadge: {
        backgroundColor: Colors.status.pending + '20', // Reduced opacity
    },
    completedBadge: {
        backgroundColor: Colors.status.success + '20',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text.primary,
        letterSpacing: 0.5,
    },
    amountCard: {
        backgroundColor: Colors.primary.main,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.xl,
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    amountLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
    },
    amountValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
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
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
        backgroundColor: Colors.background.secondary,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
    },
    detailTextContainer: {
        marginLeft: Layout.spacing.md,
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    proofImage: {
        width: '100%',
        height: 250,
        borderRadius: Layout.borderRadius.md,
        backgroundColor: Colors.background.secondary,
        resizeMode: 'contain',
    },
    noProofContainer: {
        width: '100%',
        height: 200,
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.primary,
        borderStyle: 'dashed',
    },
    noProofText: {
        marginTop: 8,
        color: Colors.text.secondary,
        fontSize: 14,
    },
    notesInput: {
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.md,
        padding: Layout.spacing.md,
        color: Colors.text.primary,
        fontSize: 14,
        textAlignVertical: 'top',
        minHeight: 100,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    actions: {
        gap: Layout.spacing.md,
        marginTop: Layout.spacing.md,
    },
    approveButton: {
        backgroundColor: Colors.status.success,
    },
    rejectButton: {
        borderColor: Colors.status.error,
        borderWidth: 1,
    },
    rejectButtonText: {
        color: Colors.status.error,
    },
});
