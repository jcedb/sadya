// Customer Map Screen - View businesses on a map
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Star, Crosshair } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useBusinesses } from '../../hooks/useBusinesses';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { HomeScreenNavigationProp } from '../../types/navigation'; // Reusing Home prop as it has similar stack access
import { BusinessWithDetails } from '../../types/models';

// Default to Manila, Philippines
const DEFAULT_REGION = {
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export const MapScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { businesses, isLoading, fetchBusinesses } = useBusinesses();
    const mapRef = useRef<MapView>(null);
    const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithDetails | null>(null);
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setUserLocation(location);

            // Move map to user location on start
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
            }
        })();
    }, []);

    useEffect(() => {
        // Fetch all businesses initially
        fetchBusinesses();
    }, [fetchBusinesses]);

    const handleMarkerPress = (business: BusinessWithDetails) => {
        setSelectedBusiness(business);
    };

    const handleCalloutPress = (business: BusinessWithDetails) => {
        navigation.navigate('BusinessProfile', { businessId: business.id });
    };

    const recenterToUser = async () => {
        if (userLocation) {
            mapRef.current?.animateToRegion({
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            });
        } else {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({});
                setUserLocation(location);
                mapRef.current?.animateToRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                });
            }
        }
    };

    if (isLoading && businesses.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                initialRegion={DEFAULT_REGION}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {businesses.map((business) => {
                    // Skip if no location data
                    if (!business.latitude || !business.longitude) return null;

                    return (
                        <Marker
                            key={business.id}
                            coordinate={{
                                latitude: business.latitude,
                                longitude: business.longitude,
                            }}
                            onPress={() => handleMarkerPress(business)}
                        >
                            {/* Custom Marker View if needed, default pin for now */}

                            <Callout onPress={() => handleCalloutPress(business)}>
                                <View style={styles.calloutContainer}>
                                    <Text style={styles.calloutTitle}>{business.name}</Text>
                                    <Text style={styles.calloutSubtitle}>{business.address_text}</Text>
                                    <View style={styles.ratingContainer}>
                                        <Star size={12} color={Colors.primary.main} fill={Colors.primary.main} />
                                        <Text style={styles.calloutRating}>
                                            {business.average_rating ? business.average_rating.toFixed(1) : 'New'}
                                        </Text>
                                    </View>
                                    <View style={styles.calloutButton}>
                                        <Text style={styles.calloutButtonText}>View Details</Text>
                                    </View>
                                </View>
                            </Callout>
                        </Marker>
                    );
                })}
            </MapView>

            <TouchableOpacity style={styles.recenterButton} onPress={recenterToUser}>
                <Crosshair size={24} color={Colors.primary.main} />
            </TouchableOpacity>

            {errorMsg && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
            )}

            {/* Optional: Floating search bar or filter button could go here */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calloutContainer: {
        width: 200,
        padding: Layout.spacing.sm,
    },
    calloutTitle: {
        fontSize: Layout.fontSize.md,
        fontWeight: Layout.fontWeight.bold,
        marginBottom: 4,
        color: '#000', // Callouts on iOS might need explicit black if dark mode is system
    },
    calloutSubtitle: {
        fontSize: Layout.fontSize.xs,
        color: '#666',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    calloutRating: {
        fontSize: Layout.fontSize.xs,
        fontWeight: '600',
        color: Colors.primary.main,
    },
    calloutButton: {
        backgroundColor: Colors.primary.main,
        borderRadius: Layout.borderRadius.sm,
        paddingVertical: 4,
        alignItems: 'center',
    },
    calloutButtonText: {
        color: '#fff',
        fontSize: Layout.fontSize.xs,
        fontWeight: 'bold',
    },
    recenterButton: {
        position: 'absolute',
        bottom: Layout.spacing.xl,
        right: Layout.spacing.lg,
        backgroundColor: '#fff',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    errorBanner: {
        position: 'absolute',
        top: Layout.spacing.lg,
        left: Layout.spacing.lg,
        right: Layout.spacing.lg,
        backgroundColor: 'rgba(255, 0, 0, 0.8)',
        padding: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.sm,
    },
    errorText: {
        color: '#fff',
        fontSize: Layout.fontSize.xs,
        textAlign: 'center',
    },
});
