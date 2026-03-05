import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Container } from '../components/Container';
import { useTheme, typography, spacing } from '../theme';

export default function TermsScreen() {
  const { theme, isDark } = useTheme();
  const s = { color: theme.colors.text };
  const m = { color: theme.colors.textSecondary };

  return (
    <Container>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, s]}>Terms of Service</Text>
        <Text style={[styles.meta, m]}>Last updated: March 5, 2026</Text>

        <Text style={[styles.heading, s]}>1. Acceptance</Text>
        <Text style={[styles.body, m]}>
          By using AnFact, you agree to these terms. If you do not agree, do not use the app.
        </Text>

        <Text style={[styles.heading, s]}>2. Use of the service</Text>
        <Text style={[styles.body, m]}>
          Only for personal, non-commercial use only. No abuse of the search/AI features.
        </Text>

        <Text style={[styles.heading, s]}>3. User accounts</Text>
        <Text style={[styles.body, m]}>
          You are responsible for maintaining the security of your account. You may delete your account at any time from the Settings menu.
        </Text>

        <Text style={[styles.heading, s]}>4. Content</Text>
        <Text style={[styles.body, m]}>
          We own the content, AI-generated answers disclaimer.
        </Text>

        <Text style={[styles.heading, s]}>5. Limitation of liability</Text>
        <Text style={[styles.body, m]}>
          The service is provided as-is, no guarantees of accuracy.
        </Text>

        <Text style={[styles.heading, s]}>6. Changes to these terms</Text>
        <Text style={[styles.body, m]}>
          We may update these terms occasionally. Continued use of the app after changes constitutes acceptance of the new terms.
        </Text>

        <Text style={[styles.heading, s]}>7. Contact</Text>
        <Text style={[styles.body, m]}>
          Ralphvspanje@gmail.com
        </Text>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xxl,
    marginBottom: spacing.xs,
  },
  meta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xl,
  },
  heading: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    lineHeight: 22,
  },
});
