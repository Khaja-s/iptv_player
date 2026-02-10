import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Channel } from '../types';
import ChannelCard from '../components/ChannelCard';
import CategoryTabs from '../components/CategoryTabs';
import SearchBar from '../components/SearchBar';
import LoadingOverlay from '../components/LoadingOverlay';
import { colors, spacing, typography } from '../constants/theme';

interface ChannelsScreenProps {
    channels: Channel[];
    categories: string[];
    loading: boolean;
    loadingStatus: string;
    error: string | null;
    isFavorite: (id: string) => boolean;
    onToggleFavorite: (id: string) => void;
    onPlayChannel: (channel: Channel, allChannels: Channel[]) => void;
    onCancelLoad: () => void;
}

export default function ChannelsScreen({
    channels,
    categories,
    loading,
    loadingStatus,
    error,
    isFavorite,
    onToggleFavorite,
    onPlayChannel,
    onCancelLoad,
}: ChannelsScreenProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // Filter channels by category + search (memoized for perf)
    const filteredChannels = useMemo(() => {
        let result = channels;

        if (activeCategory !== 'All') {
            result = result.filter((ch) => ch.group === activeCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (ch) =>
                    ch.name.toLowerCase().includes(q) ||
                    ch.group.toLowerCase().includes(q)
            );
        }

        return result;
    }, [channels, activeCategory, searchQuery]);

    const handlePlayChannel = useCallback(
        (channel: Channel) => {
            onPlayChannel(channel, filteredChannels);
        },
        [onPlayChannel, filteredChannels]
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

    if (loading && channels.length === 0) {
        return <LoadingOverlay visible message={loadingStatus} onCancel={onCancelLoad} />;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Channels</Text>
                <Text style={styles.count}>
                    {filteredChannels.length.toLocaleString()} channels
                </Text>
            </View>

            {/* Search */}
            <SearchBar onSearch={setSearchQuery} />

            {/* Categories */}
            {categories.length > 0 && (
                <CategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                />
            )}

            {/* Error */}
            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
            )}

            {/* Channel list */}
            {channels.length === 0 && !loading ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyEmoji}>📺</Text>
                    <Text style={styles.emptyTitle}>No Channels Yet</Text>
                    <Text style={styles.emptyText}>
                        Go to Settings to add a playlist URL
                    </Text>
                </View>
            ) : (
                <FlashList
                    data={filteredChannels}
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
    errorBanner: {
        backgroundColor: 'rgba(255, 71, 87, 0.12)',
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
        padding: spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 71, 87, 0.3)',
    },
    errorText: {
        ...typography.caption,
        color: colors.error,
    },
    listContent: {
        paddingBottom: spacing.xxxl,
        paddingTop: spacing.sm,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxxl,
    },
    emptyEmoji: {
        fontSize: 48,
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
