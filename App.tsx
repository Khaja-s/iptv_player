import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ChannelsScreen from './src/screens/ChannelsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PlayerScreen from './src/screens/PlayerScreen';

import { usePlaylist } from './src/hooks/usePlaylist';
import { useFavorites } from './src/hooks/useFavorites';
import { Channel } from './src/types';
import { colors } from './src/constants/theme';

const Tab = createBottomTabNavigator();

// ─── Japandi light theme for React Navigation ──────────────────────────
const japandiTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.borderLight,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

// ─── Tab icon map ───────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { focused: string; default: string }> = {
  Channels: { focused: 'tv', default: 'tv-outline' },
  Favorites: { focused: 'heart', default: 'heart-outline' },
  Settings: { focused: 'settings', default: 'settings-outline' },
};

export default function App() {
  const {
    channels,
    categories,
    loading,
    loadingStatus,
    error,
    channelCount,
    loadPlaylist,
    loadXtream,
    refresh,
    cancelLoad,
  } = usePlaylist();

  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();

  // Player state
  const [playerChannel, setPlayerChannel] = useState<Channel | null>(null);
  const [playerChannelList, setPlayerChannelList] = useState<Channel[]>([]);

  const handlePlayChannel = useCallback(
    (channel: Channel, allChannels: Channel[]) => {
      setPlayerChannel(channel);
      setPlayerChannelList(allChannels);
    },
    []
  );

  const handleClosePlayer = useCallback(() => {
    setPlayerChannel(null);
    setPlayerChannelList([]);
  }, []);

  // If player is open, show full-screen player
  if (playerChannel) {
    return (
      <SafeAreaProvider>
        <StatusBar hidden />
        <PlayerScreen
          channel={playerChannel}
          channelList={playerChannelList}
          onBack={handleClosePlayer}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={japandiTheme}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused, color, size }) => {
                const iconSet = TAB_ICONS[route.name] || { focused: 'ellipse', default: 'ellipse-outline' };
                const iconName = focused ? iconSet.focused : iconSet.default;
                return (
                  <Ionicons
                    name={iconName as any}
                    size={22}
                    color={color}
                  />
                );
              },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopColor: colors.borderLight,
                borderTopWidth: 1,
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
              },
            })}
          >
            <Tab.Screen name="Channels">
              {() => (
                <ChannelsScreen
                  channels={channels}
                  categories={categories}
                  loading={loading}
                  loadingStatus={loadingStatus}
                  error={error}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onPlayChannel={handlePlayChannel}
                  onCancelLoad={cancelLoad}
                />
              )}
            </Tab.Screen>

            <Tab.Screen name="Favorites">
              {() => (
                <FavoritesScreen
                  channels={channels}
                  favoriteIds={favoriteIds}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onPlayChannel={handlePlayChannel}
                />
              )}
            </Tab.Screen>

            <Tab.Screen name="Settings">
              {() => (
                <SettingsScreen
                  channelCount={channelCount}
                  loading={loading}
                  loadingStatus={loadingStatus}
                  onLoadPlaylist={loadPlaylist}
                  onLoadXtream={loadXtream}
                  onCancelLoad={cancelLoad}
                />
              )}
            </Tab.Screen>
          </Tab.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
