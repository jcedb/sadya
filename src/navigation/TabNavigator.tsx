// Tab Navigator - Bottom tab navigation for authenticated users
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { CustomerTabParamList, BusinessTabParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';

// Placeholder screens (will be replaced with actual screens)
const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>{title}</Text>
        <Text style={styles.placeholderSubtext}>Coming soon...</Text>
    </View>
);

import { ProfileScreen } from '../screens/customer/ProfileScreen';
import { MapScreen } from '../screens/customer/MapScreen';
import { HomeScreen as CustomerHomeScreen } from '../screens/customer/HomeScreen';
import { ManageServicesScreen } from '../screens/business/ManageServicesScreen';

import { DashboardScreen } from '../screens/business/DashboardScreen';
import { ManageCouponsScreen } from '../screens/business/ManageCouponsScreen';

// const HomeScreen = () => <PlaceholderScreen title="🏠 Home" />; // Replaced
// const MapScreen = () => <PlaceholderScreen title="🗺️ Map" />; // Replaced
import { MyBookingsScreen as CustomerBookingsScreen } from '../screens/customer/MyBookingsScreen';
// const ProfileScreen = () => <PlaceholderScreen title="👤 Profile" />; // Replaced
// const DashboardScreen = () => <PlaceholderScreen title="📊 Dashboard" />; // Replaced
const ServicesScreen = () => <PlaceholderScreen title="✂️ Services" />;
const WalletScreen = () => <PlaceholderScreen title="💰 Wallet" />;

const CustomerTab = createBottomTabNavigator<CustomerTabParamList>();
const BusinessTab = createBottomTabNavigator<BusinessTabParamList>();

// Tab Bar Icon Component
import { Home, Map, Calendar, User, LayoutDashboard, Scissors, Wallet, Ticket } from 'lucide-react-native';

// ... (imports)

const TabIcon: React.FC<{ Icon: React.FC<any>; focused: boolean }> = ({ Icon, focused }) => (
    <Icon
        size={24}
        color={focused ? Colors.primary.main : Colors.text.tertiary}
        strokeWidth={focused ? 2.5 : 2}
    />
);

export const CustomerTabNavigator: React.FC = () => {
    return (
        <CustomerTab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.primary.main,
                tabBarInactiveTintColor: Colors.text.tertiary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <CustomerTab.Screen
                name="Home"
                component={CustomerHomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
                }}
            />
            <CustomerTab.Screen
                name="Map"
                component={MapScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon Icon={Map} focused={focused} />,
                }}
            />
            <CustomerTab.Screen
                name="MyBookings"
                component={CustomerBookingsScreen}
                options={{
                    tabBarLabel: 'Bookings',
                    tabBarIcon: ({ focused }) => <TabIcon Icon={Calendar} focused={focused} />,
                }}
            />
            <CustomerTab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
                }}
            />
        </CustomerTab.Navigator>
    );
};

export const BusinessTabNavigator: React.FC = () => {
    return (
        <BusinessTab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.primary.main,
                tabBarInactiveTintColor: Colors.text.tertiary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <BusinessTab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon Icon={LayoutDashboard} focused={focused} />,
                }}
            />
            <BusinessTab.Screen
                name="Services"
                component={ManageServicesScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon Icon={Scissors} focused={focused} />,
                }}
            />
            <BusinessTab.Screen
                name="Coupons"
                component={ManageCouponsScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon Icon={Ticket} focused={focused} />,
                }}
            />
            <BusinessTab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
                }}
            />
        </BusinessTab.Navigator>
    );
};

// Dynamic Tab Navigator based on user role
export const TabNavigator: React.FC = () => {
    const { profile } = useAuth();

    if (profile?.role === 'business_owner') {
        return <BusinessTabNavigator />;
    }

    return <CustomerTabNavigator />;
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.background.secondary,
        borderTopColor: Colors.border.primary,
        borderTopWidth: 1,
        height: Layout.bottomTabHeight,
        paddingBottom: Layout.spacing.sm,
        paddingTop: Layout.spacing.xs,
    },
    tabLabel: {
        fontSize: Layout.fontSize.xs,
        fontWeight: Layout.fontWeight.medium,
    },
    tabIcon: {
        fontSize: 22,
        opacity: 0.6,
    },
    tabIconFocused: {
        opacity: 1,
    },
    placeholder: {
        flex: 1,
        backgroundColor: Colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 48,
        marginBottom: Layout.spacing.md,
    },
    placeholderSubtext: {
        fontSize: Layout.fontSize.lg,
        color: Colors.text.secondary,
    },
});
