import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

const DEBOUNCE_MS = 300;

export default function SearchBar({
    onSearch,
    placeholder = 'Search channels...',
}: SearchBarProps) {
    const [text, setText] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleChange = useCallback(
        (value: string) => {
            setText(value);

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                onSearch(value);
            }, DEBOUNCE_MS);
        },
        [onSearch]
    );

    const handleClear = useCallback(() => {
        setText('');
        onSearch('');
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    }, [onSearch]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <View style={styles.container}>
            <Ionicons
                name="search-outline"
                size={18}
                color={colors.textMuted}
                style={styles.icon}
            />
            <TextInput
                style={styles.input}
                value={text}
                onChangeText={handleChange}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
            />
            {text.length > 0 && (
                <TouchableOpacity
                    onPress={handleClear}
                    style={styles.clearBtn}
                    hitSlop={8}
                >
                    <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.textMuted}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.lg,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        height: 46,
        ...shadows.sm,
    },
    icon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        ...typography.body,
        color: colors.text,
        height: '100%',
        padding: 0,
    },
    clearBtn: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
    },
});
