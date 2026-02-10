import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    Platform,
    Animated,
    PanResponder,
    GestureResponderEvent,
    PanResponderGestureState,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Channel } from '../types';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

// ─── Constants ──────────────────────────────────────────────────────────
const CONTROLS_TIMEOUT = 4000;
const STREAM_TIMEOUT = 15000;
const SWIPE_THRESHOLD = 80;

interface PlayerScreenProps {
    channel: Channel;
    channelList: Channel[];
    onBack: () => void;
    isFavorite: (id: string) => boolean;
    onToggleFavorite: (id: string) => void;
}

export default function PlayerScreen({
    channel: initialChannel,
    channelList,
    onBack,
    isFavorite,
    onToggleFavorite,
}: PlayerScreenProps) {
    // ─── State ──────────────────────────────────────────────────────────
    const [currentChannel, setCurrentChannel] = useState(initialChannel);
    const [currentIndex, setCurrentIndex] = useState(() =>
        channelList.findIndex((ch) => ch.id === initialChannel.id)
    );
    const [isBuffering, setIsBuffering] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showControls, setShowControls] = useState(true);
    const [isSwitching, setIsSwitching] = useState(false);

    // ─── Refs ───────────────────────────────────────────────────────────
    const controlsOpacity = useRef(new Animated.Value(1)).current;
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(true);
    // Track which URL we *intentionally* loaded — ignore stale errors
    const expectedUrl = useRef(initialChannel.url);

    // ─── Player ─────────────────────────────────────────────────────────
    const player = useVideoPlayer(currentChannel.url, (p) => {
        p.loop = false;
        p.bufferOptions = {
            preferredForwardBufferDuration: 10,
            waitsToMinimizeStalling: true,
            minBufferForPlayback: 2,
        };
        p.play();
    });

    // ─── Cleanup on unmount ─────────────────────────────────────────────
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (hideTimer.current) clearTimeout(hideTimer.current);
            if (streamTimer.current) clearTimeout(streamTimer.current);
        };
    }, []);

    // ─── Player status listener ─────────────────────────────────────────
    useEffect(() => {
        if (!player) return;

        const statusSub = player.addListener('statusChange', (payload) => {
            if (!isMounted.current) return;

            if (payload.status === 'readyToPlay') {
                setIsBuffering(false);
                setHasError(false);
                setIsSwitching(false);
                clearStreamTimeout();
                resetHideTimer();
            } else if (payload.status === 'loading') {
                setIsBuffering(true);
                startStreamTimeout();
            } else if (payload.status === 'error') {
                // ─── CRITICAL FIX: Ignore stale errors ──────────
                // When we call replaceAsync, the *old* stream being
                // aborted can fire a 'error' status event.  If the
                // player's current source doesn't match the URL we
                // intentionally loaded, this is a stale event — skip it.
                const currentSource = (player as any)?.currentSrc || '';
                const expected = expectedUrl.current;
                // If there's a mismatch AND we're in a switching state,
                // this is almost certainly a stale abort error — ignore.
                if (isSwitching && currentSource !== expected) {
                    return;
                }

                setIsBuffering(false);
                setHasError(true);
                setIsSwitching(false);
                setErrorMessage(
                    (payload as any).error?.message || 'Stream unavailable'
                );
                clearStreamTimeout();
            }
        });

        return () => {
            statusSub.remove();
        };
    }, [player]);

    // ─── Stream timeout ─────────────────────────────────────────────────
    const clearStreamTimeout = useCallback(() => {
        if (streamTimer.current) {
            clearTimeout(streamTimer.current);
            streamTimer.current = null;
        }
    }, []);

    const startStreamTimeout = useCallback(() => {
        clearStreamTimeout();
        streamTimer.current = setTimeout(() => {
            if (isMounted.current) {
                setIsBuffering(false);
                setHasError(true);
                setIsSwitching(false);
                setErrorMessage('Stream timed out — the channel may be offline');
            }
        }, STREAM_TIMEOUT);
    }, [clearStreamTimeout]);

    // ─── Controls auto-hide ─────────────────────────────────────────────
    const resetHideTimer = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
            if (isMounted.current && !isBuffering && !hasError) {
                Animated.timing(controlsOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    if (isMounted.current) setShowControls(false);
                });
            }
        }, CONTROLS_TIMEOUT);
    }, [controlsOpacity, isBuffering, hasError]);

    const toggleControls = useCallback(() => {
        if (showControls) {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            Animated.timing(controlsOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                if (isMounted.current) setShowControls(false);
            });
        } else {
            setShowControls(true);
            controlsOpacity.setValue(0);
            Animated.timing(controlsOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
            resetHideTimer();
        }
    }, [showControls, controlsOpacity, resetHideTimer]);

    // ─── Channel switching (async) ──────────────────────────────────────
    const switchChannel = useCallback(
        async (direction: 'prev' | 'next') => {
            if (isSwitching || channelList.length === 0) return;

            const newIndex =
                direction === 'next'
                    ? (currentIndex + 1) % channelList.length
                    : (currentIndex - 1 + channelList.length) % channelList.length;

            const newChannel = channelList[newIndex];
            setCurrentIndex(newIndex);
            setCurrentChannel(newChannel);
            setIsBuffering(true);
            setHasError(false);
            setIsSwitching(true);
            setErrorMessage('');

            // Track the URL we're intentionally loading
            expectedUrl.current = newChannel.url;

            try {
                await player.replaceAsync({ uri: newChannel.url });
                player.play();
            } catch (e: any) {
                if (!isMounted.current) return;
                // Ignore abort errors — they happen when replaceAsync
                // interrupts a previous load (totally normal)
                const msg = e?.message?.toLowerCase?.() || '';
                if (msg.includes('abort') || msg.includes('cancel')) {
                    // Not a real error — the next replaceAsync will take over
                    return;
                }
                setIsBuffering(false);
                setHasError(true);
                setIsSwitching(false);
                setErrorMessage(e?.message || 'Failed to load stream');
            }
        },
        [currentIndex, channelList, player, isSwitching]
    );

    // ─── Skip to next from error overlay ────────────────────────────────
    // Reset isSwitching first so the guard doesn't block it
    const handleSkipNext = useCallback(() => {
        setIsSwitching(false);
        setHasError(false);
        // Use a microtask to ensure state update before switchChannel reads it
        setTimeout(() => switchChannel('next'), 0);
    }, [switchChannel]);

    // ─── Retry handler ──────────────────────────────────────────────────
    const handleRetry = useCallback(async () => {
        setIsBuffering(true);
        setHasError(false);
        setIsSwitching(false);
        setErrorMessage('');

        expectedUrl.current = currentChannel.url;

        try {
            await player.replaceAsync({ uri: currentChannel.url });
            player.play();
        } catch (e: any) {
            if (isMounted.current) {
                const msg = e?.message?.toLowerCase?.() || '';
                if (msg.includes('abort') || msg.includes('cancel')) return;
                setIsBuffering(false);
                setHasError(true);
                setErrorMessage(e?.message || 'Failed to load stream');
            }
        }
    }, [player, currentChannel]);

    // ─── Swipe gesture ──────────────────────────────────────────────────
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (
                _: GestureResponderEvent,
                gestureState: PanResponderGestureState
            ) => {
                return (
                    Math.abs(gestureState.dx) > 20 &&
                    Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
                );
            },
            onPanResponderRelease: (
                _: GestureResponderEvent,
                gestureState: PanResponderGestureState
            ) => {
                if (gestureState.dx > SWIPE_THRESHOLD) {
                    switchChannel('prev');
                } else if (gestureState.dx < -SWIPE_THRESHOLD) {
                    switchChannel('next');
                }
            },
        })
    ).current;

    // ─── Derived state ──────────────────────────────────────────────────
    const channelIsFav = isFavorite(currentChannel.id);
    const channelPosition = `${currentIndex + 1} of ${channelList.length}`;

    // ─── Render ─────────────────────────────────────────────────────────
    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            <StatusBar hidden />

            {/* Video */}
            <TouchableWithoutFeedback onPress={toggleControls}>
                <View style={styles.videoWrapper}>
                    <VideoView
                        style={styles.video}
                        player={player}
                        contentFit="contain"
                        nativeControls={false}
                    />
                </View>
            </TouchableWithoutFeedback>

            {/* Buffering overlay */}
            {isBuffering && (
                <View style={styles.bufferOverlay}>
                    <View style={styles.bufferCard}>
                        {currentChannel.logo ? (
                            <Image
                                source={{ uri: currentChannel.logo }}
                                style={styles.bufferLogo}
                                contentFit="contain"
                            />
                        ) : null}
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                            style={{ marginTop: spacing.md }}
                        />
                        <Text style={styles.bufferChannelName} numberOfLines={1}>
                            {currentChannel.name}
                        </Text>
                        <Text style={styles.bufferText}>Loading stream…</Text>

                        {/* Back button on buffer too */}
                        <TouchableOpacity
                            style={styles.overlayBackBtn}
                            onPress={onBack}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={16}
                                color={colors.playerDimText}
                            />
                            <Text style={styles.overlayBackText}>Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Error overlay */}
            {hasError && (
                <View style={styles.bufferOverlay}>
                    <View style={styles.errorCard}>
                        <Ionicons
                            name="cloud-offline-outline"
                            size={48}
                            color={colors.error}
                        />
                        <Text style={styles.errorTitle}>Stream Unavailable</Text>
                        <Text style={styles.errorMsg} numberOfLines={2}>
                            {errorMessage ||
                                'This channel may be offline or geo-restricted'}
                        </Text>

                        <View style={styles.errorActions}>
                            <TouchableOpacity
                                style={styles.retryBtn}
                                onPress={handleRetry}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="refresh"
                                    size={18}
                                    color={colors.playerText}
                                />
                                <Text style={styles.retryBtnText}>Retry</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.skipBtn}
                                onPress={handleSkipNext}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="play-skip-forward"
                                    size={18}
                                    color={colors.playerText}
                                />
                                <Text style={styles.retryBtnText}>
                                    Next Channel
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Back button — escape hatch */}
                        <TouchableOpacity
                            style={styles.overlayBackBtn}
                            onPress={onBack}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={16}
                                color={colors.playerDimText}
                            />
                            <Text style={styles.overlayBackText}>
                                Back to Channels
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Controls overlay */}
            {showControls && (
                <Animated.View
                    style={[styles.controlsLayer, { opacity: controlsOpacity }]}
                    pointerEvents="box-none"
                >
                    {/* ── Top Bar ── */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            onPress={onBack}
                            style={styles.pillBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={20}
                                color={colors.playerText}
                            />
                            <Text style={styles.pillBtnText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => onToggleFavorite(currentChannel.id)}
                            style={[
                                styles.iconBtn,
                                channelIsFav && styles.iconBtnActive,
                            ]}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={channelIsFav ? 'heart' : 'heart-outline'}
                                size={22}
                                color={channelIsFav ? colors.heart : colors.playerText}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* ── Bottom Bar ── */}
                    <View style={styles.bottomBar}>
                        {/* Prev */}
                        <TouchableOpacity
                            style={styles.navBtn}
                            onPress={() => switchChannel('prev')}
                            activeOpacity={0.7}
                            disabled={isSwitching}
                        >
                            <Ionicons
                                name="play-skip-back"
                                size={22}
                                color={colors.playerText}
                            />
                        </TouchableOpacity>

                        {/* Channel info */}
                        <View style={styles.channelInfo}>
                            {currentChannel.logo ? (
                                <Image
                                    source={{ uri: currentChannel.logo }}
                                    style={styles.channelLogo}
                                    contentFit="contain"
                                />
                            ) : (
                                <View style={styles.channelLogoPlaceholder}>
                                    <Ionicons
                                        name="tv-outline"
                                        size={16}
                                        color={colors.playerDimText}
                                    />
                                </View>
                            )}
                            <View style={styles.channelMeta}>
                                <Text style={styles.channelName} numberOfLines={1}>
                                    {currentChannel.name}
                                </Text>
                                <Text style={styles.channelGroup} numberOfLines={1}>
                                    {currentChannel.group}
                                    {'  ·  '}
                                    {channelPosition}
                                </Text>
                            </View>
                        </View>

                        {/* Next */}
                        <TouchableOpacity
                            style={styles.navBtn}
                            onPress={() => switchChannel('next')}
                            activeOpacity={0.7}
                            disabled={isSwitching}
                        >
                            <Ionicons
                                name="play-skip-forward"
                                size={22}
                                color={colors.playerText}
                            />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.playerBg,
    },
    videoWrapper: {
        flex: 1,
    },
    video: {
        flex: 1,
        width: '100%',
    },

    // ── Buffering / Error Overlays ──────────────────────────────────────
    bufferOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 15,
    },
    bufferCard: {
        alignItems: 'center',
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.xxxl,
    },
    bufferLogo: {
        width: 64,
        height: 64,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    bufferChannelName: {
        ...typography.subtitle,
        color: colors.playerText,
        marginTop: spacing.lg,
        maxWidth: width * 0.7,
        textAlign: 'center',
    },
    bufferText: {
        ...typography.caption,
        color: colors.playerDimText,
        marginTop: spacing.sm,
    },

    errorCard: {
        alignItems: 'center',
        backgroundColor: colors.playerControlBg,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.xxxl,
        marginHorizontal: spacing.xxl,
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    errorTitle: {
        ...typography.subtitle,
        color: colors.playerText,
        marginTop: spacing.lg,
    },
    errorMsg: {
        ...typography.caption,
        color: colors.playerDimText,
        marginTop: spacing.sm,
        textAlign: 'center',
        lineHeight: 18,
    },
    errorActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xl,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
    },
    skipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.playerPill,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
    },
    retryBtnText: {
        ...typography.caption,
        color: colors.playerText,
        fontWeight: '600',
    },

    // ── Back button visible on overlays ─────────────────────────────────
    overlayBackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xl,
        gap: spacing.xs,
        paddingVertical: spacing.sm,
    },
    overlayBackText: {
        ...typography.caption,
        color: colors.playerDimText,
    },

    // ── Controls Layer ──────────────────────────────────────────────────
    controlsLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
        justifyContent: 'space-between',
    },

    // ── Top Bar ─────────────────────────────────────────────────────────
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 54 : 20,
    },
    pillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.playerControlBg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    pillBtnText: {
        ...typography.caption,
        color: colors.playerText,
        fontWeight: '600',
    },
    iconBtn: {
        backgroundColor: colors.playerControlBg,
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    iconBtnActive: {
        backgroundColor: 'rgba(199, 84, 80, 0.15)',
        borderColor: 'rgba(199, 84, 80, 0.25)',
    },

    // ── Bottom Bar ──────────────────────────────────────────────────────
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 44 : 20,
        gap: spacing.md,
    },
    navBtn: {
        backgroundColor: colors.playerControlBg,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    channelInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.playerControlBg,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    channelLogo: {
        width: 34,
        height: 34,
        borderRadius: borderRadius.sm,
    },
    channelLogoPlaceholder: {
        width: 34,
        height: 34,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.playerPill,
        justifyContent: 'center',
        alignItems: 'center',
    },
    channelMeta: {
        flex: 1,
    },
    channelName: {
        ...typography.caption,
        color: colors.playerText,
        fontWeight: '700',
    },
    channelGroup: {
        ...typography.tiny,
        color: colors.playerDimText,
        marginTop: 1,
    },
});
