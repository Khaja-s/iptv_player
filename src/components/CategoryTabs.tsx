import React, { memo, useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface CategoryTabsProps {
    categories: string[];
    activeCategory: string;
    onSelect: (category: string) => void;
}

const SEARCH_THRESHOLD = 8; // Show search when more than 8 categories

const CategoryTabs = memo<CategoryTabsProps>(
    ({ categories, activeCategory, onSelect }) => {
        const scrollRef = useRef<ScrollView>(null);
        const [catQuery, setCatQuery] = useState('');

        const showSearch = categories.length > SEARCH_THRESHOLD;

        const filteredCategories = useMemo(() => {
            if (!catQuery.trim()) return categories;
            const q = catQuery.toLowerCase();
            return categories.filter((cat) =>
                cat.toLowerCase().includes(q)
            );
        }, [categories, catQuery]);

        const allCategories = ['All', ...filteredCategories];

        return (
            <View style={styles.container}>
                {showSearch && (
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.searchInput}
                            value={catQuery}
                            onChangeText={setCatQuery}
                            placeholder="Filter categories..."
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                        />
                        {catQuery.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearBtn}
                                onPress={() => setCatQuery('')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.clearText}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {allCategories.map((cat) => {
                        const isActive = cat === activeCategory;
                        return (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => onSelect(cat)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    }
);

CategoryTabs.displayName = 'CategoryTabs';

export default CategoryTabs;

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        paddingVertical: spacing.sm,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    searchInput: {
        flex: 1,
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...typography.caption,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    clearBtn: {
        marginLeft: spacing.sm,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    clearText: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    tab: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceLight,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
