// Business Navigator - Main stack for business owners
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BusinessStackParamList } from '../types/navigation';
import { CreateBusinessScreen } from '../screens/business/CreateBusinessScreen';
import { AddEditServiceScreen } from '../screens/business/AddEditServiceScreen';
import { BusinessProfileScreen } from '../screens/customer/BusinessProfileScreen';
import { PortfolioScreen } from '../screens/business/PortfolioScreen';
import { AddPortfolioItemScreen } from '../screens/business/AddPortfolioItemScreen';
import { EditBusinessProfileScreen } from '../screens/business/EditBusinessProfileScreen';
import { ManageCouponsScreen } from '../screens/business/ManageCouponsScreen';
import { AddEditCouponScreen } from '../screens/business/AddEditCouponScreen';
import { DashboardScreen } from '../screens/business/DashboardScreen';
import { ManageServicesScreen } from '../screens/business/ManageServicesScreen';
import { WalletScreen } from '../screens/business/WalletScreen';
import { TopUpScreen } from '../screens/business/TopUpScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';
import { ManageScheduleScreen } from '../screens/business/ManageScheduleScreen';
import { AddEditExceptionScreen } from '../screens/business/AddEditExceptionScreen';
import { BookingDetailsScreen } from '../screens/customer/BookingDetailsScreen';
import { AppointmentsListScreen } from '../screens/business/AppointmentsListScreen';
import { useBusiness } from '../contexts/BusinessContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

const Stack = createStackNavigator<BusinessStackParamList>();

export const BusinessNavigator: React.FC = () => {
    const { hasBusiness, isLoading: isBusinessLoading } = useBusiness();

    if (isBusinessLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary.main} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            initialRouteName={hasBusiness ? "Dashboard" : "CreateBusiness"}
            screenOptions={{ headerShown: false }}
        >
            {!hasBusiness ? (
                <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
            ) : null}
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Services" component={ManageServicesScreen} />
            <Stack.Screen name="ManageCoupons" component={ManageCouponsScreen} />
            <Stack.Screen name="WalletScreen" component={WalletScreen} />
            <Stack.Screen name="TopUp" component={TopUpScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />

            <Stack.Screen name="AddEditService" component={AddEditServiceScreen} />
            <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
            <Stack.Screen name="PortfolioScreen" component={PortfolioScreen} />
            <Stack.Screen name="AddPortfolioItem" component={AddPortfolioItemScreen} />
            <Stack.Screen name="EditBusinessProfile" component={EditBusinessProfileScreen} />
            <Stack.Screen name="AddEditCoupon" component={AddEditCouponScreen} />
            <Stack.Screen name="ManageSchedule" component={ManageScheduleScreen} />
            <Stack.Screen name="AddEditException" component={AddEditExceptionScreen} />
            <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
            <Stack.Screen name="BusinessAppointments" component={AppointmentsListScreen} />
        </Stack.Navigator>
    );
};
