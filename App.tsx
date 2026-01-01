// Main App Entry Point
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { BusinessProvider } from './src/contexts/BusinessContext';
import { AlertProvider } from './src/contexts/AlertContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/constants/Colors';

// Navigation theme for dark mode
const navigationTheme = {
  dark: true,
  colors: {
    primary: Colors.primary.main,
    background: Colors.background.primary,
    card: Colors.background.secondary,
    text: Colors.text.primary,
    border: Colors.border.primary,
    notification: Colors.status.error,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '900' as const,
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <BusinessProvider>
            <AlertProvider>
              <NavigationContainer theme={navigationTheme}>
                <RootNavigator />
              </NavigationContainer>
            </AlertProvider>
          </BusinessProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});
