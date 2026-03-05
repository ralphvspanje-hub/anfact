import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Container } from '../components/Container';
import { useTheme, typography, spacing } from '../theme';

export default function PrivacyScreen() {
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
                <Text style={[styles.title, s]}>Privacy Policy</Text>
                <Text style={[styles.meta, m]}>Last updated: March 5, 2026</Text>

                <Text style={[styles.heading, s]}>1. What we collect</Text>
                <Text style={[styles.body, m]}>
                    Anfact collects personal data like email address, display name, and usage data.
                </Text>

                <Text style={[styles.heading, s]}>2. How we use it</Text>
                <Text style={[styles.body, m]}>
                    we use the data to provide the service, display leaderboard scores, and send account emails.
                </Text>

                <Text style={[styles.heading, s]}>3. Data storage</Text>
                <Text style={[styles.body, m]}>
                    Your facts and review history are stored locally on your device. Account data (email, display name) is stored securely via Supabase. We do not sell your data to third parties.
                </Text>

                <Text style={[styles.heading, s]}>4. Account deletion</Text>
                <Text style={[styles.body, m]}>
                    You can delete your account at any time from the Settings menu. This permanently removes your account credentials. Your leaderboard entry may be retained anonymously.
                </Text>

                <Text style={[styles.heading, s]}>5. Contact</Text>
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
