import React from 'react';
import { View, StyleSheet, Alert, Text, Image, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Heart } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { profile, signOut, refreshProfile } = useAuth();
    const { showAlert } = useAlert();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogout = async () => {
        showAlert({
            title: "Logout",
            message: "Are you sure you want to logout?",
            type: 'warning',
            confirmText: 'Logout',
            cancelText: 'Cancel',
            showCancel: true,
            onConfirm: async () => {
                await signOut();
            }
        });
    };

    return (
        <ScreenWrapper safeArea padded={false}>
            {/* Standard Sticky Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {navigation.canGoBack() && profile?.role !== 'customer' && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <ChevronLeft size={28} color={Colors.text.primary} />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.title}>My Profile</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refreshProfile} />
                }
            >
                <View style={styles.profileSection}>
                    <View style={styles.avatarWrapper}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Text style={styles.avatarText}>
                                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
                    <Text style={styles.role}>{profile?.role === 'business_owner' ? 'Business Owner' : 'Customer'}</Text>
                </View>

                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email Address</Text>
                        <Text style={styles.value}>{profile?.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Phone Number</Text>
                        <Text style={styles.value}>{profile?.phone_number || 'Not set'}</Text>
                    </View>
                </View>

                {profile?.role === 'customer' && (
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Favorites' as any)}
                    >
                        <Heart size={20} color={Colors.primary.main} />
                        <Text style={styles.menuText}>My Favorites</Text>
                        <ChevronLeft size={20} color={Colors.text.tertiary} style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                )}

                <View style={styles.footer}>
                    <Button
                        title="Refresh Account Data"
                        onPress={async () => {
                            try {
                                setIsLoading(true);
                                await refreshProfile();
                                showAlert({ title: 'Success', message: 'Profile updated', type: 'success' });
                            } catch (error) {
                                showAlert({ title: 'Error', message: 'Failed to refresh', type: 'error' });
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        loading={isLoading}
                        variant="primary"
                        style={{ marginBottom: Layout.spacing.md }}
                    />
                    <Button
                        title="Logout"
                        onPress={handleLogout}
                        variant="outline"
                        style={styles.logoutButton}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.primary,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    scrollContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 40,
        flexGrow: 1,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
        marginTop: Layout.spacing.md,
    },
    avatarWrapper: {
        marginBottom: Layout.spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.background.secondary,
    },
    placeholderAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary.light,
    },
    avatarText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: Colors.primary.main,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    role: {
        fontSize: 16,
        color: Colors.text.secondary,
        textTransform: 'capitalize',
    },
    infoBox: {
        backgroundColor: Colors.background.secondary,
        borderRadius: Layout.borderRadius.xl,
        padding: Layout.spacing.lg,
        marginBottom: Layout.spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border.primary,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Layout.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.secondary,
    },
    label: {
        fontSize: 14,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        color: Colors.text.primary,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: Layout.spacing.lg,
    },
    footer: {
        marginTop: 'auto',
    },
    logoutButton: {
        borderColor: Colors.status.error,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background.secondary,
        padding: Layout.spacing.lg,
        borderRadius: Layout.borderRadius.xl,
        marginBottom: Layout.spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border.primary,
        gap: Layout.spacing.md,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
});
