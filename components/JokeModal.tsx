import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme, typography, spacing, layout } from '../theme';

const MAX_EVADE_COUNT = 10;

// Button dimensions (must match styles)
const EVADE_BTN_W = 180;
const EVADE_BTN_H = 44;

interface JokeModalProps {
  visible: boolean;
  onConfirm: () => void;
}

export default function JokeModal({ visible, onConfirm }: JokeModalProps) {
  const { theme } = useTheme();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const [evadeCount, setEvadeCount] = useState(0);
  const evadeX = useSharedValue(0);
  const evadeY = useSharedValue(0);

  const buttonHidden = evadeCount >= MAX_EVADE_COUNT;

  const evadeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: evadeX.value }, { translateY: evadeY.value }],
    opacity: 1,
  }));

  const handleEvade = useCallback(() => {
    setEvadeCount((c) => c + 1);

    // Random position within safe bounds (keep button fully on-screen)
    const safeW = screenW - EVADE_BTN_W - 40;
    const safeH = screenH - EVADE_BTN_H - 200; // leave room for top/bottom chrome

    const newX = Math.random() * safeW - safeW / 2;
    const newY = Math.random() * safeH - safeH / 2;

    evadeX.value = withSpring(newX, { damping: 12, stiffness: 180 });
    evadeY.value = withSpring(newY, { damping: 12, stiffness: 180 });
  }, [screenW, screenH, evadeX, evadeY]);

  // Reset state each time modal opens
  const handleShow = useCallback(() => {
    setEvadeCount(0);
    evadeX.value = 0;
    evadeY.value = 0;
  }, [evadeX, evadeY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={handleShow}
      onRequestClose={() => {}} // block back-button dismiss
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.text, { color: theme.colors.text }]}>
            Press continue to place your $20 order.
          </Text>

          {/* Continue — always visible */}
          <Pressable
            style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
            onPress={onConfirm}
          >
            <Text style={[styles.confirmText, { color: theme.colors.primaryForeground }]}>
              Continue
            </Text>
          </Pressable>

          {/* Cancel — evading button */}
          {!buttonHidden && (
            <Animated.View style={[styles.evadeWrapper, evadeStyle]}>
              <Pressable
                style={[
                  styles.evadeButton,
                  { backgroundColor: theme.colors.error },
                ]}
                onPress={handleEvade}
              >
                <Text style={[styles.evadeText, { color: theme.colors.primaryForeground }]}>
                  Cancel
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  text: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: spacing.sm + 4,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  confirmText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
  evadeWrapper: {
    // Wrapper allows translate without breaking card layout
    zIndex: 10,
  },
  evadeButton: {
    width: EVADE_BTN_W,
    height: EVADE_BTN_H,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evadeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
});
