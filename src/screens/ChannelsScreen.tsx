import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Channel } from '../types';
import ChannelCard from '../components/ChannelCard';
import CategoryTabs from '../components/CategoryTabs';
import SearchBar from '../components/SearchBar';
import LoadingOverlay from '../components/LoadingOverlay';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

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
                <View style={styles.headerLeft}>
                    <Ionicons
                        name="tv-outline"
                        size={22}
                        color={colors.primary}
                        style={{ marginRight: spacing.sm }}
                    />
                    <Text style={styles.title}>Channels</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                        {filteredChannels.length.toLocaleString()}
                    </Text>
                </View>
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
                    <Ionicons
                        name="warning-outline"
                        size={16}
                        color={colors.error}
                        style={{ marginRight: spacing.xs }}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Channel list */}
            {channels.length === 0 && !loading ? (
                <View style={styles.empty}>
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons
                                name="tv-outline"
                                size={40}
                                color={colors.primary}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>No Channels Yet</Text>
                        <Text style={styles.emptyText}>
                            Add a playlist URL in Settings to get started
                        </Text>
                        <View style={styles.emptyHint}>
                            <Ionicons
                                name="arrow-forward-outline"
                                size={14}
                                color={colors.primary}
                            />
                            <Text style={styles.emptyHintText}>
                                Go to Settings tab
                            </Text>
                        </View>
                    </View>
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
        backgroundColor: colors.primaryGhost,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    countText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '700',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(199, 84, 80, 0.08)',
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    errorText: {
        ...typography.caption,
        color: colors.error,
        flex: 1,
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
        backgroundColor: colors.primaryGhost,
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
        marginBottom: spacing.lg,
    },
    emptyHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    emptyHintText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
    },
});
