export const colors = {
    // Core palette — dark mode first
    background: '#0A0A0F',
    surface: '#13131A',
    surfaceLight: '#1C1C28',
    surfaceHover: '#252535',

    // Accent
    primary: '#6C5CE7',
    primaryLight: '#8B7CF6',
    primaryDark: '#5A4BD1',
    primaryGhost: 'rgba(108, 92, 231, 0.12)',

    // Semantic
    success: '#00D68F',
    error: '#FF4757',
    warning: '#FFA502',

    // Text
    textPrimary: '#EAEAEF',
    textSecondary: '#8888A0',
    textMuted: '#55556A',
    textInverse: '#0A0A0F',

    // Borders
    border: '#2A2A3D',
    borderLight: '#3A3A50',

    // Player
    playerBg: '#000000',
    playerOverlay: 'rgba(0, 0, 0, 0.65)',

    // Favorites
    heart: '#FF6B81',
    heartEmpty: '#55556A',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 40,
};

export const borderRadius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
};

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
