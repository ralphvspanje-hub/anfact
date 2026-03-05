import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, spacing, layout } from '../theme';

type Mode = 'register' | 'login' | 'pending_confirmation' | 'forgot_password' | 'reset_sent';

interface EmailAuthModalProps {
  visible: boolean;
  onRegister: (email: string, password: string) => Promise<'success' | 'pending_confirmation'>;
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  onDismiss: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

export default function EmailAuthModal({
  visible,
  onRegister,
  onLogin,
  onForgotPassword,
  onDismiss,
}: EmailAuthModalProps) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setEmail('');
      setPassword('');
      setError('');
      setLoading(false);
      setMode('register');
    }
  }, [visible]);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= MIN_PASSWORD;
  const formValid = mode === 'forgot_password' ? emailValid : (emailValid && passwordValid);

  const handleSubmit = async () => {
    if (!formValid || loading) return;

    setError('');

    if (!emailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!passwordValid) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'forgot_password') {
        await onForgotPassword?.(email.trim());
        setMode('reset_sent');
      } else if (mode === 'register') {
        const result = await onRegister(email.trim(), password);
        if (result === 'pending_confirmation') {
          setMode('pending_confirmation');
        }
      } else {
        await onLogin(email.trim(), password);
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Er ging iets mis. Probeer het opnieuw.';
      setError(translateError(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (loading) return;
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centerer}
        >
          <Pressable
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => {}}
          >
            {mode === 'pending_confirmation' || mode === 'reset_sent' ? (
              <>
                <Ionicons
                  name="mail-outline"
                  size={48}
                  color={theme.colors.primary}
                  style={{ marginBottom: spacing.md }}
                />
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  Check your email
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  {mode === 'pending_confirmation'
                    ? 'We sent a confirmation link to your email address. Click the link to activate your account, then come back here.'
                    : 'We sent a password reset link to your email. Follow the link to set a new password, then come back and log in.'}
                </Text>
                <Pressable
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                  onPress={mode === 'reset_sent' ? () => { setMode('login'); setError(''); } : handleDismiss}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.primaryForeground }]}>
                    {mode === 'reset_sent' ? 'Back to log in' : 'Got it'}
                  </Text>
                </Pressable>
                {mode === 'pending_confirmation' && (
                  <Pressable
                    onPress={() => { setMode('login'); setError(''); }}
                    style={styles.toggleLink}
                  >
                    <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
                      Already have an account? Try logging in instead, nerd
                    </Text>
                  </Pressable>
                )}
              </>
            ) : mode === 'forgot_password' ? (
              <>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  Reset password
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Enter your email and we'll send you a link to reset your password.
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
                  placeholder="Email address"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />

                {!!error && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                )}

                <Pressable
                  style={[
                    styles.button,
                    {
                      backgroundColor: formValid && !loading
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={!formValid || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          color: formValid
                            ? theme.colors.primaryForeground
                            : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      Send reset link
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => { setMode('login'); setError(''); }}
                  disabled={loading}
                  style={styles.toggleLink}
                >
                  <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
                    Back to log in
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {mode === 'register' ? 'Create account' : 'Log in'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  {mode === 'register'
                    ? 'Create an account to save your progress.'
                    : 'Log in to pick up where you left off.'}
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
                  placeholder="Email address"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                  editable={!loading}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />

                {mode === 'login' && (
                  <Pressable
                    onPress={() => { setMode('forgot_password'); setError(''); }}
                    disabled={loading}
                    style={styles.forgotLink}
                  >
                    <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
                      Forgot password?
                    </Text>
                  </Pressable>
                )}

                {!!error && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                )}

                <Pressable
                  style={[
                    styles.button,
                    {
                      backgroundColor: formValid && !loading
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={!formValid || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          color: formValid
                            ? theme.colors.primaryForeground
                            : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {mode === 'register' ? 'Register' : 'Log in'}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}
                  disabled={loading}
                  style={styles.toggleLink}
                >
                  <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
                    {mode === 'register'
                      ? 'Already have an account? Log in'
                      : "Don't have an account? Register"}
                  </Text>
                </Pressable>

                {mode === 'register' && (
                  <Text style={[styles.legalText, { color: theme.colors.textSecondary }]}>
                    By registering you agree to our{' '}
                    <Text
                      style={{ color: theme.colors.primary }}
                      onPress={() => Linking.openURL('https://anfact.app/terms')}
                    >
                      Terms
                    </Text>
                    {' & '}
                    <Text
                      style={{ color: theme.colors.primary }}
                      onPress={() => Linking.openURL('https://anfact.app/privacy')}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                )}
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function translateError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (lower.includes('user already registered') || lower.includes('already been registered')) return 'This email is already in use.';
  if (lower.includes('email not confirmed')) return 'Please confirm your email first (check your inbox).';
  if (lower.includes('password')) return 'Password must be at least 6 characters.';
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  return msg;
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
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    width: '100%',
    paddingVertical: spacing.sm + 4,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
    paddingVertical: spacing.xs,
  },
  toggleLink: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
  },
  legalText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});
