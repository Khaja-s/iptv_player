import React, { memo, useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

interface CategoryTabsProps {
    categories: string[];
    activeCategory: string;
    onSelect: (category: string) => void;
}

const SEARCH_THRESHOLD = 8;

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
                        <View style={styles.searchInputWrap}>
                            <Ionicons
                                name="filter-outline"
                                size={15}
                                color={colors.textMuted}
                                style={{ marginRight: spacing.xs }}
                            />
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
                                    onPress={() => setCatQuery('')}
                                    activeOpacity={0.7}
                                    hitSlop={8}
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={17}
                                        color={colors.textMuted}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
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
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    searchInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...shadows.sm,
    },
    searchInput: {
        flex: 1,
        ...typography.caption,
        color: colors.text,
        padding: 0,
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
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: colors.textInverse,
        fontWeight: '700',
    },
});
