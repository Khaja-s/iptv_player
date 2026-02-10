import { Platform } from 'react-native';

// ─── Japandi "Organic Soft UI" Design System ─────────────────────────────
export const colors = {
    // Core palette — warm & tactile
    primary: '#5B7A65',        // Sage Green
    primaryLight: '#7A9E86',
    primaryDark: '#496354',
    primaryGhost: 'rgba(91, 122, 101, 0.10)',

    background: '#FAF7F2',     // Warm Cream
    surface: '#FFFDFB',        // Warm White (cards)
    surfaceLight: '#F5F1EB',   // Slightly darker cream (inputs)
    surfaceHover: '#EDE8E0',

    // Semantic
    success: '#5B7A65',        // Sage green for success too
    error: '#C75450',          // Warm red
    warning: '#C4913A',        // Warm amber

    // Text
    text: '#3D352E',           // Espresso — primary text
    textSecondary: '#7A7068',  // Stone
    textMuted: '#A69E96',      // Light stone
    textInverse: '#FFFDFB',

    // Borders
    border: '#E8E2DA',
    borderLight: '#F0EBE4',

    // Player (stays dark — appropriate for video)
    playerBg: '#000000',
    playerOverlay: 'rgba(0, 0, 0, 0.65)',
    playerControlBg: 'rgba(10, 10, 15, 0.75)',
    playerPill: 'rgba(255, 255, 255, 0.12)',
    playerText: '#FFFFFF',
    playerDimText: 'rgba(255, 255, 255, 0.55)',

    // Favorites
    heart: '#C75450',
    heartEmpty: '#A69E96',
};

// ─── Shadows ────────────────────────────────────────────────────────────
export const shadows = {
    sm: Platform.select({
        ios: {
            shadowColor: '#8B7E74',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 3,
        },
        android: { elevation: 1 },
    }),
    card: Platform.select({
        ios: {
            shadowColor: '#8B7E74',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
        },
        android: { elevation: 2 },
    }),
    md: Platform.select({
        ios: {
            shadowColor: '#8B7E74',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.10,
            shadowRadius: 12,
        },
        android: { elevation: 4 },
    }),
};

// ─── Spacing ────────────────────────────────────────────────────────────
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 40,
};

// ─── Border Radius ──────────────────────────────────────────────────────
export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 28,         // "Super-rounded" / Bubble effect
    full: 9999,
};

// ─── Typography ─────────────────────────────────────────────────────────
export const typography = {
    hero: {
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: -0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: '700' as const,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 14,
        fontWeight: '400' as const,
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as const,
    },
    tiny: {
        fontSize: 10,
        fontWeight: '600' as const,
        letterSpacing: 0.5,
        textTransform: 'uppercase' as const,
    },
};
