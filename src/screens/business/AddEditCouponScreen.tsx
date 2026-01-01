// Add/Edit Coupon Screen - Create or modify discount rules
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ChevronLeft, Ticket } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { BusinessStackParamList } from '../../types/navigation';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { createCoupon, updateCoupon, deleteCoupon, Coupon } from '../../services/couponService';

type ScreenRouteProp = RouteProp<BusinessStackParamList, 'AddEditCoupon'>;

export const AddEditCouponScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<ScreenRouteProp>();
    const { coupon } = route.params;
    const { business } = useBusiness();
    const { profile } = useAuth();
    const { showAlert } = useAlert();
    const [isDeleting, setIsDeleting] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState(coupon?.code || '');
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>(coupon?.discount_type || 'percentage');
    const [value, setValue] = useState(coupon?.value?.toString() || '');
    const [minSpend, setMinSpend] = useState(coupon?.min_spend?.toString() || '0');
    const [usageLimit, setUsageLimit] = useState(coupon?.usage_limit?.toString() || '10');
    const [expiryDays, setExpiryDays] = useState('30'); // Default 30 days for simplicity in MVP

    const handleSave = async () => {
        if (!code || !value) {
            showAlert({ title: 'Required Fields', message: 'Please provide both a code and a discount value.', type: 'error' });
            return;
        }

        if (!business?.id) return;

        setIsLoading(true);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

        const couponData = {
            business_id: business.id,
            code: code.toUpperCase(),
            discount_type: discountType,
            value: parseFloat(value),
            min_spend: parseFloat(minSpend),
            usage_limit: parseInt(usageLimit),
            expires_at: expiresAt.toISOString(),
            updated_by: profile?.id
        };

        const { success, error } = coupon ?
            await updateCoupon(coupon.id, couponData) :
            await createCoupon({ ...couponData, created_by: profile?.id! } as any);

        setIsLoading(false);

        if (success) {
            showAlert({
                title: 'Success',
                message: coupon ? 'Coupon updated successfully!' : 'Coupon created successfully!',
                type: 'success'
            });
            navigation.goBack();
        } else {
            showAlert({ title: 'Error', message: error || 'Failed to save coupon', type: 'error' });
        }
    };

    const handleDelete = async () => {
        if (!coupon) return;

        showAlert({
            title: 'Delete Coupon',
            message: 'Are you sure you want to delete this coupon? This cannot be undone.',
            type: 'warning',
            confirmText: 'Delete',
            showCancel: true,
            onConfirm: async () => {
                setIsDeleting(true);
                const { success, error } = await deleteCoupon(coupon.id);
                setIsDeleting(false);

                if (success) {
                    navigation.goBack();
                } else {
                    showAlert({ title: 'Error', message: error || 'Failed to delete coupon', type: 'error' });
                }
            }
        });
    };

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>{coupon ? 'Edit Coupon' : 'Add Coupon'}</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                <Input
                    label="Coupon Code"
                    value={code}
                    onChangeText={setCode}
                    placeholder="e.g. SAVE20"
                    autoCapitalize="characters"
                />

                <Text style={styles.label}>Discount Type</Text>
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeButton, discountType === 'percentage' && styles.typeButtonActive]}
                        onPress={() => setDiscountType('percentage')}
                    >
                        <Text style={[styles.typeButtonText, discountType === 'percentage' && styles.typeButtonTextActive]}>Percentage (%)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, discountType === 'fixed' && styles.typeButtonActive]}
                        onPress={() => setDiscountType('fixed')}
                    >
                        <Text style={[styles.typeButtonText, discountType === 'fixed' && styles.typeButtonTextActive]}>Fixed (₱)</Text>
                    </TouchableOpacity>
                </View>

                <Input
                    label="Discount Value"
                    value={value}
                    onChangeText={setValue}
                    placeholder={discountType === 'percentage' ? "e.g. 20" : "e.g. 100"}
                    keyboardType="numeric"
                    hint={discountType === 'percentage' ? "Percentage off the total price." : "Fixed amount off the total price."}
                />

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Input
                            label="Min Spend (₱)"
                            value={minSpend}
                            onChangeText={setMinSpend}
                            placeholder="e.g. 500"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Input
                            label="Usage Limit"
                            value={usageLimit}
                            onChangeText={setUsageLimit}
                            placeholder="e.g. 50"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <Input
                    label="Validity (Days)"
                    value={expiryDays}
                    onChangeText={setExpiryDays}
                    placeholder="e.g. 30"
                    keyboardType="numeric"
                    hint="Number of days from today before the coupon expires."
                />

                <Button
                    title={coupon ? 'Update Coupon' : 'Create Coupon'}
                    onPress={handleSave}
                    loading={isLoading}
                    style={styles.saveButton}
                />

                {coupon && (
                    <Button
                        title="Delete Coupon"
                        onPress={handleDelete}
                        variant="danger"
                        loading={isDeleting}
                        style={styles.deleteButton}
                    />
                )}
            </ScrollView>
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
    scrollContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 40,
    },
    label: {
        fontSize: Layout.fontSize.sm,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: Layout.spacing.sm,
        marginBottom: Layout.spacing.md,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: Layout.borderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        alignItems: 'center',
        backgroundColor: Colors.background.secondary,
    },
    typeButtonActive: {
        borderColor: Colors.primary.main,
        backgroundColor: Colors.primary.main + '10',
    },
    typeButtonText: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
    },
    typeButtonTextActive: {
        color: Colors.primary.main,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    saveButton: {
        marginTop: Layout.spacing.md,
    },
    deleteButton: {
        marginTop: Layout.spacing.md,
    }
});
