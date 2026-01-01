import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react-native';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<AlertOptions>({ title: '', message: '' });
    const [fadeAnim] = useState(new Animated.Value(0));

    const showAlert = (newOptions: AlertOptions) => {
        setOptions({
            ...newOptions,
            type: newOptions.type || 'info', // Default to info
            confirmText: newOptions.confirmText || 'OK',
            cancelText: newOptions.cancelText || 'Cancel',
            showCancel: newOptions.showCancel !== undefined ? newOptions.showCancel : !!newOptions.onCancel,
        });
        setVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
        }).start();
    };

    const hideAlert = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
        });
    };

    const handleConfirm = () => {
        if (options.onConfirm) options.onConfirm();
        hideAlert();
    };

    const handleCancel = () => {
        if (options.onCancel) options.onConfirm && options.onCancel(); // Call cancel if exists
        hideAlert();
    };

    const getIcon = () => {
        const size = 48;
        const iconProps = { size, strokeWidth: 2 };

        switch (options.type) {
            case 'success':
                return (
                    <View style={[styles.iconBg, { backgroundColor: Colors.status.success + '15' }]}>
                        <CheckCircle {...iconProps} color={Colors.status.success} />
                    </View>
                );
            case 'error':
                return (
                    <View style={[styles.iconBg, { backgroundColor: Colors.status.error + '15' }]}>
                        <XCircle {...iconProps} color={Colors.status.error} />
                    </View>
                );
            case 'warning':
                return (
                    <View style={[styles.iconBg, { backgroundColor: Colors.status.pending + '15' }]}>
                        <AlertCircle {...iconProps} color={Colors.status.pending} />
                    </View>
                );
            default:
                return (
                    <View style={[styles.iconBg, { backgroundColor: Colors.primary.main + '15' }]}>
                        <Info {...iconProps} color={Colors.primary.main} />
                    </View>
                );
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {visible && (
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    <Animated.View
                        style={[
                            styles.container,
                            {
                                opacity: fadeAnim,
                                transform: [{
                                    scale: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.95, 1]
                                    })
                                }]
                            }
                        ]}
                    >
                        <View style={styles.iconContainer}>
                            {getIcon()}
                        </View>
                        <Text style={styles.title}>{options.title}</Text>
                        <Text style={styles.message}>{options.message}</Text>

                        <View style={styles.buttonContainer}>
                            {options.showCancel && (
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                                    <Text style={styles.cancelText}>{options.cancelText}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.confirmButton,
                                    options.type === 'error' && styles.errorButton,
                                    options.type === 'success' && styles.successButton
                                ]}
                                onPress={handleConfirm}
                            >
                                <Text style={styles.confirmText}>{options.confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Animated.View>
            )}
        </AlertContext.Provider>
    );
};

export const useAlert = (): AlertContextType => {
    const context = useContext(AlertContext);
    if (!context) throw new Error('useAlert must be used within an AlertProvider');
    return context;
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        elevation: 10,
    },
    container: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.background.tertiary,
    },
    confirmButton: {
        backgroundColor: Colors.primary.main,
    },
    errorButton: {
        backgroundColor: Colors.status.error,
    },
    successButton: {
        backgroundColor: Colors.status.success,
    },
    cancelText: {
        color: Colors.text.primary,
        fontWeight: '600',
        fontSize: 15,
    },
    confirmText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    }
});
