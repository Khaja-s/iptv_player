import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Channel } from '../types';
import ChannelCard from '../components/ChannelCard';
import { colors, spacing, typography } from '../constants/theme';

interface FavoritesScreenProps {
    channels: Channel[];
    favoriteIds: Set<string>;
    isFavorite: (id: string) => boolean;
    onToggleFavorite: (id: string) => void;
    onPlayChannel: (channel: Channel, allChannels: Channel[]) => void;
}

export default function FavoritesScreen({
    channels,
    favoriteIds,
    isFavorite,
    onToggleFavorite,
    onPlayChannel,
}: FavoritesScreenProps) {
    const favoriteChannels = useMemo(
        () => channels.filter((ch) => favoriteIds.has(ch.id)),
        [channels, favoriteIds]
    );

    const handlePlayChannel = useCallback(
        (channel: Channel) => {
            onPlayChannel(channel, favoriteChannels);
        },
        [onPlayChannel, favoriteChannels]
    );

    const renderItem = useCallback(
        ({ item }: { item: Channel }) => (
            <ChannelCard
                channel={item}
                isFavorite={isFavorite(item.id)}
                onPress={handlePlayChannel}
                onToggleFavorite={onToggleFavorite}
            />
        ),
        [isFavorite, handlePlayChannel, onToggleFavorite]
    );

    const keyExtractor = useCallback((item: Channel) => item.id, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Favorites</Text>
                <Text style={styles.count}>{favoriteChannels.length} saved</Text>
            </View>

            {favoriteChannels.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyEmoji}>♡</Text>
                    <Text style={styles.emptyTitle}>No Favorites Yet</Text>
                    <Text style={styles.emptyText}>
                        Tap the heart icon on any channel to save it here
                    </Text>
                </View>
            ) : (
                <FlashList
                    data={favoriteChannels}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xs,
    },
    title: {
        ...typography.hero,
        color: colors.textPrimary,
    },
    count: {
        ...typography.caption,
        color: colors.textMuted,
    },
    listContent: {
        paddingBottom: spacing.xxxl,
        paddingTop: spacing.md,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxxl,
    },
    emptyEmoji: {
        fontSize: 56,
        color: colors.textMuted,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        ...typography.title,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
