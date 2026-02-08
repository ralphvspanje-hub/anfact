import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export const ThemeToggle = () => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.7 : 1, backgroundColor: theme.colors.surfaceHighlight },
      ]}
    >
      <Ionicons
        name={isDark ? 'sunny' : 'moon'}
        size={20}
        color={theme.colors.primary}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
  },
});
