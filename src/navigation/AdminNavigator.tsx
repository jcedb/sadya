// Admin Navigator
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AdminStackParamList } from '../types/navigation';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { VerifyTransactionScreen } from '../screens/admin/VerifyTransactionScreen';
import { VerifyBusinessScreen } from '../screens/admin/VerifyBusinessScreen';

const Stack = createStackNavigator<AdminStackParamList>();

export const AdminNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="VerifyTransaction" component={VerifyTransactionScreen} />
            <Stack.Screen name="VerifyBusiness" component={VerifyBusinessScreen} />
        </Stack.Navigator>
    );
};
