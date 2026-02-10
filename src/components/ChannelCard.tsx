import React, { memo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Channel } from '../types';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface ChannelCardProps {
    channel: Channel;
    isFavorite: boolean;
    onPress: (channel: Channel) => void;
    onToggleFavorite: (id: string) => void;
}

const ChannelCard = memo<ChannelCardProps>(
    ({ channel, isFavorite, onPress, onToggleFavorite }) => {
        const handlePress = useCallback(() => {
            onPress(channel);
        }, [channel, onPress]);

        const handleFavorite = useCallback(() => {
            onToggleFavorite(channel.id);
        }, [channel.id, onToggleFavorite]);

        return (
            <TouchableOpacity
                style={styles.container}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <View style={styles.logoContainer}>
                    {channel.logo ? (
                        <Image
                            source={{ uri: channel.logo }}
                            style={styles.logo}
                            contentFit="contain"
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoLetter}>
                                {channel.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {channel.name}
                    </Text>
                    <Text style={styles.group} numberOfLines={1}>
                        {channel.group}
                    </Text>
                </View>

                <Pressable
                    onPress={handleFavorite}
                    style={styles.favoriteBtn}
                    hitSlop={12}
                >
                    <Text style={[styles.heart, isFavorite && styles.heartActive]}>
                        {isFavorite ? '♥' : '♡'}
                    </Text>
                </Pressable>
            </TouchableOpacity>
        );
    },
    (prev, next) =>
        prev.channel.id === next.channel.id &&
        prev.isFavorite === next.isFavorite
);

ChannelCard.displayName = 'ChannelCard';

export default ChannelCard;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 44,
        height: 44,
    },
    logoPlaceholder: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primaryGhost,
    },
    logoLetter: {
        ...typography.title,
        color: colors.primary,
    },
    info: {
        flex: 1,
        marginLeft: spacing.md,
        justifyContent: 'center',
    },
    name: {
        ...typography.subtitle,
        color: colors.textPrimary,
    },
    group: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    favoriteBtn: {
        padding: spacing.sm,
        marginLeft: spacing.sm,
    },
    heart: {
        fontSize: 22,
        color: colors.heartEmpty,
    },
    heartActive: {
        color: colors.heart,
    },
});
