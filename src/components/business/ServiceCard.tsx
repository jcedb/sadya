import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Service } from '../../types/database.types';
import { formatCurrency } from '../../utils/currency';
import { formatDuration } from '../../utils/dateTime';
import { Clock, Pencil } from 'lucide-react-native';

interface ServiceCardProps {
    service: Service;
    onPress: () => void;
    mode?: 'view' | 'edit';
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress, mode = 'view' }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={1}>{service.name}</Text>
                    {service.sale_price ? (
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.originalPrice}>{formatCurrency(service.price)}</Text>
                            <Text style={styles.salePrice}>{formatCurrency(service.sale_price)}</Text>
                        </View>
                    ) : (
                        <Text style={styles.price}>{formatCurrency(service.price)}</Text>
                    )}
                </View>

                {service.description ? (
                    <Text style={styles.description} numberOfLines={2}>
                        {service.description}
                    </Text>
                ) : null}

                <View style={styles.footer}>
                    <View style={styles.badge}>
                        <Clock size={12} color={Colors.text.secondary} />
                        <Text style={styles.badgeText}>{formatDuration(service.duration_minutes)}</Text>
                    </View>
                </View>
            </View>

            {mode === 'view' && (
                <View style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface.primary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.md,
        marginBottom: Layout.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    content: {
        flex: 1,
        marginRight: Layout.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
        flex: 1,
        marginRight: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary.main,
    },
    originalPrice: {
        fontSize: 12,
        color: Colors.text.tertiary,
        textDecorationLine: 'line-through',
    },
    salePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.status.error,
    },
    description: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginBottom: 10,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: Colors.background.tertiary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    badgeText: {
        fontSize: 12,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    bookButton: {
        backgroundColor: Colors.primary.main,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    editIcon: {
        padding: 8,
        opacity: 0.7,
    }
});
