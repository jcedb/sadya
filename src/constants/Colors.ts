// Color Palette for Service Booking App
// Premium, modern aesthetic with vibrant accents

export const Colors = {
    // Primary Brand Colors
    primary: {
        main: '#6366F1',      // Indigo - Main brand color
        light: '#818CF8',     // Lighter indigo for hover/active states
        dark: '#4F46E5',      // Darker indigo for pressed states
        contrast: '#FFFFFF',  // Text on primary background
    },

    // Secondary Colors
    secondary: {
        main: '#10B981',      // Emerald green - Success/confirmation
        light: '#34D399',
        dark: '#059669',
        contrast: '#FFFFFF',
    },

    // Accent Colors
    accent: {
        coral: '#F97316',     // Orange for highlights
        pink: '#EC4899',      // Pink for special offers
        purple: '#A855F7',    // Purple for premium features
        teal: '#14B8A6',      // Teal for alternative actions
    },

    // Background Colors
    background: {
        primary: '#0F172A',   // Deep navy - Main background
        secondary: '#1E293B', // Slate - Card backgrounds
        tertiary: '#334155',  // Lighter slate - Input backgrounds
        elevated: '#1E293B',  // Elevated surfaces
    },

    // Surface Colors (for cards, modals)
    surface: {
        primary: '#1E293B',
        secondary: '#334155',
        overlay: 'rgba(15, 23, 42, 0.8)',
    },

    // Text Colors
    text: {
        primary: '#F8FAFC',   // Almost white
        secondary: '#94A3B8', // Muted gray
        tertiary: '#64748B',  // Subtle gray
        inverse: '#0F172A',   // For light backgrounds
        link: '#60A5FA',      // Link color
    },

    // Status Colors
    status: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        pending: '#F59E0B',
        confirmed: '#10B981',
        cancelled: '#EF4444',
        completed: '#6366F1',
    },

    // Border Colors
    border: {
        primary: '#334155',
        secondary: '#475569',
        focus: '#6366F1',
    },

    // Gradient Presets
    gradients: {
        primary: ['#6366F1', '#A855F7'],
        secondary: ['#10B981', '#14B8A6'],
        accent: ['#F97316', '#EC4899'],
        dark: ['#1E293B', '#0F172A'],
    },

    // Semi-transparent overlays
    overlay: {
        light: 'rgba(248, 250, 252, 0.1)',
        medium: 'rgba(248, 250, 252, 0.15)',
        dark: 'rgba(0, 0, 0, 0.5)',
    },
} as const;

// TypeScript type for Colors
export type ColorsType = typeof Colors;
