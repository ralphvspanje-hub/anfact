import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, router } from 'expo-router';
import { useTheme } from '../theme';
import { palette } from '../theme/colors';
import { SettingsMenu } from './SettingsMenu';

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Library', icon: 'library-outline', iconActive: 'library', route: '/library' },
  { label: 'Search', icon: 'search-outline', iconActive: 'search', route: '/' },
  { label: 'Recall', icon: 'school-outline', iconActive: 'school', route: '/recall' },
];

export const HeaderBar = () => {
  const { theme } = useTheme();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;

  const isActive = (route: string) => {
    if (route === '/') return pathname === '/' || pathname === '/index';
    return pathname === route;
  };

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
      {/* Left: Logo */}
      {!isNarrow && (
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/AnFact_Logo_Green_A_NoBg.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>nFact</Text>
        </View>
      )}

      {/* Center: Nav items */}
      <View style={[styles.navContainer, isNarrow && styles.navContainerNarrow]}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.route);
          return (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.navItem,
                isNarrow && styles.navItemNarrow,
                active && [styles.navItemActive, { borderBottomColor: theme.colors.primary }],
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name={active ? item.iconActive : item.icon}
                size={20}
                color={active ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: active ? theme.colors.primary : theme.colors.textSecondary,
                    fontFamily: active ? 'Nunito-Bold' : 'Nunito-Regular',
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Right: Settings menu */}
      <View style={[styles.rightSection, isNarrow && styles.rightSectionNarrow]}>
        <SettingsMenu />
      </View>
    </View>
  );
};

const BRAND_GREEN = '#7aa087';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 100,
      },
    }),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minWidth: 100,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  logoText: {
    fontFamily: 'LeagueSpartan-Bold',
    fontSize: 26,
    color: BRAND_GREEN,
    marginLeft: -7,
    marginBottom: 1,
    ...Platform.select({
      web: { userSelect: 'none' as any },
    }),
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navContainerNarrow: {
    flex: 1,
    justifyContent: 'center',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  navItemActive: {
    borderBottomWidth: 2,
  },
  navLabel: {
    fontSize: 14,
    ...Platform.select({
      web: { userSelect: 'none' as any },
    }),
  },
  navItemNarrow: {
    minHeight: 44,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  rightSectionNarrow: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
