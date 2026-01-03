import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { requestTopUp } from '../../services/walletService';
import { ChevronLeft, Camera, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../services/storageService';
import { parseCurrency } from '../../utils/currency';

export const TopUpScreen: React.FC = () => {
    const navigation = useNavigation();
    const { business } = useBusiness();
    const { profile } = useAuth();
    const { showAlert } = useAlert();

    const [amount, setAmount] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

    const validateField = (field: string, val: string) => {
        let error: string | null = null;
        switch (field) {
            case 'amount':
                const num = parseCurrency(val);
                if (num <= 0) error = 'Please enter a valid amount';
                break;
            case 'image':
                if (!selectedImageUri) error = 'Please upload proof of payment';
                break;
        }
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors: { [key: string]: string | null } = {};

        const num = parseCurrency(amount);
        if (num <= 0) {
            newErrors.amount = 'Please enter a valid amount';
            isValid = false;
        }

        if (!selectedImageUri) {
            newErrors.image = 'Please upload a proof of payment image';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                setSelectedImageUri(uri);
                if (errors.image) validateField('image', uri);
            }
        } catch (error) {
            showAlert({ title: 'Error', message: 'Failed to pick image', type: 'error' });
        }
    };

    const handleRequest = async () => {
        if (!validateForm()) return;
        const numAmount = parseCurrency(amount);

        if (!business?.id) return;

        setIsLoading(true);

        try {
            // 1. Upload proof image
            setIsUploading(true);
            // Assuming uploadImage now takes (uri, folder, fileName) and returns { url, error }
            // A unique file name is needed, e.g., using timestamp or UUID
            const fileName = `topup_${business.id}_${Date.now()}.jpg`;
            const { url, error: uploadError } = await uploadImage(selectedImageUri!, 'topup-proofs', fileName);
            setIsUploading(false);

            if (uploadError || !url) {
                showAlert({ title: 'Upload Failed', message: uploadError || 'Failed to upload image', type: 'error' });
                setIsLoading(false);
                return;
            }

            // 2. Create transaction record
            const { success, error: requestError } = await requestTopUp({
                business_id: business.id,
                amount: numAmount,
                type: 'top_up',
                status: 'pending',
                reference_id: referenceId || null,
                proof_image_url: url,
                created_by: profile?.id
            } as any);

            if (success) {
                showAlert({
                    title: 'Request Submitted',
                    message: 'Your top-up request has been submitted for verification. It usually takes 10-30 minutes.',
                    type: 'success',
                    onConfirm: () => navigation.goBack()
                });
            } else {
                showAlert({ title: 'Request Failed', message: requestError || 'Failed to submit request', type: 'error' });
            }
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message || 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Request Top Up</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.infoCard}>
                    <Info size={20} color={Colors.primary.main} />
                    <Text style={styles.infoText}>
                        Please transfer the amount to our GCash: <Text style={styles.bold}>0912-345-6789</Text> and upload the receipt below.
                    </Text>
                </View>

                <Input
                    label="Amount to Top Up (₱)"
                    placeholder="e.g. 500"
                    value={amount}
                    onChangeText={(val) => {
                        setAmount(val);
                        if (errors.amount) validateField('amount', val);
                    }}
                    onBlur={() => validateField('amount', amount)}
                    error={errors.amount}
                    keyboardType="numeric"
                    required
                />

                <Input
                    label="GCash Reference ID (Optional)"
                    placeholder="13-digit number"
                    value={referenceId}
                    onChangeText={setReferenceId}
                />

                <Text style={styles.label}>Proof of Payment</Text>
                <TouchableOpacity
                    style={[styles.imagePicker, errors.image ? { borderColor: Colors.status.error } : null]}
                    onPress={pickImage}
                    disabled={isUploading || isLoading}
                >
                    {selectedImageUri ? (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                            <View style={styles.changeImageOverlay}>
                                <Text style={styles.changeImageText}>Change Receipt</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            {isUploading ? (
                                <ActivityIndicator size="small" color={Colors.primary.main} />
                            ) : (
                                <>
                                    <Camera size={32} color={errors.image ? Colors.status.error : Colors.text.tertiary} />
                                    <Text style={[styles.placeholderText, errors.image ? { color: Colors.status.error } : null]}>Tap to upload receipt image</Text>
                                </>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
                {errors.image && <Text style={{ color: Colors.status.error, fontSize: 12, marginTop: -Layout.spacing.md, marginBottom: Layout.spacing.lg }}>{errors.image}</Text>}

                <Button
                    title="Submit Request"
                    onPress={handleRequest}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.submitButton}
                />
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
    infoCard: {
        backgroundColor: '#4C6EF510',
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        flexDirection: 'row',
        gap: Layout.spacing.sm,
        marginBottom: Layout.spacing.xl,
        borderWidth: 1,
        borderColor: '#4C6EF520',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
    bold: {
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    label: {
        fontSize: Layout.fontSize.md,
        fontWeight: '500',
        color: Colors.text.primary,
        marginBottom: 8,
        marginTop: Layout.spacing.md,
    },
    imagePicker: {
        width: '100%',
        height: 200,
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        borderStyle: 'dashed',
        marginBottom: Layout.spacing.xl,
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    changeImageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        alignItems: 'center',
    },
    changeImageText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        color: Colors.text.tertiary,
        fontSize: 14,
    },
    submitButton: {
        marginTop: Layout.spacing.md,
    },
});
