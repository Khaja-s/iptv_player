import { useState, useEffect, useCallback, useRef } from 'react';
import { Channel } from '../types';
import { parseM3U } from '../services/m3uParser';
import {
    loadXtreamChannels,
    parseXtreamUrl,
    XtreamCredentials,
} from '../services/xtreamApi';
import {
    getPlaylistUrl,
    getPlaylistChannels,
    getPlaylistCategories,
    savePlaylistData,
    savePlaylistUrl,
    saveXtreamCredentials,
    getXtreamCredentials,
    getConnectionType,
    saveConnectionType,
} from '../services/storage';

const FETCH_TIMEOUT_MS = 15000; // 15 second timeout for M3U

interface UsePlaylistReturn {
    channels: Channel[];
    categories: string[];
    loading: boolean;
    loadingStatus: string;
    error: string | null;
    channelCount: number;
    loadPlaylist: (url: string) => Promise<void>;
    loadXtream: (creds: XtreamCredentials) => Promise<void>;
    refresh: () => Promise<void>;
    cancelLoad: () => void;
}

export function usePlaylist(): UsePlaylistReturn {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState('Initializing...');
    const [error, setError] = useState<string | null>(null);
    const currentUrl = useRef<string | null>(null);
    const currentXtream = useRef<XtreamCredentials | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    // Load from cache on mount
    useEffect(() => {
        loadFromCache();
    }, []);

    const loadFromCache = async () => {
        try {
            setLoadingStatus('Loading cached data...');
            const [cachedChannels, cachedCategories, url, connType] =
                await Promise.all([
                    getPlaylistChannels(),
                    getPlaylistCategories(),
                    getPlaylistUrl(),
                    getConnectionType(),
                ]);

            currentUrl.current = url;

            // Also load xtream creds if available
            const xtreamCreds = await getXtreamCredentials();
            if (xtreamCreds) {
                currentXtream.current = xtreamCreds;
            }

            if (cachedChannels && cachedChannels.length > 0) {
                setChannels(cachedChannels);
                setCategories(cachedCategories || []);
                setLoading(false);
            } else if (connType === 'xtream' && xtreamCreds) {
                await fetchXtream(xtreamCreds);
            } else if (url) {
                await fetchAndParse(url);
            } else {
                setLoading(false);
            }
        } catch (e) {
            setError('Failed to load cached playlist');
            setLoading(false);
        }
    };

    const fetchAndParse = async (url: string) => {
        // Auto-detect Xtream Codes URLs
        const xtreamCreds = parseXtreamUrl(url);
        if (xtreamCreds) {
            return fetchXtream(xtreamCreds);
        }

        // Cancel any in-flight request
        abortRef.current?.abort();

        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        setLoadingStatus('Connecting to server...');

        // Timeout timer
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'IPTVPlayer/1.0',
                    Accept: '*/*',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(
                    `Server returned ${response.status} (${response.statusText || 'error'})`
                );
            }

            setLoadingStatus('Downloading playlist...');
            const content = await response.text();

            if (!content || content.trim().length === 0) {
                throw new Error('Server returned an empty response');
            }

            setLoadingStatus('Parsing channels...');
            const result = parseM3U(content);

            if (result.channels.length === 0) {
                throw new Error(
                    'No channels found. The URL may not be a valid M3U playlist.'
                );
            }

            // Update state
            setChannels(result.channels);
            setCategories(result.categories);
            currentUrl.current = url;
            setLoadingStatus(`Loaded ${result.channels.length} channels`);

            // Persist in background (don't block UI)
            savePlaylistData(result.channels, result.categories, url).catch(
                console.warn
            );
            savePlaylistUrl(url).catch(console.warn);
            saveConnectionType('m3u').catch(console.warn);
        } catch (e: any) {
            clearTimeout(timeoutId);

            if (e.name === 'AbortError') {
                setError(
                    'Connection timed out. The server took too long to respond. Check the URL and try again.'
                );
            } else if (e.message?.includes('Network request failed')) {
                setError(
                    'Network error. Check your internet connection and make sure the URL is correct.'
                );
            } else {
                setError(e.message || 'Failed to load playlist');
            }
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    };

    const fetchXtream = async (creds: XtreamCredentials) => {
        // Cancel any in-flight request
        abortRef.current?.abort();

        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const result = await loadXtreamChannels(
                creds,
                setLoadingStatus,
                controller.signal
            );

            if (result.channels.length === 0) {
                throw new Error('No live channels found on this server.');
            }

            // Update state
            setChannels(result.channels);
            setCategories(result.categories);
            currentXtream.current = creds;
            setLoadingStatus(`Loaded ${result.channels.length} channels`);

            // Persist in background
            savePlaylistData(
                result.channels,
                result.categories,
                `xtream://${creds.server}`
            ).catch(console.warn);
            saveXtreamCredentials(creds).catch(console.warn);
        } catch (e: any) {
            if (e.name === 'AbortError') {
                setError(
                    'Connection timed out. The server took too long to respond.'
                );
            } else if (e.message?.includes('Network request failed')) {
                setError(
                    'Network error. Check your internet connection and server URL.'
                );
            } else {
                setError(e.message || 'Failed to connect to Xtream server');
            }
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    };

    const loadPlaylist = useCallback(async (url: string) => {
        await fetchAndParse(url);
    }, []);

    const loadXtream = useCallback(async (creds: XtreamCredentials) => {
        await fetchXtream(creds);
    }, []);

    const refresh = useCallback(async () => {
        if (currentXtream.current) {
            await fetchXtream(currentXtream.current);
        } else if (currentUrl.current) {
            await fetchAndParse(currentUrl.current);
        }
    }, []);

    const cancelLoad = useCallback(() => {
        abortRef.current?.abort();
        setLoading(false);
        setError('Load cancelled');
    }, []);

    return {
        channels,
        categories,
        loading,
        loadingStatus,
        error,
        channelCount: channels.length,
        loadPlaylist,
        loadXtream,
        refresh,
        cancelLoad,
    };
}
