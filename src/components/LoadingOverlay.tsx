import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

interface LoadingOverlayProps {
    message?: string;
    visible: boolean;
    onCancel?: () => void;
}

export default function LoadingOverlay({
    message = 'Loading...',
    visible,
    onCancel,
}: LoadingOverlayProps) {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.box}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.text}>{message}</Text>
                {onCancel && (
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={onCancel}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 10, 15, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    box: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.xxl,
        alignItems: 'center',
        gap: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    text: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    cancelBtn: {
        marginTop: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
});
