import React from 'react';
import { Pressable, PressableProps, Animated, ViewStyle, StyleSheet } from 'react-native';

/**
 * Layout-related style keys that belong on the outer Pressable so it
 * participates correctly in flex layouts (e.g. flex: 1, margins, sizing).
 */
const LAYOUT_KEYS: Set<string> = new Set([
  'flex', 'flexGrow', 'flexShrink', 'flexBasis',
  'alignSelf',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'position', 'top', 'left', 'right', 'bottom', 'start', 'end',
  'zIndex',
]);

/** Split a style object into layout props (outer) and visual props (inner). */
function splitStyles(style?: ViewStyle | ViewStyle[]): { layoutStyle: ViewStyle; visualStyle: ViewStyle } {
  const flat = StyleSheet.flatten(style) || {};
  const layoutStyle: Record<string, any> = {};
  const visualStyle: Record<string, any> = {};

  for (const [key, value] of Object.entries(flat)) {
    if (LAYOUT_KEYS.has(key)) {
      layoutStyle[key] = value;
    } else {
      visualStyle[key] = value;
    }
  }

  return { layoutStyle: layoutStyle as ViewStyle, visualStyle: visualStyle as ViewStyle };
}

interface AnimatedPressableProps extends PressableProps {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({ style, children, ...props }) => {
  const animatedScale = React.useRef(new Animated.Value(1)).current;
  const { layoutStyle, visualStyle } = splitStyles(style);

  const handlePressIn = () => {
    Animated.spring(animatedScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Pressable
      {...props}
      style={layoutStyle}
      onPressIn={(e) => {
        handlePressIn();
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        handlePressOut();
        props.onPressOut?.(e);
      }}
    >
      <Animated.View style={[visualStyle, { transform: [{ scale: animatedScale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
