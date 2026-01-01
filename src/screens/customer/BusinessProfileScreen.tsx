import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform, Linking, Modal } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useEffect } from 'react';
import { MapPin, Phone, Star, ChevronLeft, Heart, Image as ImageIcon } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { useBusinessDetails } from '../../hooks/useBusinesses';
import { useAuth } from '../../hooks/useAuth';
import { toggleFavorite, getIsFavorite } from '../../services/businessService';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { BusinessProfileScreenRouteProp, BusinessProfileScreenNavigationProp } from '../../types/navigation';
import { Service, PortfolioItem, Review } from '../../types/database.types';

type Tab = 'services' | 'portfolio' | 'reviews' | 'about';

export const BusinessProfileScreen: React.FC = () => {
    const route = useRoute<BusinessProfileScreenRouteProp>();
    const navigation = useNavigation<BusinessProfileScreenNavigationProp>();
    const { businessId } = route.params;
    const { business, isLoading, error, refresh } = useBusinessDetails(businessId);
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>(route.params?.initialTab || 'services');
    useEffect(() => {
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
    }, [route.params?.initialTab]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    useEffect(() => {
        if (profile?.id && businessId) {
            getIsFavorite(profile.id, businessId).then(setIsFavorite);
        }
    }, [profile?.id, businessId]);

    const handleToggleFavorite = async () => {
        if (!profile?.id || !businessId) return;
        setIsTogglingFavorite(true);
        const { data, success } = await toggleFavorite(profile.id, businessId);
        if (success) {
            setIsFavorite(data === true);
        }
        setIsTogglingFavorite(false);
    };

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    if (isLoading || !business) {
        return (
            <ScreenWrapper safeArea>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary.main} />
                </View>
            </ScreenWrapper>
        );
    }

    const renderTabs = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            {(['services', 'portfolio', 'reviews', 'about'] as Tab[]).map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderServices = () => (
        <View style={styles.servicesList}>
            {business.services?.map((service: Service) => (
                <View key={service.id} style={styles.serviceItem}>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>
                        <View style={styles.serviceMeta}>
                            <Text style={styles.priceText}>₱{service.price}</Text>
                            <Text style={styles.dot}> • </Text>
                            <Text style={styles.durationText}>{service.duration_minutes} min</Text>
                        </View>
                    </View>
                    {profile?.role === 'customer' && (
                        <Button
                            title="Book"
                            onPress={() => navigation.navigate('SlotSelection', { businessId: business.id, serviceId: service.id })}
                            variant="primary"
                            style={styles.bookButton}
                            textStyle={styles.bookButtonText}
                        />
                    )}
                </View>
            ))}
        </View>
    );


    const renderPortfolio = () => {
        const isOwner = !!profile && profile.role === 'business_owner' && profile.id === business.owner_id;

        return (
            <View style={styles.portfolioSectionWrapper}>
                <View style={styles.portfolioHeader}>
                    <Text style={styles.portfolioTitle}>Our Portfolio</Text>
                    {isOwner && (
                        <Button
                            title="Add Photo"
                            onPress={() => navigation.navigate('AddPortfolioItem' as any)}
                            variant="outline"
                            style={styles.editButtonRefined}
                            textStyle={styles.editButtonTextRefined}
                        />
                    )}
                </View>

                <View style={styles.portfolioGrid}>
                    {business.portfolio_items?.map((item: PortfolioItem) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.portfolioGridItem}
                            onPress={() => setSelectedImage(item.image_url)}
                        >
                            <Image source={{ uri: item.image_url }} style={styles.portfolioImage} />
                        </TouchableOpacity>
                    ))}
                    {(!business.portfolio_items || business.portfolio_items.length === 0) && (
                        <View style={styles.emptyContainer}>
                            <ImageIcon size={48} color={Colors.text.tertiary} />
                            <Text style={styles.emptyText}>No portfolio images available yet.</Text>
                        </View>
                    )}
                </View>

                {/* Full Screen Image Modal */}
                <Modal
                    visible={!!selectedImage}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectedImage(null)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setSelectedImage(null)}
                        >
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.fullScreenImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </Modal>
            </View>
        );
    };

    const renderReviews = () => (
        <View style={styles.reviewsList}>
            {business.reviews && business.reviews.length > 0 ? (
                business.reviews.map((review: Review) => (
                    <View key={review.id} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                            <View>
                                <Text style={styles.reviewerName}>{(review as any).customer?.full_name || 'Anonymous'}</Text>
                                <View style={styles.ratingStars}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={12}
                                            color={s <= review.rating ? Colors.primary.main : Colors.text.tertiary}
                                            fill={s <= review.rating ? Colors.primary.main : 'transparent'}
                                        />
                                    ))}
                                </View>
                            </View>
                            <Text style={styles.reviewDate}>
                                {new Date(review.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                    </View>
                ))
            ) : (
                <View style={styles.emptyContainer}>
                    <Star size={48} color={Colors.text.tertiary} />
                    <Text style={styles.emptyText}>No reviews yet.</Text>
                </View>
            )}
        </View>
    );

    const renderAbout = () => {
        const isOwner = !!profile && profile.role === 'business_owner' && profile.id === business.owner_id;

        return (
            <View style={styles.aboutContainer}>
                <View style={styles.aboutHeader}>
                    <View style={styles.titleWithBadge}>
                        <Text style={styles.aboutTitle}>About the Business</Text>
                        {business.category && (
                            <View style={styles.categoryInfoBadge}>
                                <Text style={styles.categoryInfoText}>{business.category}</Text>
                            </View>
                        )}
                    </View>
                    {isOwner && (
                        <Button
                            title="Edit Details"
                            onPress={() => navigation.navigate('EditBusinessProfile' as any)}
                            variant="outline"
                            style={styles.editButtonRefined}
                            textStyle={styles.editButtonTextRefined}
                        />
                    )}
                </View>

                <View style={styles.descriptionSection}>
                    <Text style={styles.aboutText}>{business.description || 'No description provided'}</Text>
                </View>

                <View style={styles.premiumContactSection}>
                    <Text style={styles.premiumContactTitle}>Contact Information</Text>

                    <View style={styles.premiumContactItem}>
                        <View style={styles.premiumIconCircle}>
                            <MapPin size={20} color={Colors.primary.main} />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Location Address</Text>
                            <Text style={styles.contactInfo}>{business.address_text || 'No address provided'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.premiumContactItem}
                        onPress={() => {
                            if (business.phone_number) {
                                Linking.openURL(`tel:${business.phone_number}`);
                            }
                        }}
                    >
                        <View style={styles.premiumIconCircle}>
                            <Phone size={20} color={Colors.primary.main} />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Phone Number</Text>
                            <Text style={styles.contactInfo}>{business.phone_number || 'No phone provided'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper safeArea={false} padded={false}>
            {/* Standard Header with overlays */}
            {/* Header Buttons (Absolute overlay) */}
            <View style={styles.absoluteHeader}>
                <TouchableOpacity
                    style={[styles.premiumHeaderBtn, { left: Layout.spacing.lg }]}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color="#fff" size={28} />
                </TouchableOpacity>

                {profile?.role === 'customer' && (
                    <TouchableOpacity
                        style={[styles.premiumHeaderBtn, { right: Layout.spacing.lg }]}
                        onPress={handleToggleFavorite}
                        disabled={isTogglingFavorite}
                    >
                        <Heart
                            size={24}
                            color={isFavorite ? Colors.status.error : '#fff'}
                            fill={isFavorite ? Colors.status.error : 'transparent'}
                        />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.hero}>
                    <Image
                        source={{ uri: business.image_url || 'https://images.unsplash.com/photo-1521590832896-cc17b503b675?auto=format&fit=crop&q=80' }}
                        style={styles.coverImage}
                    />
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroContent}>
                        <Text style={styles.businessName}>{business.name}</Text>
                        <View style={styles.ratingBadge}>
                            <Star size={14} color="#FFD700" fill="#FFD700" style={styles.starIcon} />
                            <Text style={styles.ratingText}>{business.average_rating ? business.average_rating.toFixed(1) : 'New'}</Text>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.stickyHeader}>
                    {renderTabs()}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {activeTab === 'services' && renderServices()}
                    {activeTab === 'portfolio' && renderPortfolio()}
                    {activeTab === 'reviews' && renderReviews()}
                    {activeTab === 'about' && renderAbout()}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    absoluteHeader: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
        paddingHorizontal: Layout.spacing.md,
    },
    premiumHeaderBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    hero: {
        height: 200,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    heroContent: {
        position: 'absolute',
        bottom: Layout.spacing.lg,
        left: Layout.spacing.lg,
    },
    businessName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius.sm,
        alignSelf: 'flex-start',
    },
    starIcon: {
        marginRight: 4,
    },
    ratingText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    stickyHeader: {
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.primary,
    },
    tabsContainer: {
        paddingHorizontal: Layout.spacing.md,
    },
    tabButton: {
        paddingVertical: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.md,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: Colors.primary.main,
    },
    tabText: {
        fontSize: 14,
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: Colors.primary.main,
    },
    content: {
        padding: Layout.spacing.md,
    },
    servicesList: {
        gap: Layout.spacing.md,
    },
    serviceItem: {
        flexDirection: 'row',
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.lg,
        padding: Layout.spacing.md,
        alignItems: 'center',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    serviceDescription: {
        fontSize: 12,
        color: Colors.text.secondary,
    },
    serviceMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    dot: {
        color: Colors.text.tertiary,
        marginHorizontal: 4,
    },
    bookButton: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: Layout.borderRadius.sm,
        marginLeft: Layout.spacing.md,
    },
    bookButtonText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    servicePrice: {
        alignItems: 'flex-end',
        marginLeft: Layout.spacing.md,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary.main,
    },
    durationText: {
        fontSize: 12,
        color: Colors.text.tertiary,
    },
    portfolioSectionWrapper: {
        paddingVertical: Layout.spacing.md,
    },
    portfolioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Layout.spacing.lg,
    },
    portfolioTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    portfolioGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Layout.spacing.xs,
    },
    portfolioGridItem: {
        width: '50%',
        aspectRatio: 1,
        padding: Layout.spacing.xs,
    },
    portfolioImage: {
        width: '100%',
        height: '100%',
        borderRadius: Layout.borderRadius.md,
        resizeMode: 'cover',
    },
    reviewsList: {
        gap: Layout.spacing.md,
    },
    reviewItem: {
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.md,
        padding: Layout.spacing.md,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewerName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    ratingStars: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewDate: {
        fontSize: 12,
        color: Colors.text.tertiary,
    },
    reviewComment: {
        fontSize: 14,
        color: Colors.text.primary,
        lineHeight: 20,
    },
    aboutContainer: {
        paddingVertical: Layout.spacing.md,
    },
    aboutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Layout.spacing.lg,
    },
    titleWithBadge: {
        flex: 1,
        gap: 6,
    },
    aboutTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    editButtonRefined: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        height: 36,
        minWidth: 100,
        borderRadius: Layout.borderRadius.md,
    },
    editButtonTextRefined: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    descriptionSection: {
        marginBottom: Layout.spacing.xl,
        paddingHorizontal: 4,
    },
    aboutText: {
        fontSize: 16,
        color: Colors.text.secondary,
        lineHeight: 24,
    },
    categoryInfoBadge: {
        backgroundColor: Colors.primary.light + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius.sm,
        alignSelf: 'flex-start',
    },
    categoryInfoText: {
        fontSize: 13,
        color: Colors.primary.main,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    premiumContactSection: {
        backgroundColor: Colors.background.tertiary,
        borderRadius: Layout.borderRadius.xl,
        padding: Layout.spacing.xl,
        gap: Layout.spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        ...Layout.shadow.sm,
    },
    premiumContactTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    premiumContactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Layout.spacing.lg,
    },
    premiumIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary.light + '25',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary.light + '40',
    },
    contactContent: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 13,
        color: Colors.text.tertiary,
        marginBottom: 2,
        fontWeight: '500',
    },
    contactInfo: {
        fontSize: 15,
        color: Colors.text.primary,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        padding: Layout.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Layout.spacing.md,
        minHeight: 200,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.tertiary,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '80%',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    modalCloseText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
