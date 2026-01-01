import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAlert } from '../../contexts/AlertContext';
import { verifyBusiness, declineBusiness } from '../../services/businessService';
import { AdminStackParamList } from '../../types/navigation';
import { format } from 'date-fns';
import { ChevronLeft, Calendar, User, Phone, MapPin, Store, CheckCircle2, XCircle, Mail } from 'lucide-react-native';
import { supabase } from '../../services/supabase';

type VerifyBusinessRouteProp = RouteProp<AdminStackParamList, 'VerifyBusiness'>;

export const VerifyBusinessScreen: React.FC = () => {
    const route = useRoute<VerifyBusinessRouteProp>();
    const navigation = useNavigation();
    const { showAlert } = useAlert();
    const { businessId } = route.params;

    const [business, setBusiness] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchBusiness();
    }, [businessId]);

    const fetchBusiness = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('businesses')
                .select('*, owner:profiles!businesses_owner_id_fkey(id, full_name, email, avatar_url)')
                .eq('id', businessId)
                .single();

            if (error) throw error;
            setBusiness(data);
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'decline') => {
        const title = action === 'approve' ? 'Approve Business' : 'Decline Business';
        const message = action === 'approve'
            ? `Are you sure you want to approve ${business.name}?`
            : `Are you sure you want to decline and REMOVE ${business.name}'s application? This cannot be undone.`;

        showAlert({
            title,
            message,
            type: 'warning',
            showCancel: true,
            confirmText: action === 'approve' ? 'Approve' : 'Decline',
            onConfirm: async () => {
                setIsProcessing(true);
                let success, error;

                if (action === 'approve') {
                    const result = await verifyBusiness(businessId);
                    success = result.success;
                    error = result.error;
                } else {
                    const result = await declineBusiness(businessId);
                    success = result.success;
                    error = result.error;
                }

                setIsProcessing(false);

                if (success) {
                    showAlert({
                        title: 'Success',
                        message: `Business ${action}d successfully`,
                        type: 'success',
                        onConfirm: () => navigation.goBack()
                    });
                } else {
                    showAlert({ title: 'Error', message: error || `Failed to ${action} business`, type: 'error' });
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

    if (!business) return null;

    return (
        <ScreenWrapper scrollable>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Verify Business</Text>
            </View>

            <View style={styles.container}>
                {/* Image Section */}
                <View style={styles.imageSection}>
                    {business.image_url ? (
                        <Image source={{ uri: business.image_url }} style={styles.coverImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Store size={48} color={Colors.text.secondary} />
                            <Text style={styles.placeholderText}>No Cover Image</Text>
                        </View>
                    )}
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>PENDING VERIFICATION</Text>
                    </View>
                </View>

                {/* Business Info */}
                <View style={styles.section}>
                    <Text style={styles.businessName}>{business.name}</Text>
                    <Text style={styles.description}>{business.description || 'No description provided.'}</Text>
                </View>

                {/* Details List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Business Details</Text>

                    <View style={styles.detailRow}>
                        <MapPin size={18} color={Colors.primary.main} />
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Location</Text>
                            <Text style={styles.detailValue}>{business.address_text || 'No address'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Phone size={18} color={Colors.primary.main} />
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Business Phone</Text>
                            <Text style={styles.detailValue}>{business.phone_number || 'No phone'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Calendar size={18} color={Colors.primary.main} />
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Date Applied</Text>
                            <Text style={styles.detailValue}>
                                {format(new Date(business.created_at), 'MMMM d, yyyy')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Owner Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Owner Information</Text>
                    <View style={styles.ownerCard}>
                        <View style={styles.ownerAvatar}>
                            {business.owner?.avatar_url ? (
                                <Image source={{ uri: business.owner.avatar_url }} style={styles.avatar} />
                            ) : (
                                <User size={24} color={Colors.text.secondary} />
                            )}
                        </View>
                        <View style={styles.ownerInfo}>
                            <Text style={styles.ownerName}>{business.owner?.full_name || 'Unknown'}</Text>
                            <View style={styles.ownerEmailRow}>
                                <Mail size={12} color={Colors.text.secondary} />
                                <Text style={styles.ownerEmail}>{business.owner?.email}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <Button
                        title="Approve Business"
                        onPress={() => handleAction('approve')}
                        loading={isProcessing}
                        style={styles.approveButton}
                        icon={<CheckCircle2 size={20} color="white" />}
                    />
                    <Button
                        title="Decline & Delete"
                        onPress={() => handleAction('decline')}
                        loading={isProcessing}
                        variant="outline"
                        style={styles.rejectButton}
                        textStyle={styles.rejectButtonText}
                        icon={<XCircle size={20} color={Colors.status.error} />}
                    />
                </View>
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
    imageSection: {
        width: '100%',
        height: 200,
        borderRadius: Layout.borderRadius.lg,
        overflow: 'hidden',
        marginBottom: Layout.spacing.lg,
        backgroundColor: Colors.background.secondary,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        color: Colors.text.secondary,
        fontSize: 14,
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: Colors.status.pending,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: Layout.spacing.xl,
    },
    businessName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: Colors.text.secondary,
        lineHeight: 22,
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
    ownerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface.primary,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    ownerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    ownerInfo: {
        marginLeft: Layout.spacing.md,
        flex: 1,
    },
    ownerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    ownerEmailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ownerEmail: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    actions: {
        gap: Layout.spacing.md,
        marginTop: Layout.spacing.sm,
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
