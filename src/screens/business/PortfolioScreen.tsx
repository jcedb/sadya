import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBusiness } from '../../contexts/BusinessContext';
import { getPortfolioItems } from '../../services/businessService';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { ChevronLeft, Plus, Image as ImageIcon } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { PortfolioItem } from '../../types/database.types';

export const PortfolioScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { business } = useBusiness();
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchItems = async () => {
        if (!business?.id) return;

        setIsLoading(true);
        try {
            const { data, success, error } = await getPortfolioItems(business.id);
            console.log('[PortfolioScreen] Fetch result:', { success, count: data?.length, error });
            if (success && data) {
                setItems(data);
            }
        } catch (error) {
            console.error('[PortfolioScreen] Catch error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [business?.id]);

    const renderItem = ({ item }: { item: PortfolioItem }) => (
        <View style={styles.itemContainer}>
            <Image source={{ uri: item.image_url }} style={styles.image} />
            {item.description && (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                </View>
            )}
        </View>
    );

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Standard Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Portfolio</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddPortfolioItem')}
                    style={styles.addButton}
                >
                    <Plus size={24} color={Colors.primary.main} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                numColumns={2}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchItems(); }}
                        tintColor={Colors.primary.main}
                    />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <ImageIcon size={48} color={Colors.text.tertiary} style={styles.emptyIcon} />
                            <Text style={styles.emptyText}>No images added yet.</Text>
                            <TouchableOpacity
                                style={styles.emptyAction}
                                onPress={() => navigation.navigate('AddPortfolioItem')}
                            >
                                <Text style={styles.emptyActionText}>Add Your First Work</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
            {isLoading && !refreshing && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={Colors.primary.main} />
                </View>
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.lg,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.primary,
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    addButton: {
        padding: 4,
    },
    list: {
        padding: Layout.spacing.sm,
    },
    itemContainer: {
        flex: 1,
        margin: Layout.spacing.xs,
        borderRadius: Layout.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: Colors.background.secondary,
        ...Layout.shadow.sm,
    },
    image: {
        width: '100%',
        aspectRatio: 1,
        resizeMode: 'cover',
    },
    descriptionContainer: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    description: {
        fontSize: 12,
        color: Colors.text.primary,
    },
    emptyContainer: {
        padding: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.tertiary,
        marginBottom: 20,
    },
    emptyAction: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: Colors.primary.light + '20',
    },
    emptyActionText: {
        color: Colors.primary.main,
        fontWeight: '600',
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
});
