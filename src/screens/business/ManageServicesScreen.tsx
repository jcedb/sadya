// Manage Services Screen - List and edit services
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { ServiceCard } from '../../components/business/ServiceCard';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../contexts/BusinessContext';
import { getServices } from '../../services/businessService';
import { Service } from '../../types/database.types';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { ClipboardList, Plus, ChevronLeft } from 'lucide-react-native';

export const ManageServicesScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { business } = useBusiness();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchServices = async () => {
        if (!business?.id) return;
        try {
            const { data: fetchedServices } = await getServices(business.id);
            setServices(fetchedServices || []);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchServices();
        }, [business?.id])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchServices();
    };

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Your Services</Text>
            </View>

            {/* Scrollable Content */}
            <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary.main} />
                }
                renderItem={({ item }) => (
                    <ServiceCard
                        service={item}
                        mode="edit"
                        onPress={() => navigation.navigate('AddEditService', { service: item })}
                    />
                )}
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary.main} />
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <ClipboardList size={48} color={Colors.text.tertiary} style={styles.emptyIcon} />
                            <Text style={styles.emptyTitle}>No Services Yet</Text>
                            <Text style={styles.emptyText}>
                                Start adding services so customers can see what you offer.
                            </Text>
                        </View>
                    )
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddEditService')}
                activeOpacity={0.8}
            >
                <Plus color="#fff" size={32} />
            </TouchableOpacity>
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
    listContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 100, // Space for FAB
    },
    emptyContainer: {
        padding: Layout.spacing.xl,
        alignItems: 'center',
        marginTop: Layout.spacing.xl,
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.lg,
        marginHorizontal: Layout.spacing.lg,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: Colors.border.primary,
    },
    emptyIcon: {
        marginBottom: Layout.spacing.md,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    emptyText: {
        color: Colors.text.secondary,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabIcon: {
        fontSize: 32,
        color: '#fff',
        fontWeight: '300',
        marginTop: -4, // Optical adjustment
    },
    loadingContainer: {
        padding: Layout.spacing.xl,
        marginTop: Layout.spacing.xl,
        alignItems: 'center',
    },
});
