// Add/Edit Service Screen
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Switch, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { createService, updateService, deleteService } from '../../services/businessService';
import { Service } from '../../types/database.types';
import { BusinessStackParamList } from '../../types/navigation';
import { validateRequired, validateNumber } from '../../utils/validation';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { getMyBusiness } from '../../services/businessService';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { ChevronLeft } from 'lucide-react-native';

type ScreenRouteProp = RouteProp<BusinessStackParamList, 'AddEditService'>;

export const AddEditServiceScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<ScreenRouteProp>();
    // If service object is passed, we are in Edit mode
    const serviceToEdit = route.params?.service;

    const { profile } = useAuth();
    const { showAlert } = useAlert();
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [name, setName] = useState(serviceToEdit?.name || '');
    const [description, setDescription] = useState(serviceToEdit?.description || '');
    const [price, setPrice] = useState(serviceToEdit?.price?.toString() || '');
    const [duration, setDuration] = useState(serviceToEdit?.duration_minutes?.toString() || '60');
    const [isOnSale, setIsOnSale] = useState(serviceToEdit?.is_on_sale || false);
    const [salePrice, setSalePrice] = useState(serviceToEdit?.sale_price?.toString() || '');

    const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

    const validateField = (field: string, value: string) => {
        let error: string | null = null;

        switch (field) {
            case 'name':
                const nameVal = validateRequired(value, 'Service Name');
                if (!nameVal.isValid) error = nameVal.error;
                break;
            case 'price':
                const priceVal = validateNumber(value, 'Price');
                if (!priceVal.isValid) error = priceVal.error;
                break;
            case 'duration':
                const durationVal = validateNumber(value, 'Duration');
                if (!durationVal.isValid) error = durationVal.error;
                break;
            case 'salePrice':
                if (isOnSale) {
                    const salePriceVal = validateNumber(value, 'Sale Price');
                    if (!salePriceVal.isValid) error = salePriceVal.error;
                    else if (parseFloat(value) >= parseFloat(price)) {
                        error = 'Sale price must be lower than original price';
                    }
                }
                break;
        }

        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors: { [key: string]: string | null } = {};

        const nameVal = validateRequired(name, 'Service Name');
        if (!nameVal.isValid) {
            newErrors.name = nameVal.error;
            isValid = false;
        }

        const priceVal = validateNumber(price, 'Price');
        if (!priceVal.isValid) {
            newErrors.price = priceVal.error;
            isValid = false;
        }

        const durationVal = validateNumber(duration, 'Duration');
        if (!durationVal.isValid) {
            newErrors.duration = durationVal.error;
            isValid = false;
        }

        if (isOnSale) {
            const salePriceVal = validateNumber(salePrice, 'Sale Price');
            if (!salePriceVal.isValid) {
                newErrors.salePrice = salePriceVal.error;
                isValid = false;
            } else if (parseFloat(salePrice) >= parseFloat(price)) {
                newErrors.salePrice = 'Sale price must be lower than original price';
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async () => {
        if (!validateForm() || !profile) return;

        setIsLoading(true);

        // First, get the business ID of the current user
        // Ideally this should be cached or passed via context/navigation
        const { data: business } = await getMyBusiness(profile.id);

        if (!business) {
            showAlert({ title: 'Error', message: 'Could not find business record', type: 'error' });
            setIsLoading(false);
            return;
        }

        const serviceData = {
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
            duration_minutes: parseInt(duration, 10),
            is_on_sale: isOnSale,
            sale_price: isOnSale ? parseFloat(salePrice) : null,
            business_id: business.id
        };

        let result;
        if (serviceToEdit) {
            result = await updateService(serviceToEdit.id, serviceData);
        } else {
            result = await createService(serviceData as any);
        }

        setIsLoading(false);

        if (result.error) {
            showAlert({ title: 'Error', message: result.error, type: 'error' });
        } else {
            showAlert({
                title: 'Success',
                message: `Service ${serviceToEdit ? 'updated' : 'created'} successfully!`,
                type: 'success',
                onConfirm: () => navigation.goBack()
            });
        }
    };

    const handleDelete = async () => {
        if (!serviceToEdit) return;

        showAlert({
            title: 'Delete Service',
            message: 'Are you sure you want to delete this service? This cannot be undone.',
            type: 'warning',
            confirmText: 'Delete',
            showCancel: true,
            onConfirm: async () => {
                setIsDeleting(true);
                const { error } = await deleteService(serviceToEdit.id);
                setIsDeleting(false);

                if (error) {
                    showAlert({ title: 'Error', message: error, type: 'error' });
                } else {
                    navigation.goBack();
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
                <Text style={styles.title}>{serviceToEdit ? 'Edit Service' : 'Add Service'}</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Input
                    label="Service Name"
                    placeholder="e.g. Haircut & Style"
                    value={name}
                    onChangeText={(val) => {
                        setName(val);
                        if (errors.name) validateField('name', val);
                    }}
                    onBlur={() => validateField('name', name)}
                    error={errors.name}
                    required
                />

                <Input
                    label="Description"
                    placeholder="Describe what's included..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    style={{ height: 80 }}
                />

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Input
                            label="Price (₱)"
                            placeholder="0.00"
                            value={price}
                            onChangeText={(val) => {
                                setPrice(val);
                                if (errors.price) validateField('price', val);
                                if (isOnSale) validateField('salePrice', salePrice);
                            }}
                            onBlur={() => validateField('price', price)}
                            keyboardType="numeric"
                            error={errors.price}
                            required
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Input
                            label="Duration (mins)"
                            placeholder="60"
                            value={duration}
                            onChangeText={(val) => {
                                setDuration(val);
                                if (errors.duration) validateField('duration', val);
                            }}
                            onBlur={() => validateField('duration', duration)}
                            keyboardType="numeric"
                            error={errors.duration}
                            required
                        />
                    </View>
                </View>

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Put on Sale?</Text>
                    <Switch
                        value={isOnSale}
                        onValueChange={(val) => {
                            setIsOnSale(val);
                            if (val) validateField('salePrice', salePrice);
                            else setErrors(prev => ({ ...prev, salePrice: null }));
                        }}
                        trackColor={{ false: Colors.background.tertiary, true: Colors.status.success }}
                        thumbColor={Colors.text.primary}
                    />
                </View>

                {isOnSale && (
                    <Input
                        label="Sale Price (₱)"
                        placeholder="0.00"
                        value={salePrice}
                        onChangeText={(val) => {
                            setSalePrice(val);
                            if (errors.salePrice) validateField('salePrice', val);
                        }}
                        onBlur={() => validateField('salePrice', salePrice)}
                        keyboardType="numeric"
                        error={errors.salePrice}
                        required
                    />
                )}

                <Button
                    title={serviceToEdit ? "Update Service" : "Create Service"}
                    onPress={handleSave}
                    loading={isLoading}
                    style={styles.saveButton}
                />

                {serviceToEdit && (
                    <Button
                        title="Delete Service"
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Layout.spacing.lg,
        paddingHorizontal: Layout.spacing.xs,
    },
    switchLabel: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    saveButton: {
        marginTop: Layout.spacing.md,
    },
    deleteButton: {
        marginTop: Layout.spacing.md,
    }
});
