import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel, PlaylistMeta } from '../types';
import { XtreamCredentials } from './xtreamApi';

const KEYS = {
    PLAYLIST_URL: '@iptv_playlist_url',
    PLAYLIST_CHANNELS: '@iptv_playlist_channels',
    PLAYLIST_CATEGORIES: '@iptv_playlist_categories',
    PLAYLIST_META: '@iptv_playlist_meta',
    FAVORITES: '@iptv_favorites',
    XTREAM_CREDENTIALS: '@iptv_xtream_credentials',
    CONNECTION_TYPE: '@iptv_connection_type',
};

// ─── Playlist URL ──────────────────────────────────────────

export async function savePlaylistUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.PLAYLIST_URL, url);
}

export async function getPlaylistUrl(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.PLAYLIST_URL);
}

// ─── Playlist Data ─────────────────────────────────────────

export async function savePlaylistData(
    channels: Channel[],
    categories: string[],
    url: string
): Promise<void> {
    const meta: PlaylistMeta = {
        url,
        name: 'IPTV Playlist',
        channelCount: channels.length,
        lastUpdated: Date.now(),
    };

    // Store in parallel for speed
    await Promise.all([
        AsyncStorage.setItem(KEYS.PLAYLIST_CHANNELS, JSON.stringify(channels)),
        AsyncStorage.setItem(KEYS.PLAYLIST_CATEGORIES, JSON.stringify(categories)),
        AsyncStorage.setItem(KEYS.PLAYLIST_META, JSON.stringify(meta)),
    ]);
}

export async function getPlaylistChannels(): Promise<Channel[] | null> {
    const data = await AsyncStorage.getItem(KEYS.PLAYLIST_CHANNELS);
    return data ? JSON.parse(data) : null;
}

export async function getPlaylistCategories(): Promise<string[] | null> {
    const data = await AsyncStorage.getItem(KEYS.PLAYLIST_CATEGORIES);
    return data ? JSON.parse(data) : null;
}

export async function getPlaylistMeta(): Promise<PlaylistMeta | null> {
    const data = await AsyncStorage.getItem(KEYS.PLAYLIST_META);
    return data ? JSON.parse(data) : null;
}

// ─── Favorites ─────────────────────────────────────────────

export async function saveFavorites(ids: string[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(ids));
}

export async function getFavorites(): Promise<string[]> {
    const data = await AsyncStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
}

// ─── Xtream Codes Credentials ──────────────────────────────

export async function saveXtreamCredentials(creds: XtreamCredentials): Promise<void> {
    await AsyncStorage.setItem(KEYS.XTREAM_CREDENTIALS, JSON.stringify(creds));
    await AsyncStorage.setItem(KEYS.CONNECTION_TYPE, 'xtream');
}

export async function getXtreamCredentials(): Promise<XtreamCredentials | null> {
    const data = await AsyncStorage.getItem(KEYS.XTREAM_CREDENTIALS);
    return data ? JSON.parse(data) : null;
}

export async function saveConnectionType(type: 'm3u' | 'xtream'): Promise<void> {
    await AsyncStorage.setItem(KEYS.CONNECTION_TYPE, type);
}

export async function getConnectionType(): Promise<'m3u' | 'xtream'> {
    const data = await AsyncStorage.getItem(KEYS.CONNECTION_TYPE);
    return (data as 'm3u' | 'xtream') || 'm3u';
}

// ─── Clear ─────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
}
