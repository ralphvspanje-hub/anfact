import React, { useEffect } from 'react';
import { View, Pressable, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { layout, spacing } from '../theme';

const FLIP_DURATION = 400;
const CARD_HEIGHT = 320;

interface FlipCardProps {
  /** Content shown on the front face (question) */
  front: React.ReactNode;
  /** Content shown on the back face (answer) */
  back: React.ReactNode;
  /** Whether the card is currently flipped */
  isFlipped: boolean;
  /** Called when the user taps the card to toggle flip */
  onFlip: () => void;
  /** When false, rotation snaps instantly (no animation). Default true. */
  animateFlip?: boolean;
  /** Optional extra styles for the outer container */
  style?: ViewStyle;
  /** Theme colors */
  cardBackgroundColor: string;
  cardBorderColor: string;
  /** Optional overlay rendered absolutely on top of each face (e.g. study-ahead badge) */
  overlay?: React.ReactNode;
  /** When true, card uses flex: 1 instead of fixed height */
  flexHeight?: boolean;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  front,
  back,
  isFlipped,
  onFlip,
  animateFlip = true,
  style,
  cardBackgroundColor,
  cardBorderColor,
  overlay,
  flexHeight = false,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animateFlip) {
      rotation.value = withTiming(isFlipped ? 180 : 0, {
        duration: FLIP_DURATION,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      });
    } else {
      // Snap instantly — used when resetting for a new card
      rotation.value = isFlipped ? 180 : 0;
    }
  }, [isFlipped, animateFlip]);

  // Front face: visible 0° → 90°, hidden 90° → 180°
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [0, 180]);
    const opacity = interpolate(rotation.value, [0, 89, 90, 180], [1, 1, 0, 0]);
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
    };
  });

  // Back face: hidden 0° → 90°, visible 90° → 180°
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [180, 360]);
    const opacity = interpolate(rotation.value, [0, 89, 90, 180], [0, 0, 1, 1]);
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
    };
  });

  const cardBase: ViewStyle = {
    backgroundColor: cardBackgroundColor,
    borderColor: cardBorderColor,
  };

  return (
    <Pressable onPress={onFlip} style={[styles.container, flexHeight && styles.containerFlex, style]}>
      {/* Front face */}
      <Animated.View style={[styles.face, cardBase, frontAnimatedStyle]}>
        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={styles.faceContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {front}
        </ScrollView>
        {overlay && (
          <View style={styles.overlay} pointerEvents="none">
            {overlay}
          </View>
        )}
      </Animated.View>

      {/* Back face */}
      <Animated.View style={[styles.face, styles.backFace, cardBase, backAnimatedStyle]}>
        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={styles.faceContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {back}
        </ScrollView>
        {overlay && (
          <View style={styles.overlay} pointerEvents="none">
            {overlay}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT,
    marginBottom: spacing.md,
  },
  containerFlex: {
    height: undefined,
    flex: 1,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: layout.borderRadius.md,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  backFace: {
    // Back face is positioned absolutely on top of front,
    // but starts rotated 180° so it is hidden initially.
  },
  overlay: {
    position: 'absolute',
    top: spacing.sm,
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: layout.borderRadius.sm,
  },
  faceContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
