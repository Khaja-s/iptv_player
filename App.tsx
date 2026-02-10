import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import ChannelsScreen from './src/screens/ChannelsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PlayerScreen from './src/screens/PlayerScreen';

import { usePlaylist } from './src/hooks/usePlaylist';
import { useFavorites } from './src/hooks/useFavorites';
import { Channel } from './src/types';
import { colors } from './src/constants/theme';

const Tab = createBottomTabNavigator();

const darkTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Channels: '📺',
    Favorites: '♥',
    Settings: '⚙',
  };

  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || '●'}
    </Text>
  );
}

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
      <>
        <StatusBar hidden />
        <PlayerScreen
          channel={playerChannel}
          channelList={playerChannelList}
          onBack={handleClosePlayer}
          isFavorite={isFavorite(playerChannel.id)}
          onToggleFavorite={toggleFavorite}
        />
      </>
    );
  }

  return (
    <NavigationContainer theme={darkTheme}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon label={route.name} focused={focused} />
            ),
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 56,
              paddingBottom: 4,
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
