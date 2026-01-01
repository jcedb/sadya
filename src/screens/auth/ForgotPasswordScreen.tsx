// Forgot Password Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Mail, Lock, ChevronLeft } from 'lucide-react-native';
import { validateEmail } from '../../utils/validation';
import { ForgotPasswordScreenNavigationProp } from '../../types/navigation';

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
    const { resetPassword } = useAuth();
    const { showAlert } = useAlert();

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const validateForm = (): boolean => {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.error);
            return false;
        }
        setEmailError(null);
        return true;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const { error } = await resetPassword(email);

            if (error) {
                showAlert({ title: 'Error', message: error, type: 'error' });
            } else {
                setEmailSent(true);
            }
        } catch (error) {
            showAlert({ title: 'Error', message: 'An unexpected error occurred. Please try again.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <ScreenWrapper>
                <View style={styles.container}>
                    <View style={styles.successContainer}>
                        <View style={styles.iconContainer}>
                            <Mail size={40} color={Colors.primary.main} />
                        </View>
                        <Text style={styles.successTitle}>Check Your Email</Text>
                        <Text style={styles.successMessage}>
                            We've sent password reset instructions to:
                        </Text>
                        <Text style={styles.emailText}>{email}</Text>
                        <Text style={styles.spamNote}>
                            If you don't see the email, check your spam folder.
                        </Text>

                        <Button
                            title="Back to Login"
                            onPress={() => navigation.navigate('Login')}
                            fullWidth
                            size="lg"
                            style={styles.backButton}
                        />

                        <TouchableOpacity onPress={() => setEmailSent(false)}>
                            <Text style={styles.tryAgain}>Try a different email</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper scrollable keyboardAvoiding>
            <View style={styles.container}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backArrow}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color={Colors.text.primary} size={28} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Lock size={36} color={Colors.primary.main} />
                    </View>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        No worries! Enter your email address and we'll send you instructions to reset your password.
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        error={emailError}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Button
                        title="Send Reset Link"
                        onPress={handleResetPassword}
                        loading={isLoading}
                        fullWidth
                        size="lg"
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Remember your password?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.signInLink}> Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: Layout.spacing.lg,
    },
    backArrow: {
        marginBottom: Layout.spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: Layout.spacing.xxl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: Layout.borderRadius.full,
        backgroundColor: Colors.surface.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Layout.spacing.lg,
    },
    lockIcon: {
        fontSize: 36,
    },
    successIcon: {
        fontSize: 40,
    },
    title: {
        fontSize: Layout.fontSize.xxl,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Layout.spacing.sm,
    },
    subtitle: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    form: {
        marginBottom: Layout.spacing.xl,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: Colors.text.secondary,
        fontSize: Layout.fontSize.md,
    },
    signInLink: {
        color: Colors.primary.light,
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.semibold,
    },
    // Success state styles
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.lg,
    },
    successTitle: {
        fontSize: Layout.fontSize.xxl,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Layout.spacing.md,
    },
    successMessage: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: Layout.spacing.sm,
    },
    emailText: {
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.semibold,
        color: Colors.primary.light,
        marginBottom: Layout.spacing.lg,
    },
    spamNote: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginBottom: Layout.spacing.xxl,
    },
    backButton: {
        marginBottom: Layout.spacing.md,
    },
    tryAgain: {
        color: Colors.text.link,
        fontSize: Layout.fontSize.md,
    },
});
