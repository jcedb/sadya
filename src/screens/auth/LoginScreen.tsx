// Login Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { validateEmail, validateRequired } from '../../utils/validation';
import { LoginScreenNavigationProp } from '../../types/navigation';

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { signIn } = useAuth();
    const { showAlert } = useAlert();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = (): boolean => {
        let isValid = true;

        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.error);
            isValid = false;
        } else {
            setEmailError(null);
        }

        const passwordValidation = validateRequired(password, 'Password');
        if (!passwordValidation.isValid) {
            setPasswordError(passwordValidation.error);
            isValid = false;
        } else {
            setPasswordError(null);
        }

        return isValid;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const { error } = await signIn(email, password);

            if (error) {
                showAlert({ title: 'Login Failed', message: error, type: 'error' });
            }
            // Navigation will happen automatically via AuthContext
        } catch (error) {
            showAlert({ title: 'Error', message: 'An unexpected error occurred. Please try again.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

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
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue booking services</Text>
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

                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        error={passwordError}
                        secureTextEntry={!showPassword}
                        rightIcon={
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
                            </TouchableOpacity>
                        }
                    />

                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <Button
                        title="Sign In"
                        onPress={handleLogin}
                        loading={isLoading}
                        fullWidth
                        size="lg"
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.signUpLink}> Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: Layout.spacing.xxl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Layout.spacing.xxl,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: Layout.borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Layout.spacing.lg,
        ...Layout.shadow.lg,
    },
    logoText: {
        fontSize: 40,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.primary.contrast,
    },
    title: {
        fontSize: Layout.fontSize.xxxl,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Layout.spacing.xs,
    },
    subtitle: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.secondary,
    },
    form: {
        marginBottom: Layout.spacing.xl,
    },
    showHide: {
        color: Colors.primary.light,
        fontSize: Layout.fontSize.sm,
        fontWeight: Layout.fontWeight.medium,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: Layout.spacing.lg,
        marginTop: -Layout.spacing.sm,
    },
    forgotPasswordText: {
        color: Colors.text.link,
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
    signUpLink: {
        color: Colors.primary.light,
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.semibold,
    },
});
