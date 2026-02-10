import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Channel } from '../types';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface PlayerScreenProps {
    channel: Channel;
    channelList: Channel[];
    onBack: () => void;
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
}

export default function PlayerScreen({
    channel: initialChannel,
    channelList,
    onBack,
    isFavorite,
    onToggleFavorite,
}: PlayerScreenProps) {
    const [currentChannel, setCurrentChannel] = useState(initialChannel);
    const [currentIndex, setCurrentIndex] = useState(() =>
        channelList.findIndex((ch) => ch.id === initialChannel.id)
    );
    const [isBuffering, setIsBuffering] = useState(true);
    const [hasError, setHasError] = useState(false);

    const player = useVideoPlayer(currentChannel.url, (p) => {
        p.loop = false;
        p.play();
    });

    // Listen for player status changes
    useEffect(() => {
        if (!player) return;

        const statusSub = player.addListener('statusChange', (payload) => {
            if (payload.status === 'readyToPlay') {
                setIsBuffering(false);
                setHasError(false);
            } else if (payload.status === 'loading') {
                setIsBuffering(true);
            } else if (payload.status === 'error') {
                setIsBuffering(false);
                setHasError(true);
            }
        });

        return () => {
            statusSub.remove();
        };
    }, [player]);

    const switchChannel = useCallback(
        (direction: 'prev' | 'next') => {
            const newIndex =
                direction === 'next'
                    ? (currentIndex + 1) % channelList.length
                    : (currentIndex - 1 + channelList.length) % channelList.length;

            const newChannel = channelList[newIndex];
            setCurrentIndex(newIndex);
            setCurrentChannel(newChannel);
            setIsBuffering(true);
            setHasError(false);

            player.replace({ uri: newChannel.url });
            player.play();
        },
        [currentIndex, channelList, player]
    );

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* Video */}
            <VideoView
                style={styles.video}
                player={player}
                contentFit="contain"
                nativeControls={true}
            />

            {/* Buffering overlay */}
            {isBuffering && (
                <View style={styles.bufferOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.bufferText}>Loading stream...</Text>
                </View>
            )}

            {/* Error overlay */}
            {hasError && (
                <View style={styles.bufferOverlay}>
                    <Text style={styles.errorEmoji}>📡</Text>
                    <Text style={styles.errorTitle}>Stream Unavailable</Text>
                    <Text style={styles.bufferText}>
                        This channel may be offline or geo-restricted
                    </Text>
                </View>
            )}

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onToggleFavorite(currentChannel.id)}
                    style={styles.favBtn}
                >
                    <Text
                        style={[styles.favHeart, isFavorite && styles.favHeartActive]}
                    >
                        {isFavorite ? '♥' : '♡'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Bottom info bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => switchChannel('prev')}
                >
                    <Text style={styles.navBtnText}>◀ Prev</Text>
                </TouchableOpacity>

                <View style={styles.channelInfo}>
                    <Text style={styles.channelName} numberOfLines={1}>
                        {currentChannel.name}
                    </Text>
                    <Text style={styles.channelGroup} numberOfLines={1}>
                        {currentChannel.group}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => switchChannel('next')}
                >
                    <Text style={styles.navBtnText}>Next ▶</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.playerBg,
    },
    video: {
        flex: 1,
        width: '100%',
    },
    bufferOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.playerOverlay,
        zIndex: 5,
    },
    bufferText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    errorEmoji: {
        fontSize: 40,
        marginBottom: spacing.md,
    },
    errorTitle: {
        ...typography.subtitle,
        color: colors.textPrimary,
    },
    topBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        zIndex: 10,
    },
    backBtn: {
        backgroundColor: colors.playerOverlay,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    backText: {
        ...typography.caption,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    favBtn: {
        backgroundColor: colors.playerOverlay,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    favHeart: {
        fontSize: 22,
        color: colors.heartEmpty,
    },
    favHeartActive: {
        color: colors.heart,
    },
    bottomBar: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        zIndex: 10,
    },
    navBtn: {
        backgroundColor: colors.playerOverlay,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    navBtnText: {
        ...typography.caption,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    channelInfo: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.md,
    },
    channelName: {
        ...typography.subtitle,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    channelGroup: {
        ...typography.tiny,
        color: colors.textSecondary,
        marginTop: 2,
    },
});
