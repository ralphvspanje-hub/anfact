import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { fetchLeaderboard, LeaderboardEntry } from '../services/leaderboard';
import { useAuth } from '../contexts/AuthContext';
import { Container } from '../components/Container';
import { useTheme, typography, spacing, layout } from '../theme';

// ──────────────────────────────────────────────
// Medal / flair config
// ──────────────────────────────────────────────

const MEDAL_COLORS = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

function getMedalIcon(position: number): string | null {
  if (position === 1) return 'trophy';
  if (position === 2) return 'medal';
  if (position === 3) return 'ribbon';
  return null;
}

function getMedalColor(position: number): string | null {
  if (position === 1) return MEDAL_COLORS.gold;
  if (position === 2) return MEDAL_COLORS.silver;
  if (position === 3) return MEDAL_COLORS.bronze;
  return null;
}

// ──────────────────────────────────────────────
// Screen
// ──────────────────────────────────────────────

export default function LeaderboardScreen() {
  const { theme, isDark } = useTheme();
  const { userId } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } catch (err) {
      setError('Failed to load leaderboard. Pull to retry.');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const isLastPlace = (index: number) =>
    entries.length > 1 && index === entries.length - 1;

  /** Loser number for positions 4th through second-to-last */
  const getLoserNumber = (index: number): number | null => {
    const position = index + 1;
    if (position <= 3) return null; // top 3 = no loser label
    if (isLastPlace(index)) return null; // last place = "stinks" instead
    return position - 3; // 4th = loser 1, 5th = loser 2, etc.
  };

  // ── Render a single row ──
  const renderItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => {
    const position = index + 1;
    const isCurrentUser = item.user_id === userId;
    const medalIcon = getMedalIcon(position);
    const medalColor = getMedalColor(position);
    const isLast = isLastPlace(index);
    const loserNumber = getLoserNumber(index);

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: isCurrentUser
              ? theme.colors.surfaceHighlight
              : theme.colors.surface,
            borderColor: medalColor
              ? medalColor
              : isCurrentUser
                ? theme.colors.primary
                : theme.colors.border,
            borderWidth: position <= 3 || isCurrentUser ? 2 : 1,
          },
        ]}
      >
        {/* Position badge */}
        <View style={isLast ? styles.badgeWrapper : undefined}>
          {isLast && (
            <>
              <Text style={styles.stinkCloud1}>💨</Text>
              <Text style={styles.stinkCloud2}>💨</Text>
              <Text style={styles.stinkCloud3}>💨</Text>
            </>
          )}
          <View
            style={[
              styles.positionBadge,
              {
                backgroundColor: medalColor
                  ? medalColor + '22'
                  : isLast
                    ? theme.colors.error + '18'
                    : theme.colors.background,
                borderColor: medalColor ?? (isLast ? theme.colors.error : theme.colors.border),
                borderWidth: medalColor || isLast ? 2 : 1,
              },
            ]}
          >
            {medalIcon ? (
              <Ionicons name={medalIcon as any} size={18} color={medalColor!} />
            ) : isLast ? (
              <Text style={styles.stinksEmoji}>💩</Text>
            ) : (
              <Text
                style={[
                  styles.positionText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {position}
              </Text>
            )}
          </View>
        </View>

        {/* User info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.userName,
                { color: theme.colors.text },
                isCurrentUser && { color: theme.colors.primary },
              ]}
              numberOfLines={1}
            >
              {item.user_name}
            </Text>
            {isCurrentUser && (
              <View
                style={[
                  styles.youBadge,
                  { backgroundColor: theme.colors.primary + '22' },
                ]}
              >
                <Text
                  style={[styles.youBadgeText, { color: theme.colors.primary }]}
                >
                  YOU
                </Text>
              </View>
            )}
            {loserNumber !== null && (
              <Text style={[styles.loserLabel, { color: theme.colors.textSecondary }]}>
                {' '}AKA loser {loserNumber}
              </Text>
            )}
            {isLast && (
              <Text style={styles.stinksLabel}> stinks</Text>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Ionicons
                name="flame-outline"
                size={13}
                color={theme.colors.warning}
              />
              <Text
                style={[styles.miniStatText, { color: theme.colors.warning }]}
              >
                {item.streak}
              </Text>
            </View>
            <View style={styles.miniStat}>
              <Ionicons
                name="checkmark-circle-outline"
                size={13}
                color={theme.colors.success}
              />
              <Text
                style={[styles.miniStatText, { color: theme.colors.success }]}
              >
                {item.retention > 0 ? `${Math.round(item.retention)}%` : '—'}
              </Text>
            </View>
            <View style={styles.miniStat}>
              <Ionicons
                name="repeat-outline"
                size={13}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.miniStatText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {item.total_reviews}
              </Text>
            </View>
          </View>
        </View>

        {/* Streak highlight on the right */}
        <View style={styles.streakBadge}>
          <Text
            style={[
              styles.streakValue,
              {
                color: medalColor ?? theme.colors.warning,
              },
            ]}
          >
            {item.streak}
          </Text>
          <Text
            style={[styles.streakLabel, { color: theme.colors.textSecondary }]}
          >
            streak
          </Text>
        </View>
      </View>
    );
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <Container>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading leaderboard...
          </Text>
        </View>
      </Container>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <Container>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={theme.colors.error}
          />
          <Text
            style={[styles.errorText, { color: theme.colors.textSecondary }]}
          >
            {error}
          </Text>
        </View>
      </Container>
    );
  }

  // ── Empty state ──
  if (entries.length === 0) {
    return (
      <Container>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.centerContainer}>
          <Ionicons
            name="podium-outline"
            size={64}
            color={theme.colors.primary}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No scores yet
          </Text>
          <Text
            style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}
          >
            Be the first to review some cards and claim the top spot!
          </Text>
        </View>
      </Container>
    );
  }

  // ── Main list ──
  return (
    <Container>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Global Nerd Rankings
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
        >
          Ranked by streak · {entries.length}{' '}
          {entries.length === 1 ? 'player' : 'players'}
        </Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.user_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    </Container>
  );
}

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  // Header
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  // List
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: layout.borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  // Position badge
  positionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.sm,
  },
  badgeWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stinksEmoji: {
    fontSize: 16,
  },
  stinkCloud1: {
    position: 'absolute',
    fontSize: 14,
    top: -2,
    right: -4,
    transform: [{ rotate: '-40deg' }],
    opacity: 0.7,
  },
  stinkCloud2: {
    position: 'absolute',
    fontSize: 12,
    top: 0,
    left: -4,
    transform: [{ rotate: '30deg' }],
    opacity: 0.5,
  },
  stinkCloud3: {
    position: 'absolute',
    fontSize: 10,
    bottom: 2,
    right: -2,
    transform: [{ rotate: '10deg' }],
    opacity: 0.4,
  },
  // User info
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
    flexShrink: 1,
  },
  youBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: layout.borderRadius.sm,
  },
  youBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  loserLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  stinksLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  // Mini stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniStatText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
  },
  // Streak badge (right side)
  streakBadge: {
    alignItems: 'center',
    minWidth: 44,
  },
  streakValue: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes.xl,
  },
  streakLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
