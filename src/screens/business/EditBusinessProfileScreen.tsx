import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { updateBusiness } from '../../services/businessService';
import { uploadImage } from '../../services/storageService';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAlert } from '../../contexts/AlertContext';
import { validateRequired, validatePhoneNumber } from '../../utils/validation';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Camera, ChevronLeft } from 'lucide-react-native';

export const EditBusinessProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const { business, refreshBusiness, setBusiness } = useBusiness();
    const { showAlert } = useAlert();
    const [isLoading, setIsLoading] = useState(false);

    const categories = ['Barber Shop', 'Salon', 'Spa', 'Nail Tech', 'Others'];
    const [category, setCategory] = useState(categories[0]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [addressText, setAddressText] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const [nameError, setNameError] = useState<string | null>(null);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

    useEffect(() => {
        if (business) {
            setName(business.name);
            setDescription(business.description || '');
            setCategory(business.category || categories[0]);
            setAddressText(business.address_text || '');
            setPhoneNumber(business.phone_number || '');
            setImageUrl(business.image_url || '');
            setSelectedImageUri(null);
        }
    }, [business]);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                setSelectedImageUri(selectedAsset.uri);
            }
        } catch (error) {
            showAlert({ title: 'Error', message: 'Failed to pick image', type: 'error' });
        }
    };

    const validateForm = () => {
        let isValid = true;

        const nameVal = validateRequired(name, 'Business Name');
        if (!nameVal.isValid) {
            setNameError(nameVal.error);
            isValid = false;
        } else {
            setNameError(null);
        }

        const addressVal = validateRequired(addressText, 'Address');
        if (!addressVal.isValid) {
            setAddressError(addressVal.error);
            isValid = false;
        } else {
            setAddressError(null);
        }

        const phoneVal = validatePhoneNumber(phoneNumber);
        if (!phoneVal.isValid) {
            setPhoneError(phoneVal.error);
            isValid = false;
        } else {
            setPhoneError(null);
        }

        return isValid;
    };

    const handleSave = async () => {
        if (!validateForm() || !business) return;

        setIsLoading(true);

        // Upload image if selected
        let finalImageUrl = imageUrl;
        if (selectedImageUri) {
            setIsUploading(true);
            const { url, error: uploadError } = await uploadImage('business', 'covers', selectedImageUri);
            setIsUploading(false);

            if (uploadError) {
                showAlert({ title: 'Upload Failed', message: uploadError, type: 'error' });
                setIsLoading(false);
                return;
            }
            if (url) {
                finalImageUrl = url;
            }
        }

        const { data, error } = await updateBusiness(business.id, {
            name: name.trim(),
            description: description.trim(),
            address_text: addressText.trim(),
            phone_number: phoneNumber.trim(),
            image_url: finalImageUrl.trim() || null,
            category: category,
        });

        setIsLoading(false);

        if (error) {
            showAlert({ title: 'Error', message: error, type: 'error' });
        } else if (data) {
            await refreshBusiness();
            showAlert({
                title: 'Success',
                message: 'Business profile updated successfully!',
                type: 'success',
                onConfirm: () => {
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    }
                }
            });
        }
    };

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Sticky Header */}
            <View style={styles.header}>
                {(navigation as any).canGoBack() && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color={Colors.text.primary} size={28} />
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>Edit Business</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Business Category</Text>
                <View style={styles.categoryContainer}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryBadge, category === cat && styles.categoryBadgeActive]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Input
                    label="Business Name"
                    placeholder="e.g. Joy's Salon"
                    value={name}
                    onChangeText={setName}
                    error={nameError}
                    required
                />

                <Input
                    label="Description"
                    placeholder="Tell us about your services..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <Input
                    label="Address"
                    placeholder="Complete address"
                    value={addressText}
                    onChangeText={setAddressText}
                    error={addressError}
                    required
                />

                <Input
                    label="Business Phone"
                    placeholder="09XX XXX XXXX"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    error={phoneError}
                    keyboardType="phone-pad"
                    required
                />

                <Text style={styles.label}>Cover Image</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={isUploading}>
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
                                    <Camera size={32} color={Colors.text.secondary} />
                                    <Text style={styles.placeholderText}>Tap to upload cover image</Text>
                                </>
                            )}
                        </View>
                    )}
                </TouchableOpacity>

                <Button
                    title="Save Changes"
                    onPress={handleSave}
                    loading={isLoading}
                    fullWidth
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
        padding: Layout.spacing.md,
        paddingBottom: 40,
    },
    button: {
        marginTop: Layout.spacing.lg,
    },
    label: {
        fontSize: Layout.fontSize.md,
        fontWeight: '500',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: Layout.spacing.lg,
    },
    categoryBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.background.secondary,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    categoryBadgeActive: {
        backgroundColor: Colors.primary.main,
        borderColor: Colors.primary.main,
    },
    categoryText: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    imagePicker: {
        width: '100%',
        height: 200,
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border.primary,
        borderStyle: 'dashed',
        marginBottom: Layout.spacing.lg,
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
});
