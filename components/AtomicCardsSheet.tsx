import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, spacing, layout } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';
import { useActionKey } from '../hooks/useActionKey';

interface DraftCard {
  front: string;
  back: string;
}

interface AtomicCardsSheetProps {
  visible: boolean;
  cards: DraftCard[];
  onRemoveCard: (index: number) => void;
  onClearAll: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AtomicCardsSheet({
  visible,
  cards,
  onRemoveCard,
  onClearAll,
  onConfirm,
  onClose,
}: AtomicCardsSheetProps) {
  const { theme } = useTheme();

  // Space / Enter / ArrowRight confirms when the sheet is open with cards
  useActionKey(onConfirm, visible && cards.length > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} activeOpacity={1} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Review Cards
            </Text>
            {cards.length > 0 && (
              <TouchableOpacity onPress={onClearAll}>
                <Text style={[styles.clearAllText, { color: theme.colors.error }]}>
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Card list */}
          <ScrollView
            style={styles.cardList}
            contentContainerStyle={styles.cardListContent}
            showsVerticalScrollIndicator={false}
          >
            {cards.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No cards to save.
              </Text>
            ) : (
              cards.map((card, index) => (
                <View
                  key={index}
                  style={[
                    styles.cardRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardContent}>
                    <Text
                      style={[styles.cardFront, { color: theme.colors.text }]}
                      numberOfLines={2}
                    >
                      {card.front}
                    </Text>
                    <Text
                      style={[styles.cardBack, { color: theme.colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {card.back}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onRemoveCard(index)}
                    style={styles.trashButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {cards.length > 0 ? (
              <AnimatedPressable
                style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={onConfirm}
              >
                <Text style={[styles.confirmButtonText, { color: theme.colors.primaryForeground }]}>
                  Save {cards.length} {cards.length === 1 ? 'Card' : 'Cards'}
                </Text>
              </AnimatedPressable>
            ) : (
              <AnimatedPressable
                style={[styles.confirmButton, { backgroundColor: theme.colors.surfaceHighlight }]}
                onPress={onClose}
              >
                <Text style={[styles.confirmButtonText, { color: theme.colors.textSecondary }]}>
                  Close
                </Text>
              </AnimatedPressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: layout.borderRadius.lg,
    borderTopRightRadius: layout.borderRadius.lg,
    borderWidth: 2,
    borderBottomWidth: 0,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
  },
  clearAllText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.sm,
  },
  cardList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  cardListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: layout.borderRadius.md,
    borderWidth: 2,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardFront: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
    marginBottom: spacing.xs,
  },
  cardBack: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  trashButton: {
    padding: spacing.xs,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  confirmButton: {
    borderRadius: layout.borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  confirmButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
});
