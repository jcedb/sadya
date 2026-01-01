// Root Navigator - Main navigation switching between Auth and Main flows
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator'; // Keep this for Business/Admin for now
import { CustomerNavigator } from './CustomerNavigator';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/Colors';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

import { BusinessNavigator } from './BusinessNavigator';
import { AdminNavigator } from './AdminNavigator';

// Loading screen while checking auth state
const LoadingScreen: React.FC = () => (
    <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
    </View>
);

export const RootNavigator: React.FC = () => {
    const { isAuthenticated, isLoading, profile } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                <>
                    {/* Main app based on user role */}
                    {profile?.role === 'business_owner' ? (
                        <Stack.Screen name="Business" component={BusinessNavigator} />
                    ) : profile?.role === 'admin' ? (
                        <Stack.Screen name="Admin" component={AdminNavigator} />
                    ) : (
                        <Stack.Screen name="Customer" component={CustomerNavigator} />
                    )}
                </>
            ) : (
                <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: Colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
