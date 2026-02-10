import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants/theme';
import {
    getPlaylistUrl,
    getXtreamCredentials,
    getConnectionType,
    clearAll,
} from '../services/storage';
import { XtreamCredentials } from '../services/xtreamApi';

type ConnectionMode = 'm3u' | 'xtream';

interface SettingsScreenProps {
    channelCount: number;
    loading: boolean;
    loadingStatus: string;
    onLoadPlaylist: (url: string) => Promise<void>;
    onLoadXtream: (creds: XtreamCredentials) => Promise<void>;
    onCancelLoad: () => void;
}

const DEFAULT_PLAYLIST =
    'https://iptv-org.github.io/iptv/index.category.m3u';

export default function SettingsScreen({
    channelCount,
    loading,
    loadingStatus,
    onLoadPlaylist,
    onLoadXtream,
    onCancelLoad,
}: SettingsScreenProps) {
    const [mode, setMode] = useState<ConnectionMode>('m3u');
    const [url, setUrl] = useState('');
    const [server, setServer] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadSavedSettings();
    }, []);

    const loadSavedSettings = async () => {
        const [savedUrl, savedCreds, connType] = await Promise.all([
            getPlaylistUrl(),
            getXtreamCredentials(),
            getConnectionType(),
        ]);

        setMode(connType);

        if (savedUrl) setUrl(savedUrl);
        if (savedCreds) {
            setServer(savedCreds.server);
            setUsername(savedCreds.username);
            setPassword(savedCreds.password);
        }
    };

    const handleLoadM3u = async () => {
        const targetUrl = url.trim() || DEFAULT_PLAYLIST;
        setUrl(targetUrl);
        setSaved(false);

        try {
            await onLoadPlaylist(targetUrl);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to load playlist');
        }
    };

    const handleLoadXtream = async () => {
        if (!server.trim()) {
            Alert.alert('Missing Info', 'Please enter a server URL');
            return;
        }
        if (!username.trim()) {
            Alert.alert('Missing Info', 'Please enter a username');
            return;
        }
        if (!password.trim()) {
            Alert.alert('Missing Info', 'Please enter a password');
            return;
        }

        setSaved(false);

        try {
            await onLoadXtream({
                server: server.trim(),
                username: username.trim(),
                password: password.trim(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to connect');
        }
    };

    const handleUseDefault = () => {
        setUrl(DEFAULT_PLAYLIST);
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear All Data',
            'This will remove your playlist, credentials, favorites, and all cached data.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAll();
                        setUrl('');
                        setServer('');
                        setUsername('');
                        setPassword('');
                        Alert.alert('Done', 'All data cleared. Restart the app.');
                    },
                },
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Settings</Text>

                {/* ─── Connection Mode Toggle ─── */}
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[
                            styles.toggleBtn,
                            mode === 'm3u' && styles.toggleBtnActive,
                        ]}
                        onPress={() => setMode('m3u')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                mode === 'm3u' && styles.toggleTextActive,
                            ]}
                        >
                            M3U URL
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.toggleBtn,
                            mode === 'xtream' && styles.toggleBtnActive,
                        ]}
                        onPress={() => setMode('xtream')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                mode === 'xtream' && styles.toggleTextActive,
                            ]}
                        >
                            Xtream Login
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ─── M3U Mode ─── */}
                {mode === 'm3u' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Playlist URL</Text>
                        <Text style={styles.sectionDesc}>
                            Enter an M3U playlist URL, or an Xtream Codes get.php URL
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={url}
                            onChangeText={setUrl}
                            placeholder="https://example.com/playlist.m3u"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            returnKeyType="go"
                            onSubmitEditing={handleLoadM3u}
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnPrimary]}
                                onPress={handleLoadM3u}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.btnPrimaryText}>
                                    {loading ? 'Loading...' : 'Load Playlist'}
                                </Text>
                            </TouchableOpacity>

                            {loading ? (
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnSecondary]}
                                    onPress={onCancelLoad}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.btnSecondaryText}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnSecondary]}
                                    onPress={handleUseDefault}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.btnSecondaryText}>
                                        Use Default
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* ─── Xtream Mode ─── */}
                {mode === 'xtream' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Server Credentials</Text>
                        <Text style={styles.sectionDesc}>
                            Enter your IPTV provider's server URL, username, and password
                        </Text>

                        <Text style={styles.fieldLabel}>Server URL</Text>
                        <TextInput
                            style={styles.input}
                            value={server}
                            onChangeText={setServer}
                            placeholder="http://example.com:8080"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                        />

                        <Text style={styles.fieldLabel}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Your username"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={styles.fieldLabel}>Password</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Your password"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnPrimary]}
                                onPress={handleLoadXtream}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.btnPrimaryText}>
                                    {loading ? 'Connecting...' : 'Connect'}
                                </Text>
                            </TouchableOpacity>

                            {loading && (
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnSecondary]}
                                    onPress={onCancelLoad}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.btnSecondaryText}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* ─── Status Banners ─── */}
                {saved && (
                    <View style={styles.successBanner}>
                        <Text style={styles.successText}>
                            ✓ Loaded {channelCount.toLocaleString()} channels
                        </Text>
                    </View>
                )}

                {loading && (
                    <View style={styles.loadingBanner}>
                        <Text style={styles.loadingBannerText}>
                            ⏳ {loadingStatus}
                        </Text>
                    </View>
                )}

                {/* ─── Stats ─── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Playlist Info</Text>

                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Channels loaded</Text>
                        <Text style={styles.statValue}>
                            {channelCount.toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Connection</Text>
                        <Text style={styles.statValue}>
                            {mode === 'xtream' ? 'Xtream Codes' : 'M3U URL'}
                        </Text>
                    </View>
                </View>

                {/* ─── Danger Zone ─── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.error }]}>
                        Danger Zone
                    </Text>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnDanger]}
                        onPress={handleClearCache}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.btnDangerText}>Clear All Data</Text>
                    </TouchableOpacity>
                </View>

                {/* ─── About ─── */}
                <View style={styles.about}>
                    <Text style={styles.aboutText}>IPTV Player v1.0.0</Text>
                    <Text style={styles.aboutText}>
                        Built with Expo + React Native
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl * 2,
    },
    title: {
        ...typography.hero,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: 4,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    toggleBtnActive: {
        backgroundColor: colors.primary,
    },
    toggleText: {
        ...typography.caption,
        color: colors.textMuted,
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    section: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        ...typography.subtitle,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    sectionDesc: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    fieldLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        ...typography.body,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    btn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimary: {
        backgroundColor: colors.primary,
        flex: 1,
    },
    btnPrimaryText: {
        ...typography.caption,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    btnSecondary: {
        backgroundColor: colors.surfaceLight,
        borderWidth: 1,
        borderColor: colors.border,
    },
    btnSecondaryText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    btnDanger: {
        backgroundColor: 'rgba(255, 71, 87, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 71, 87, 0.3)',
    },
    btnDangerText: {
        ...typography.caption,
        color: colors.error,
        fontWeight: '600',
    },
    successBanner: {
        backgroundColor: 'rgba(0, 214, 143, 0.12)',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(0, 214, 143, 0.3)',
    },
    successText: {
        ...typography.caption,
        color: colors.success,
        fontWeight: '600',
    },
    loadingBanner: {
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    loadingBannerText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    statLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    statValue: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
        maxWidth: '60%',
    },
    about: {
        alignItems: 'center',
        paddingTop: spacing.xl,
        gap: spacing.xs,
    },
    aboutText: {
        ...typography.caption,
        color: colors.textMuted,
    },
});
