import { Channel } from '../types';

/**
 * High-performance M3U/M3U8 parser.
 * Handles playlists with 10K+ entries by doing a single-pass parse.
 */

const EXTINF_REGEX = /^#EXTINF:\s*-?\d+\s*,?\s*/;
const TVG_NAME_REGEX = /tvg-name="([^"]*)"/;
const TVG_LOGO_REGEX = /tvg-logo="([^"]*)"/;
const GROUP_REGEX = /group-title="([^"]*)"/;
const TVG_LANG_REGEX = /tvg-language="([^"]*)"/;

function extractAttribute(line: string, regex: RegExp): string {
    const match = line.match(regex);
    return match ? match[1].trim() : '';
}

function extractDisplayName(line: string): string {
    // The display name comes after the last comma in #EXTINF line
    const commaIdx = line.lastIndexOf(',');
    if (commaIdx === -1) return 'Unknown';
    return line.substring(commaIdx + 1).trim() || 'Unknown';
}

export function parseM3U(content: string): {
    channels: Channel[];
    categories: string[];
} {
    const lines = content.split('\n');
    const channels: Channel[] = [];
    const categorySet = new Set<string>();

    let i = 0;
    const len = lines.length;

    while (i < len) {
        const line = lines[i].trim();

        if (EXTINF_REGEX.test(line)) {
            // Next non-empty, non-comment line is the URL
            let url = '';
            let j = i + 1;
            while (j < len) {
                const nextLine = lines[j].trim();
                if (nextLine && !nextLine.startsWith('#')) {
                    url = nextLine;
                    break;
                }
                j++;
            }

            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                const tvgName = extractAttribute(line, TVG_NAME_REGEX);
                const displayName = extractDisplayName(line);
                const name = tvgName || displayName;
                const logo = extractAttribute(line, TVG_LOGO_REGEX);
                const group = extractAttribute(line, GROUP_REGEX) || 'Uncategorized';
                const language = extractAttribute(line, TVG_LANG_REGEX);

                // Generate a fast, stable ID from URL hash
                const id = fastHash(url);

                channels.push({ id, name, url, logo, group, language });
                categorySet.add(group);
            }

            i = j + 1;
            continue;
        }

        i++;
    }

    // Sort categories alphabetically, but keep "Uncategorized" last
    const categories = Array.from(categorySet).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
    });

    return { channels, categories };
}

/**
 * Simple fast hash for generating channel IDs.
 * Not cryptographic — just needs to be unique and deterministic.
 */
function fastHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}
