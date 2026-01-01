// Customer Home Screen - List of Businesses
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    RefreshControl,
    TextInput,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Search, Star } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { useBusinesses } from '../../hooks/useBusinesses';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { HomeScreenNavigationProp } from '../../types/navigation';
import { BusinessWithDetails } from '../../types/models';
import { useAuth } from '../../hooks/useAuth';

// Component for individual business card
const BusinessCard: React.FC<{
    business: BusinessWithDetails;
    onPress: () => void;
}> = ({ business, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
        <View style={styles.cardImageContainer}>
            <Image
                source={{
                    uri: business.image_url || 'https://images.unsplash.com/photo-1521590832896-cc17b503b675?auto=format&fit=crop&q=80',
                }}
                style={styles.cardImage}
            />
            <View style={styles.ratingContainer}>
                <Star size={12} color={Colors.primary.light} fill={Colors.primary.light} style={styles.starIcon} />
                <Text style={styles.ratingText}>
                    {business.average_rating ? business.average_rating.toFixed(1) : 'New'}
                </Text>
            </View>
        </View>

        <View style={styles.cardContent}>
            <Text style={styles.businessName}>{business.name}</Text>
            <View style={styles.addressRow}>
                <MapPin size={14} color={Colors.text.tertiary} />
                <Text style={styles.businessAddress} numberOfLines={1}>
                    {business.address_text || 'No address provided'}
                </Text>
            </View>
            {business.description && (
                <Text style={styles.businessDescription} numberOfLines={2}>
                    {business.description}
                </Text>
            )}

            <View style={styles.cardFooter}>
                {business.accepts_cash && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Cash Accepted</Text>
                    </View>
                )}
            </View>
        </View>
    </TouchableOpacity>
);

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { businesses, isLoading, error, fetchBusinesses } = useBusinesses();
    const { profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const categories = ['All', 'Barber Shop', 'Salon', 'Spa', 'Nail Tech', 'Others'];
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const filter = {
            searchQuery,
            category: selectedCategory === 'All' ? undefined : selectedCategory
        };
        fetchBusinesses(filter);
    }, [fetchBusinesses, selectedCategory]);

    const handleSearch = () => {
        fetchBusinesses({
            searchQuery,
            category: selectedCategory === 'All' ? undefined : selectedCategory
        });
    };

    const renderItem = ({ item }: { item: BusinessWithDetails }) => (
        <BusinessCard
            business={item}
            onPress={() => navigation.navigate('BusinessProfile', { businessId: item.id })}
        />
    );

    return (
        <ScreenWrapper safeArea={false} padded={false} backgroundColor={Colors.background.secondary}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Hello, {profile?.full_name?.split(' ')[0] || 'Guest'} 👋</Text>
                        <Text style={styles.subGreeting}>Find services near you</Text>
                    </View>
                    {/* Avatar could go here */}
                </View>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for barbers, salons..."
                        placeholderTextColor={Colors.text.tertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                        <Search size={20} color={Colors.primary.main} />
                    </TouchableOpacity>
                </View>

                <View style={styles.categoriesWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryButton,
                                    selectedCategory === cat && styles.categoryButtonActive
                                ]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    selectedCategory === cat && styles.categoryTextActive
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <View style={styles.content}>
                {error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => fetchBusinesses()}>
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={businesses}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isLoading}
                                onRefresh={() => fetchBusinesses({ searchQuery })}
                                tintColor={Colors.primary.main}
                            />
                        }
                        ListEmptyComponent={
                            !isLoading ? (
                                <View style={styles.centerContainer}>
                                    <Text style={styles.emptyText}>No businesses found.</Text>
                                </View>
                            ) : null
                        }
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: Colors.background.primary,
        paddingTop: Layout.statusBarHeight + Layout.spacing.lg,
        paddingHorizontal: Layout.spacing.lg,
        paddingBottom: Layout.spacing.lg,
        borderBottomLeftRadius: Layout.borderRadius.xl,
        borderBottomRightRadius: Layout.borderRadius.xl,
        ...Layout.shadow.md,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.lg,
    },
    greeting: {
        fontSize: Layout.fontSize.xxl,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.text.primary,
    },
    subGreeting: {
        fontSize: Layout.fontSize.md,
        color: Colors.text.secondary,
    },
    searchContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.background.tertiary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.sm,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: Colors.text.primary,
        paddingHorizontal: Layout.spacing.md,
        fontSize: Layout.fontSize.md,
    },
    searchButton: {
        padding: Layout.spacing.sm,
        backgroundColor: Colors.surface.secondary,
        borderRadius: Layout.borderRadius.md,
    },
    categoriesWrapper: {
        marginTop: Layout.spacing.md,
    },
    categoriesList: {
        paddingRight: Layout.spacing.lg,
        gap: 8,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.background.tertiary,
    },
    categoryButtonActive: {
        backgroundColor: Colors.primary.main,
    },
    categoryText: {
        fontSize: 14,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: Layout.spacing.md,
        gap: Layout.spacing.md,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Layout.spacing.xl,
    },
    errorText: {
        color: Colors.status.error,
        marginBottom: Layout.spacing.md,
    },
    retryText: {
        color: Colors.primary.light,
        fontWeight: Layout.fontWeight.bold,
    },
    emptyText: {
        color: Colors.text.secondary,
    },
    // Card Styles
    card: {
        backgroundColor: Colors.background.primary,
        borderRadius: Layout.borderRadius.lg,
        overflow: 'hidden',
        marginBottom: Layout.spacing.sm,
        ...Layout.shadow.sm,
    },
    cardImageContainer: {
        height: 150,
        backgroundColor: Colors.surface.secondary,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    ratingContainer: {
        position: 'absolute',
        top: Layout.spacing.sm,
        right: Layout.spacing.sm,
        backgroundColor: Colors.surface.overlay,
        borderRadius: Layout.borderRadius.full,
        paddingHorizontal: Layout.spacing.sm,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    starIcon: {
        marginRight: 4,
    },
    ratingText: {
        color: Colors.text.primary,
        fontSize: Layout.fontSize.xs,
        fontWeight: Layout.fontWeight.bold,
    },
    cardContent: {
        padding: Layout.spacing.md,
    },
    businessName: {
        fontSize: Layout.fontSize.lg,
        fontWeight: Layout.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: Layout.spacing.sm,
    },
    businessAddress: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.secondary,
        flex: 1,
    },
    businessDescription: {
        fontSize: Layout.fontSize.sm,
        color: Colors.text.tertiary,
        marginBottom: Layout.spacing.md,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Layout.spacing.sm,
    },
    badge: {
        backgroundColor: Colors.surface.secondary,
        paddingHorizontal: Layout.spacing.sm,
        paddingVertical: 2,
        borderRadius: Layout.borderRadius.sm,
    },
    badgeText: {
        fontSize: 10,
        color: Colors.primary.light,
        fontWeight: Layout.fontWeight.medium,
    },
});
