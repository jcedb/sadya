// Sign Up Screen with Role Selection
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useAlert } from '../../contexts/AlertContext';
import { User, Building2, Eye, EyeOff } from 'lucide-react-native';
import {
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validatePhoneNumber,
    validateRequired,
} from '../../utils/validation';
import { SignupScreenNavigationProp } from '../../types/navigation';
import { UserRole } from '../../types/database.types';

type RoleOption = 'customer' | 'business_owner';

export const SignupScreen: React.FC = () => {
    const navigation = useNavigation<SignupScreenNavigationProp>();
    const { signUp } = useAuth();
    const { showAlert } = useAlert();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<RoleOption>('customer');

    const [fullNameError, setFullNameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = (): boolean => {
        let isValid = true;

        const cleanFullName = fullName.trim();
        const cleanEmail = email.trim();
        const cleanPhone = phoneNumber.trim();

        const nameValidation = validateRequired(cleanFullName, 'Full name');
        if (!nameValidation.isValid) {
            setFullNameError(nameValidation.error);
            isValid = false;
        } else {
            setFullNameError(null);
        }

        const emailValidation = validateEmail(cleanEmail);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.error);
            isValid = false;
        } else {
            setEmailError(null);
        }

        const phoneValidation = validatePhoneNumber(cleanPhone);
        if (!phoneValidation.isValid) {
            setPhoneError(phoneValidation.error);
            isValid = false;
        } else {
            setPhoneError(null);
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            setPasswordError(passwordValidation.error);
            isValid = false;
        } else {
            setPasswordError(null);
        }

        const confirmValidation = validatePasswordMatch(password, confirmPassword);
        if (!confirmValidation.isValid) {
            setConfirmPasswordError(confirmValidation.error);
            isValid = false;
        } else {
            setConfirmPasswordError(null);
        }

        return isValid;
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const { error } = await signUp(
                email.trim(),
                password,
                selectedRole as UserRole,
                fullName.trim(),
                phoneNumber.trim()
            );

            if (error) {
                showAlert({ title: 'Sign Up Failed', message: error, type: 'error' });
            } else {
                showAlert({
                    title: 'Account Created',
                    message: 'Please check your email to verify your account.',
                    type: 'success',
                    onConfirm: () => navigation.navigate('Login')
                });
            }
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message || 'An unexpected error occurred. Please try again.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const RoleSelector = () => (
        <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am a</Text>
            <View style={styles.roleOptions}>
                <TouchableOpacity
                    style={[
                        styles.roleOption,
                        selectedRole === 'customer' && styles.roleOptionSelected,
                    ]}
                    onPress={() => setSelectedRole('customer')}
                >
                    <User size={28} color={selectedRole === 'customer' ? Colors.primary.main : Colors.text.tertiary} />
                    <Text
                        style={[
                            styles.roleText,
                            selectedRole === 'customer' && styles.roleTextSelected,
                        ]}
                    >
                        Customer
                    </Text>
                    <Text style={styles.roleDescription}>Book services</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.roleOption,
                        selectedRole === 'business_owner' && styles.roleOptionSelected,
                    ]}
                    onPress={() => setSelectedRole('business_owner')}
                >
                    <Building2 size={28} color={selectedRole === 'business_owner' ? Colors.primary.main : Colors.text.tertiary} />
                    <Text
                        style={[
                            styles.roleText,
                            selectedRole === 'business_owner' && styles.roleTextSelected,
                        ]}
                    >
                        Business Owner
                    </Text>
                    <Text style={styles.roleDescription}>Offer services</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScreenWrapper scrollable keyboardAvoiding>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={Colors.gradients.primary as [string, string]}
                        style={styles.logoContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.logoText}>S</Text>
                    </LinearGradient>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join our community today</Text>
                </View>

                {/* Role Selector */}
                <RoleSelector />

                {/* Form */}
                <View style={styles.form}>
                    <Input
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChangeText={setFullName}
                        error={fullNameError}
                        autoCapitalize="words"
                        required
                    />

                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        error={emailError}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        required
                    />

                    <Input
                        label="Phone Number"
                        placeholder="09XX XXX XXXX"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        error={phoneError}
                        keyboardType="phone-pad"
                        required
                    />

                    <Input
                        label="Password"
                        placeholder="Create a password"
                        value={password}
                        onChangeText={setPassword}
                        error={passwordError}
                        secureTextEntry={!showPassword}
                        hint="At least 8 characters"
                        required
                    />

                    <Input
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        error={confirmPasswordError}
                        secureTextEntry={!showPassword}
                        required
                    />

                    <TouchableOpacity
                        style={styles.showPasswordToggle}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <View style={styles.showPasswordRow}>
                                <EyeOff size={16} color={Colors.text.secondary} />
                                <Text style={styles.showPasswordText}>Hide passwords</Text>
                            </View>
                        ) : (
                            <View style={styles.showPasswordRow}>
                                <Eye size={16} color={Colors.text.secondary} />
                                <Text style={styles.showPasswordText}>Show passwords</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <Button
                        title="Create Account"
                        onPress={handleSignUp}
                        loading={isLoading}
                        fullWidth
                        size="lg"
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
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
        paddingVertical: Layout.spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Layout.spacing.lg,
    },
    logoContainer: {
        width: 70,
        height: 70,
        borderRadius: Layout.borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
        ...Layout.shadow.lg,
    },
    logoText: {
        fontSize: 32,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.primary.contrast,
    },
    title: {
        fontSize: Layout.fontSize.xxl,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Layout.spacing.xs,
    },
    subtitle: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.secondary,
    },
    roleContainer: {
        marginBottom: Layout.spacing.lg,
    },
    roleLabel: {
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.medium,
        color: Colors.text.secondary,
        marginBottom: Layout.spacing.sm,
    },
    roleOptions: {
        flexDirection: 'row',
        gap: Layout.spacing.md,
    },
    roleOption: {
        flex: 1,
        backgroundColor: Colors.surface.primary,
        borderRadius: Layout.borderRadius.md,
        padding: Layout.spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.border.primary,
    },
    roleOptionSelected: {
        borderColor: Colors.primary.main,
        backgroundColor: Colors.overlay.light,
    },
    roleIcon: {
        marginBottom: Layout.spacing.xs,
    },
    showPasswordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    roleText: {
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.semibold,
        color: Colors.text.secondary,
        marginBottom: Layout.spacing.xs,
    },
    roleTextSelected: {
        color: Colors.primary.light,
    },
    roleDescription: {
        fontSize: Layout.fontSize.xs,
        color: Colors.text.tertiary,
    },
    form: {
        marginBottom: Layout.spacing.lg,
    },
    showPasswordToggle: {
        alignSelf: 'flex-start',
        marginBottom: Layout.spacing.lg,
        marginTop: -Layout.spacing.sm,
    },
    showPasswordText: {
        color: Colors.text.secondary,
        fontSize: Layout.fontSize.sm,
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
});
