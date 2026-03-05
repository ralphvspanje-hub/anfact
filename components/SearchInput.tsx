import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme, typography, rawSizes, spacing, layout } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

interface SearchInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  /** When provided, overrides the internal text state (controlled mode). */
  value?: string;
}

export default function SearchInput({ onSubmit, isLoading = false, value }: SearchInputProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');

  // Sync internal state when parent pushes a new controlled value
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  const handleSubmit = () => {
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          }
        ]}
        placeholder="Ask anything..."
        placeholderTextColor={theme.colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        blurOnSubmit={true}
        editable={!isLoading}
        multiline={true}
        autoCorrect={true}
        autoFocus={false}
        secureTextEntry={false}
        selectTextOnFocus={false}
      />
      <AnimatedPressable
        style={[
          styles.button,
          { backgroundColor: theme.colors.primary },
          (isLoading || !query.trim()) && { backgroundColor: theme.colors.surfaceHighlight, opacity: 0.7 }
        ]}
        onPress={handleSubmit}
        disabled={isLoading || !query.trim()}
      >
        <Text style={[
            styles.buttonText, 
            { color: theme.colors.primaryForeground },
            (isLoading || !query.trim()) && { color: theme.colors.textSecondary }
        ]}>Ask</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderRadius: layout.borderRadius.md,
    padding: spacing.md,
    fontSize: rawSizes.md,
    fontFamily: typography.fontFamily.regular,
    minHeight: 48,
    maxHeight: 120,
  },
  button: {
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  buttonText: {
    fontSize: rawSizes.md,
    fontFamily: typography.fontFamily.bold,
  },
});
