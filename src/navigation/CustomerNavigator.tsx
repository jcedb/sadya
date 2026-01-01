// Customer Navigator - Stack Navigator for Customer Flow
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CustomerStackParamList } from '../types/navigation';
import { CustomerTabNavigator } from './TabNavigator';
import { BusinessProfileScreen } from '../screens/customer/BusinessProfileScreen';
import { SlotSelectionScreen } from '../screens/customer/SlotSelectionScreen';
import { CheckoutScreen } from '../screens/customer/CheckoutScreen';
import { BookingDetailsScreen } from '../screens/customer/BookingDetailsScreen';
import { FavoritesScreen } from '../screens/customer/FavoritesScreen';
import { LeaveReviewScreen } from '../screens/customer/LeaveReviewScreen';

const Stack = createStackNavigator<CustomerStackParamList>();
const PlaceholderScreen = () => null;

export const CustomerNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
            <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
            <Stack.Screen name="SlotSelection" component={SlotSelectionScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} />
        </Stack.Navigator>
    );
};
