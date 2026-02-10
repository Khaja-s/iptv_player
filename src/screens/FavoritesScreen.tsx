import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../types';
import ChannelCard from '../components/ChannelCard';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

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
                <View style={styles.headerLeft}>
                    <Ionicons
                        name="heart-outline"
                        size={22}
                        color={colors.heart}
                        style={{ marginRight: spacing.sm }}
                    />
                    <Text style={styles.title}>Favorites</Text>
                </View>
                {favoriteChannels.length > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>
                            {favoriteChannels.length}
                        </Text>
                    </View>
                )}
            </View>

            {favoriteChannels.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons
                                name="heart-outline"
                                size={40}
                                color={colors.heart}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
                        <Text style={styles.emptyText}>
                            Tap the heart icon on any channel to save it here
                        </Text>
                    </View>
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
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xs,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        ...typography.hero,
        color: colors.text,
    },
    countBadge: {
        backgroundColor: 'rgba(199, 84, 80, 0.10)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    countText: {
        ...typography.caption,
        color: colors.heart,
        fontWeight: '700',
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
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        alignItems: 'center',
        ...shadows.card,
    },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(199, 84, 80, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        ...typography.title,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
