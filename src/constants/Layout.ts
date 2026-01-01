// Layout Constants and Dimensions
import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Layout = {
    // Screen Dimensions
    screen: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },

    // Safe Area
    statusBarHeight: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    bottomTabHeight: 80,
    headerHeight: 56,

    // Spacing Scale (based on 4px grid)
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
        xxxl: 64,
    },

    // Border Radius
    borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },

    // Typography Sizes
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        xxxl: 32,
        title: 40,
    },

    // Font Weights
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Line Heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Icon Sizes
    iconSize: {
        xs: 12,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    // Button Heights
    buttonHeight: {
        sm: 36,
        md: 48,
        lg: 56,
    },

    // Input Heights
    inputHeight: {
        sm: 40,
        md: 48,
        lg: 56,
    },

    // Card Dimensions
    card: {
        minHeight: 100,
        aspectRatio: 16 / 9,
    },

    // Avatar Sizes
    avatar: {
        xs: 24,
        sm: 32,
        md: 48,
        lg: 64,
        xl: 96,
    },

    // Shadow Presets (iOS)
    shadow: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
    },

    // Hit Slop for better touch targets
    hitSlop: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
    },
} as const;

// Helper function to check if device is small
export const isSmallDevice = SCREEN_WIDTH < 375;

// Helper function to check if device is tablet
export const isTablet = SCREEN_WIDTH >= 768;

// Responsive scaling helper
export const scale = (size: number): number => {
    const baseWidth = 375; // iPhone X width
    return (SCREEN_WIDTH / baseWidth) * size;
};
