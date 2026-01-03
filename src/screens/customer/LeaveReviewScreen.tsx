import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';
import { Star, ChevronLeft, MessageSquare } from 'lucide-react-native';
import { createReview } from '../../services/reviewService';
import { CustomerStackParamList } from '../../types/navigation';

type LeaveReviewRouteProp = RouteProp<CustomerStackParamList, 'LeaveReview'>;

export const LeaveReviewScreen: React.FC = () => {
    const route = useRoute<LeaveReviewRouteProp>();
    const navigation = useNavigation();
    const { bookingId, businessId } = route.params;
    const { showAlert } = useAlert();
    const { profile } = useAuth();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = (field: string, val: any) => {
        let error: string | null = null;
        switch (field) {
            case 'rating':
                if (val === 0) error = 'Please select a star rating';
                break;
            case 'comment':
                // Optional field, but if we wanted minimum length for reviews:
                // if (val && val.trim().length < 10) error = 'Review is too short';
                break;
        }
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors: { [key: string]: string | null } = {};

        if (rating === 0) {
            newErrors.rating = 'Please select a star rating';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        if (!profile?.id) return;

        setIsSubmitting(true);
        try {
            const { success, error } = await createReview({
                booking_id: bookingId,
                business_id: businessId,
                customer_id: profile.id,
                rating,
                comment: comment.trim() || null,
            });

            if (success) {
                showAlert({ title: 'Success', message: 'Thank you for your review!', type: 'success' });
                navigation.goBack();
            } else {
                throw new Error(error || 'Failed to submit review');
            }
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScreenWrapper safeArea>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Leave a Review</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <MessageSquare size={48} color={Colors.primary.main} />
                    </View>
                    <Text style={styles.subtitle}>How was your experience?</Text>
                    <Text style={styles.instruction}>Your feedback helps others choose the best services and helps businesses improve.</Text>

                    {/* Star Rating */}
                    <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => {
                                    setRating(star);
                                    if (errors.rating) validateField('rating', star);
                                }}
                                activeOpacity={0.7}
                                style={styles.starWrapper}
                            >
                                <Star
                                    size={40}
                                    color={star <= rating ? Colors.primary.light : Colors.border.primary}
                                    fill={star <= rating ? Colors.primary.light : 'transparent'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.rating && <Text style={{ color: Colors.status.error, marginBottom: 8 }}>{errors.rating}</Text>}
                    <Text style={styles.ratingText}>
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                        {rating === 0 && 'Select a rating'}
                    </Text>

                    {/* Comment Area */}
                    <View style={styles.commentSection}>
                        <Text style={styles.label}>Tell us more (Optional)</Text>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Describe your service, the staff, or anything else..."
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={6}
                            placeholderTextColor={Colors.text.tertiary}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Submit Review"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={rating === 0}
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
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
        flexGrow: 1,
    },
    content: {
        padding: Layout.spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary.main + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    instruction: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: Layout.spacing.xxl,
        paddingHorizontal: Layout.spacing.md,
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    starWrapper: {
        padding: 4,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary.main,
        marginBottom: Layout.spacing.xxl,
    },
    commentSection: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    commentInput: {
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.md,
        padding: Layout.spacing.md,
        color: Colors.text.primary,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    footer: {
        padding: Layout.spacing.xl,
        backgroundColor: Colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: Colors.border.primary,
    },
});
