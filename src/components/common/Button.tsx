// Reusable Button Component
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;

    const getContainerStyle = (): ViewStyle[] => {
        const base: ViewStyle[] = [styles.container, styles[`container_${size}`]];

        if (fullWidth) {
            base.push(styles.fullWidth);
        }

        switch (variant) {
            case 'primary':
                base.push(styles.primaryContainer);
                break;
            case 'secondary':
                base.push(styles.secondaryContainer);
                break;
            case 'outline':
                base.push(styles.outlineContainer);
                break;
            case 'ghost':
                base.push(styles.ghostContainer);
                break;
            case 'danger':
                base.push(styles.dangerContainer);
                break;
        }

        if (isDisabled) {
            base.push(styles.disabledContainer);
        }

        if (style) {
            base.push(style);
        }

        return base;
    };

    const getTextStyle = (): TextStyle[] => {
        const base: TextStyle[] = [styles.text, styles[`text_${size}`]];

        switch (variant) {
            case 'primary':
            case 'secondary':
            case 'danger':
                base.push(styles.textLight);
                break;
            case 'outline':
                base.push(styles.textPrimary);
                break;
            case 'ghost':
                base.push(styles.textGhost);
                break;
        }

        if (isDisabled) {
            base.push(styles.textDisabled);
        }

        if (textStyle) {
            base.push(textStyle);
        }

        return base;
    };

    const getLoaderColor = (): string => {
        switch (variant) {
            case 'outline':
            case 'ghost':
                return Colors.primary.main;
            default:
                return Colors.primary.contrast;
        }
    };

    return (
        <TouchableOpacity
            style={getContainerStyle()}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator size="small" color={getLoaderColor()} />
            ) : (
                <>
                    {icon && iconPosition === 'left' && icon}
                    <Text style={getTextStyle()}>{title}</Text>
                    {icon && iconPosition === 'right' && icon}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Layout.borderRadius.md,
        gap: Layout.spacing.sm,
    },
    fullWidth: {
        width: '100%',
    },

    // Size variants
    container_sm: {
        height: Layout.buttonHeight.sm,
        paddingHorizontal: Layout.spacing.md,
    },
    container_md: {
        height: Layout.buttonHeight.md,
        paddingHorizontal: Layout.spacing.lg,
    },
    container_lg: {
        height: Layout.buttonHeight.lg,
        paddingHorizontal: Layout.spacing.xl,
    },

    // Variant containers
    primaryContainer: {
        backgroundColor: Colors.primary.main,
    },
    secondaryContainer: {
        backgroundColor: Colors.secondary.main,
    },
    outlineContainer: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary.main,
    },
    ghostContainer: {
        backgroundColor: 'transparent',
    },
    dangerContainer: {
        backgroundColor: Colors.status.error,
    },
    disabledContainer: {
        opacity: 0.5,
    },

    // Text styles
    text: {
        fontWeight: Layout.fontWeight.semibold,
    },
    text_sm: {
        fontSize: Layout.fontSize.sm,
    },
    text_md: {
        fontSize: Layout.fontSize.md,
    },
    text_lg: {
        fontSize: Layout.fontSize.lg,
    },
    textLight: {
        color: Colors.primary.contrast,
    },
    textPrimary: {
        color: Colors.primary.main,
    },
    textGhost: {
        color: Colors.text.primary,
    },
    textDisabled: {
        color: Colors.text.tertiary,
    },
});
