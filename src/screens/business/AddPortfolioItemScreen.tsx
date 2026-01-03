import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Image, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { createPortfolioItem } from '../../services/businessService';
import { ChevronLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../services/storageService';

export const AddPortfolioItemScreen: React.FC = () => {
    const navigation = useNavigation();
    const { business } = useBusiness();
    const { profile } = useAuth();
    const { showAlert } = useAlert();
    const [imageUrl, setImageUrl] = useState('');
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

    const validateField = (field: string, val: string) => {
        let error: string | null = null;
        switch (field) {
            case 'description':
                if (val.trim().length < 5) error = 'Description must be at least 5 characters';
                break;
            case 'image':
                if (!selectedImageUri && !imageUrl) error = 'Please upload or provide an image';
                break;
        }
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors: { [key: string]: string | null } = {};

        if (!selectedImageUri && !imageUrl) {
            newErrors.image = 'Please provide an image';
            isValid = false;
        }

        if (description.trim().length < 5) {
            newErrors.description = 'Description must be at least 5 characters';
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
                aspect: [1, 1],
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

    const handleSave = async () => {
        if (!validateForm()) return;

        if (!business?.id) {
            showAlert({ title: 'Error', message: 'Business not found', type: 'error' });
            return;
        }

        setIsLoading(true);

        let finalImageUrl = imageUrl;
        if (selectedImageUri) {
            setIsUploading(true);
            const { url, error } = await uploadImage('portfolios', 'items', selectedImageUri);
            setIsUploading(false);

            if (error) {
                showAlert({ title: 'Upload Failed', message: error, type: 'error' });
                setIsLoading(false);
                return;
            }
            if (url) finalImageUrl = url;
        }
        const { success, error } = await createPortfolioItem({
            business_id: business.id,
            image_url: finalImageUrl,
            description,
            service_id: null,
            created_by: profile?.id!,
            updated_by: profile?.id!
        });

        setIsLoading(false);

        if (success) {
            showAlert({
                title: 'Success',
                message: 'Portfolio item added successfully',
                type: 'success',
                onConfirm: () => navigation.goBack()
            });
        } else {
            showAlert({ title: 'Error', message: error || 'Failed to add item', type: 'error' });
        }
    };

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Add Portfolio Item</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Portfolio Image</Text>
                <TouchableOpacity
                    style={[styles.imagePicker, errors.image ? { borderColor: Colors.status.error } : null]}
                    onPress={pickImage}
                    disabled={isUploading}
                >
                    {selectedImageUri || imageUrl ? (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: selectedImageUri || imageUrl }} style={styles.previewImage} />
                            <View style={styles.changeImageOverlay}>
                                <Text style={styles.changeImageText}>Change</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            {isUploading ? (
                                <ActivityIndicator size="small" color={Colors.primary.main} />
                            ) : (
                                <>
                                    <Camera size={32} color={errors.image ? Colors.status.error : Colors.text.secondary} />
                                    <Text style={[styles.placeholderText, errors.image ? { color: Colors.status.error } : null]}>Tap to upload image</Text>
                                </>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
                {errors.image && <Text style={{ color: Colors.status.error, fontSize: 12, marginTop: -Layout.spacing.md, marginBottom: Layout.spacing.lg }}>{errors.image}</Text>}

                <Input
                    label="Description"
                    value={description}
                    onChangeText={(val) => {
                        setDescription(val);
                        if (errors.description) validateField('description', val);
                    }}
                    onBlur={() => validateField('description', description)}
                    placeholder="Short description of the work"
                    error={errors.description}
                    multiline
                    numberOfLines={3}
                    required
                />

                <Button
                    title="Add to Portfolio"
                    onPress={handleSave}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.button}
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
    label: {
        fontSize: Layout.fontSize.md,
        fontWeight: '500',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    imagePicker: {
        width: '100%',
        height: 250,
        backgroundColor: Colors.background.tertiary,
        borderRadius: Layout.borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border.primary,
        marginBottom: Layout.spacing.lg,
        ...Layout.shadow.sm,
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
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
        color: Colors.text.secondary,
        fontSize: Layout.fontSize.sm,
    },
    button: {
        marginTop: Layout.spacing.xl,
    }
});
