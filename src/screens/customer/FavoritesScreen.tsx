import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Heart, MapPin, Star } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { BusinessWithDetails } from '../../types/models';

export const FavoritesScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { profile } = useAuth();
    const [favorites, setFavorites] = useState<BusinessWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFavorites = async () => {
        if (!profile?.id) return;

        try {
            console.log('[FavoritesScreen] Fetching favorites for user:', profile.id);
            // We fetch businesses that have an entry in the favorites table for this user
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    business_id,
                    businesses (*)
                `)
                .eq('user_id', profile.id);

            if (error) throw error;

            const businessList = data
                ?.map((item: any) => item.businesses)
                .filter(Boolean) as BusinessWithDetails[];

            setFavorites(businessList || []);
        } catch (error) {
            console.error('[FavoritesScreen] Fetch error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFavorites();
        }, [profile?.id])
    );

    const renderItem = ({ item }: { item: BusinessWithDetails }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BusinessProfile', { businessId: item.id })}
        >
            <Image
                source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1521590832896-cc17b503b675?auto=format&fit=crop&q=80' }}
                style={styles.cardImage}
            />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.businessName}>{item.name}</Text>
                    <Heart size={18} color={Colors.status.error} fill={Colors.status.error} />
                </View>
                <View style={styles.locationRow}>
                    <MapPin size={14} color={Colors.text.tertiary} />
                    <Text style={styles.locationText} numberOfLines={1}>{item.address_text}</Text>
                </View>
                <View style={styles.ratingRow}>
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.ratingText}>
                        {item.average_rating ? item.average_rating.toFixed(1) : 'New'}
                    </Text>
                    {item.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper safeArea padded={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>My Favorites</Text>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary.main} />
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchFavorites(); }}
                            tintColor={Colors.primary.main}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Heart size={64} color={Colors.text.tertiary} style={styles.emptyIcon} />
                            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
                            <Text style={styles.emptySubtitle}>Start exploring and save your favorite businesses here.</Text>
                            <TouchableOpacity
                                style={styles.exploreButton}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.exploreButtonText}>Explore Businesses</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
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
        gap: Layout.spacing.sm,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    list: {
        padding: Layout.spacing.md,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.background.primary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.sm,
        marginBottom: Layout.spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        ...Layout.shadow.sm,
    },
    cardImage: {
        width: 100,
        height: 100,
        borderRadius: Layout.borderRadius.md,
    },
    cardContent: {
        flex: 1,
        marginLeft: Layout.spacing.md,
        justifyContent: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    businessName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    locationText: {
        fontSize: 12,
        color: Colors.text.secondary,
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    categoryBadge: {
        marginLeft: 'auto',
        backgroundColor: Colors.background.secondary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    categoryText: {
        fontSize: 10,
        color: Colors.primary.main,
        fontWeight: 'bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        marginBottom: 20,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    exploreButton: {
        backgroundColor: Colors.primary.main,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: Layout.borderRadius.md,
    },
    exploreButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
