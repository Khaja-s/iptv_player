import { Channel } from '../types';

export interface XtreamCredentials {
    server: string; // e.g. http://example.com:8080
    username: string;
    password: string;
}

interface XtreamUserInfo {
    user_info: {
        username: string;
        password: string;
        status: string;
        exp_date: string;
        active_cons: string;
        max_connections: string;
    };
    server_info: {
        url: string;
        port: string;
    };
}

interface XtreamCategory {
    category_id: string;
    category_name: string;
}

interface XtreamStream {
    num: number;
    name: string;
    stream_type: string;
    stream_id: number;
    stream_icon: string;
    epg_channel_id: string | null;
    category_id: string;
    category_ids?: number[];
}

const FETCH_TIMEOUT_MS = 20000; // 20s — Xtream APIs can be slow

/**
 * Normalize the server URL: ensure it has a protocol and no trailing slash
 */
function normalizeServer(server: string): string {
    let s = server.trim();
    if (!s.startsWith('http://') && !s.startsWith('https://')) {
        s = 'http://' + s;
    }
    return s.replace(/\/+$/, '');
}

/**
 * Fetch with timeout + abort support
 */
async function fetchWithTimeout(
    url: string,
    timeoutMs: number = FETCH_TIMEOUT_MS,
    signal?: AbortSignal
): Promise<Response> {
    const controller = new AbortController();

    // Link external signal if provided
    if (signal) {
        signal.addEventListener('abort', () => controller.abort());
    }

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'IPTVPlayer/1.0',
                Accept: '*/*',
            },
        });
        clearTimeout(timeoutId);
        return response;
    } catch (e: any) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
            throw new Error('Connection timed out. The server took too long to respond.');
        }
        throw e;
    }
}

/**
 * Authenticate with Xtream Codes server and get user info
 */
export async function authenticateXtream(
    creds: XtreamCredentials,
    signal?: AbortSignal
): Promise<XtreamUserInfo> {
    const server = normalizeServer(creds.server);
    const url = `${server}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}`;

    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS, signal);

    if (!response.ok) {
        throw new Error(`Server returned ${response.status}. Check your credentials.`);
    }

    const data = await response.json();

    if (!data.user_info) {
        throw new Error('Invalid response from server. This may not be an Xtream Codes server.');
    }

    if (data.user_info.status !== 'Active') {
        throw new Error(`Account status: ${data.user_info.status}. Contact your provider.`);
    }

    return data;
}

/**
 * Fetch live stream categories from Xtream Codes
 */
export async function fetchXtreamCategories(
    creds: XtreamCredentials,
    signal?: AbortSignal
): Promise<XtreamCategory[]> {
    const server = normalizeServer(creds.server);
    const url = `${server}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&action=get_live_categories`;

    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS, signal);

    if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch live streams from Xtream Codes
 */
export async function fetchXtreamStreams(
    creds: XtreamCredentials,
    signal?: AbortSignal
): Promise<XtreamStream[]> {
    const server = normalizeServer(creds.server);
    const url = `${server}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&action=get_live_streams`;

    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS, signal);

    if (!response.ok) {
        throw new Error(`Failed to fetch streams: ${response.status}`);
    }

    return response.json();
}

/**
 * Build the playback URL for a live stream
 */
function buildStreamUrl(creds: XtreamCredentials, streamId: number): string {
    const server = normalizeServer(creds.server);
    return `${server}/live/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.m3u8`;
}

/**
 * Build the M3U playlist URL from Xtream creds (alternative approach)
 */
export function buildXtreamM3uUrl(creds: XtreamCredentials): string {
    const server = normalizeServer(creds.server);
    return `${server}/get.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&type=m3u_plus&output=ts`;
}

/**
 * Full flow: authenticate, fetch categories + streams, convert to Channel[]
 */
export async function loadXtreamChannels(
    creds: XtreamCredentials,
    onStatus?: (status: string) => void,
    signal?: AbortSignal
): Promise<{ channels: Channel[]; categories: string[] }> {
    // Step 1: Authenticate
    onStatus?.('Authenticating...');
    await authenticateXtream(creds, signal);

    // Step 2: Fetch categories and streams in parallel
    onStatus?.('Fetching channels...');
    const [rawCategories, rawStreams] = await Promise.all([
        fetchXtreamCategories(creds, signal),
        fetchXtreamStreams(creds, signal),
    ]);

    // Build category lookup
    const categoryMap = new Map<string, string>();
    for (const cat of rawCategories) {
        categoryMap.set(cat.category_id, cat.category_name);
    }

    // Step 3: Convert to our Channel format
    onStatus?.('Processing channels...');
    const channels: Channel[] = rawStreams.map((stream) => ({
        id: `xtream_${stream.stream_id}`,
        name: stream.name,
        url: buildStreamUrl(creds, stream.stream_id),
        logo: stream.stream_icon || '',
        group: categoryMap.get(stream.category_id) || 'Uncategorized',
        language: '',
    }));

    // Extract unique categories (preserving order from server)
    const categories = rawCategories.map((c) => c.category_name);

    return { channels, categories };
}

/**
 * Detect if a URL is an Xtream Codes get.php URL and extract credentials
 */
export function parseXtreamUrl(url: string): XtreamCredentials | null {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // Match /get.php or /player_api.php patterns
        if (pathname.includes('get.php') || pathname.includes('player_api.php')) {
            const username = urlObj.searchParams.get('username');
            const password = urlObj.searchParams.get('password');

            if (username && password) {
                const server = `${urlObj.protocol}//${urlObj.host}`;
                return { server, username, password };
            }
        }
    } catch {
        // Not a valid URL
    }
    return null;
}
