import { useState, useEffect, useCallback } from 'react';
import { getFavorites, saveFavorites } from '../services/storage';

interface UseFavoritesReturn {
    favoriteIds: Set<string>;
    toggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
}

export function useFavorites(): UseFavoritesReturn {
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    // Load from storage on mount
    useEffect(() => {
        getFavorites().then((ids) => {
            if (ids.length > 0) {
                setFavoriteIds(new Set(ids));
            }
        });
    }, []);

    const toggleFavorite = useCallback((id: string) => {
        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            // Persist in background
            saveFavorites(Array.from(next)).catch(console.warn);
            return next;
        });
    }, []);

    const isFavorite = useCallback(
        (id: string) => favoriteIds.has(id),
        [favoriteIds]
    );

    return { favoriteIds, toggleFavorite, isFavorite };
}
