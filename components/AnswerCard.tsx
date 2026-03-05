import React, { useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MarkdownText from './MarkdownText';
import { useTheme, typography, spacing, layout, scaleForWeb } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';
import { savePhrases, getRandomPhrase } from '../constants/phrases';

/** Module-level ref so no-repeat tracking survives across remounts */
const _lastSaveIdx = { current: -1 };

interface AnswerCardProps {
  answer: string;
  onSave: () => void;
  onSkip?: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

export default function AnswerCard({ answer, onSave, onSkip, isSaving, isSaved }: AnswerCardProps) {
  const { theme } = useTheme();
  // Pick a phrase once per mount (useMemo with [] deps = stable for this instance)
  const savedPhrase = useMemo(() => getRandomPhrase(savePhrases, _lastSaveIdx), []);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.answerLabel, { color: theme.colors.textSecondary }]}>Answer:</Text>
      <MarkdownText text={answer} style={{ fontSize: typography.sizes.md, color: theme.colors.text, lineHeight: scaleForWeb(24), fontFamily: typography.fontFamily.regular }} />
      
      <View style={styles.saveContainer}>
        {isSaved ? (
          <Text style={[styles.savedText, { color: theme.colors.success }]}>✓ {savedPhrase}</Text>
        ) : (
          <>
            {onSkip && !isSaving && (
              <Pressable onPress={onSkip} hitSlop={8}>
                <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
                  Forget about it cuh
                </Text>
              </Pressable>
            )}
            <AnimatedPressable
              style={[
                styles.saveButton,
                { backgroundColor: theme.colors.primary },
                isSaving && { backgroundColor: theme.colors.surfaceHighlight }
              ]}
              onPress={onSave}
              disabled={isSaving}
            >
              <Text style={[styles.saveButtonText, { color: theme.colors.primaryForeground }]}>
                {isSaving ? 'Saving...' : 'Save Fact'}
              </Text>
            </AnimatedPressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  answerLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  saveContainer: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    borderRadius: layout.borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fontFamily.bold,
  },
  savedText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fontFamily.bold,
  },
  skipText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
  },
});
