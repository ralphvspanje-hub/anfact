import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { layout, useTheme } from '../theme';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Container: React.FC<ContainerProps> = ({ children, style }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.innerContainer, style]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    paddingHorizontal: 16,
  },
});
