import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/theme';

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
                        <Ionicons
                            name="close-outline"
                            size={16}
                            color={colors.textSecondary}
                            style={{ marginRight: spacing.xs }}
                        />
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
        backgroundColor: 'rgba(250, 247, 242, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    box: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        alignItems: 'center',
        gap: spacing.lg,
        ...shadows.md,
    },
    text: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceLight,
    },
    cancelText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
});
