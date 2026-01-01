// Reusable Input Component
import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
    Platform,
    RefreshControl,
    ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string | null;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
    required?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    required = false,
    style,
    onFocus,
    onBlur,
    ...textInputProps
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const getInputContainerStyle = (): ViewStyle[] => {
        const base: ViewStyle[] = [styles.inputContainer];

        if (isFocused) {
            base.push(styles.inputContainerFocused);
        }

        if (error) {
            base.push(styles.inputContainerError);
        }

        if (textInputProps.multiline) {
            base.push(styles.inputContainerMultiline);
        }

        return base;
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}

            <View style={getInputContainerStyle()}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    style={[
                        styles.input,
                        leftIcon ? styles.inputWithLeftIcon : null,
                        rightIcon ? styles.inputWithRightIcon : null,
                        textInputProps.multiline ? styles.inputMultiline : null,
                        style,
                    ]}
                    placeholderTextColor={Colors.text.secondary}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    textAlignVertical={textInputProps.multiline ? 'top' : 'center'}
                    {...textInputProps}
                />

                {rightIcon && (
                    <TouchableOpacity
                        style={styles.rightIcon}
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
            {hint && !error && <Text style={styles.hint}>{hint}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Layout.spacing.md,
    },
    label: {
        fontSize: Layout.fontSize.sm,
        fontWeight: Layout.fontWeight.medium,
        color: Colors.text.secondary,
        marginBottom: Layout.spacing.xs,
    },
    required: {
        color: Colors.status.error,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.tertiary,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        height: Layout.inputHeight.md,
    },
    inputContainerMultiline: {
        height: undefined,
        minHeight: 100,
        alignItems: 'flex-start',
        paddingVertical: Layout.spacing.sm,
    },
    inputContainerFocused: {
        borderColor: Colors.border.focus,
        borderWidth: 2,
    },
    inputContainerError: {
        borderColor: Colors.status.error,
    },
    input: {
        flex: 1,
        fontSize: Layout.fontSize.md,
        color: Colors.text.primary,
        paddingHorizontal: Layout.spacing.md,
        height: '100%',
    },
    inputMultiline: {
        height: undefined,
        minHeight: 80,
        paddingTop: Platform.OS === 'ios' ? 4 : 0,
    },
    inputWithLeftIcon: {
        paddingLeft: 0,
    },
    inputWithRightIcon: {
        paddingRight: 0,
    },
    leftIcon: {
        paddingLeft: Layout.spacing.md,
    },
    rightIcon: {
        paddingRight: Layout.spacing.md,
        paddingLeft: Layout.spacing.sm,
    },
    error: {
        fontSize: Layout.fontSize.sm,
        color: Colors.status.error,
        marginTop: Layout.spacing.xs,
    },
    hint: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.tertiary,
        marginTop: Layout.spacing.xs,
    },
});
