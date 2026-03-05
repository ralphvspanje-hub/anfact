import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fact } from '../types/fact';
import MarkdownText from './MarkdownText';
import { useTheme, typography, spacing, layout, scaleForWeb } from '../theme';

interface FactCardProps {
  fact: Fact;
  onDelete: () => void;
  onDeleteAtomicCard?: (atomicCardId: string) => void;
}

export default function FactCard({ fact, onDelete, onDeleteAtomicCard }: FactCardProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(fact.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const hasAtomicCards = fact.atomicCards && fact.atomicCards.length > 0;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={styles.flex1} />
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.question, { color: theme.colors.text }]}>{fact.question}</Text>

      {/* For legacy facts, show the answer directly */}
      {!hasAtomicCards && (
        <>
          <MarkdownText text={fact.answer} style={{ fontSize: typography.sizes.md, color: theme.colors.textSecondary, lineHeight: scaleForWeb(22), marginBottom: spacing.sm, fontFamily: typography.fontFamily.regular }} />
          {fact.mnemonic && (
            <Text style={[styles.mnemonic, { color: theme.colors.textSecondary }]}>💡 {fact.mnemonic}</Text>
          )}
        </>
      )}

      {/* For atomic facts, show expandable card list */}
      {hasAtomicCards && (
        <>
          <TouchableOpacity style={styles.expandToggle} onPress={toggleExpand}>
            <Text style={[styles.cardCountText, { color: theme.colors.primary }]}>
              {fact.atomicCards!.length} {fact.atomicCards!.length === 1 ? 'card' : 'cards'}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.atomicCardsList}>
              {fact.atomicCards!.map((ac) => (
                <View
                  key={ac.id}
                  style={[styles.atomicCardRow, { borderColor: theme.colors.border }]}
                >
                  <View style={styles.atomicCardContent}>
                    <Text style={[styles.atomicCardFront, { color: theme.colors.text }]} numberOfLines={2}>
                      {ac.front}
                    </Text>
                    <Text style={[styles.atomicCardBack, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {ac.back}
                    </Text>
                    {ac.mnemonic && (
                      <Text style={[styles.atomicCardMnemonic, { color: theme.colors.textSecondary }]}>
                        💡 {ac.mnemonic}
                      </Text>
                    )}
                  </View>
                  {onDeleteAtomicCard && (
                    <TouchableOpacity
                      onPress={() => onDeleteAtomicCard(ac.id)}
                      style={styles.atomicTrashButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <Text style={[styles.date, { color: theme.colors.textSecondary }]}>Saved on {formattedDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.bold,
  },
  question: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.sm,
  },
  mnemonic: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    lineHeight: scaleForWeb(20),
    fontFamily: typography.fontFamily.regular,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  cardCountText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.sm,
  },
  atomicCardsList: {
    marginBottom: spacing.sm,
  },
  atomicCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: layout.borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  atomicCardContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  atomicCardFront: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.sm,
    marginBottom: 2,
  },
  atomicCardBack: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    lineHeight: scaleForWeb(18),
  },
  atomicCardMnemonic: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    marginTop: 2,
  },
  atomicTrashButton: {
    padding: spacing.xs,
  },
  date: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.regular,
  },
});
