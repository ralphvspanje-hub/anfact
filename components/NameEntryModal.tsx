import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme, typography, spacing, layout } from '../theme';

interface NameEntryModalProps {
  visible: boolean;
  onSubmit: (name: string) => void;
  onDismiss: () => void;
}

export default function NameEntryModal({ visible, onSubmit, onDismiss }: NameEntryModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const isValid = trimmed.length >= 2 && trimmed.length <= 30;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(trimmed);
    setName('');
  };

  const handleDismiss = () => {
    setName('');
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      {/* Backdrop — tapping dismisses */}
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centerer}
        >
          {/* Card — stop propagation so tapping inside doesn't dismiss */}
          <Pressable
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => {}}  // swallow press
          >
            <Text style={[styles.title, { color: theme.colors.text }]}>
              What's your name?
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Your facts are stored locally on this device.{'\n'}(no Jeffrey Epstein please)
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Your name"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={30}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: isValid ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: isValid
                      ? theme.colors.primaryForeground
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  centerer: {
    flex: 1,
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
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  button: {
    width: '100%',
    paddingVertical: spacing.sm + 4,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
});
