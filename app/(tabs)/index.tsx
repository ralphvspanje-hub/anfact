import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SearchInput from '../../components/SearchInput';
import AnswerCard from '../../components/AnswerCard';
import AtomicCardsSheet from '../../components/AtomicCardsSheet';
import NameEntryModal from '../../components/NameEntryModal';
import JokeModal from '../../components/JokeModal';
import { askLLM, generateAtomicCards } from '../../services/llm';
import { saveFact, getFactCount, MAX_SEARCHES_PER_DAY, MAX_FACTS_STORED } from '../../services/storage';
import { checkAndIncrementSearch } from '../../services/limits';
import { createDefaultCard } from '../../services/srs';
import { fetchLeaderboard, LeaderboardEntry } from '../../services/leaderboard';
import { Fact, AtomicCard } from '../../types/fact';
import { Container } from '../../components/Container';
import { useTheme, typography, spacing, layout } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useActionKey } from '../../hooks/useActionKey';

import {
  searchJokePhrases,
  examplePrompts,
  getRandomPhrase,
  pickRandomSubset,
} from '../../constants/phrases';

const CHIP_COUNT = 3;

export default function SearchScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { isLoggedIn, hasCompletedOnboarding, login, markOnboardingComplete, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Auth popup state
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [jokeModalVisible, setJokeModalVisible] = useState(false);
  // True once the name popup was shown but dismissed — blocks searching
  const [authPending, setAuthPending] = useState(false);

  // Controlled value for SearchInput (set when a chip is tapped)
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  // Top 3 leaderboard for podium strip
  const [topThree, setTopThree] = useState<LeaderboardEntry[]>([]);

  // Empty-state content
  const lastJokeIdx = useRef(-1);
  const [currentJoke, setCurrentJoke] = useState(() =>
    getRandomPhrase(searchJokePhrases, { current: -1 } as React.MutableRefObject<number>),
  );
  const [currentChips, setCurrentChips] = useState(() =>
    pickRandomSubset(examplePrompts, CHIP_COUNT),
  );

  // Show empty state when there is no answer and not loading
  const showEmptyState = !loading && !answer;

  // Pick a fresh joke + chip subset each time the tab is focused, and refresh top 3
  useFocusEffect(
    useCallback(() => {
      setCurrentJoke(getRandomPhrase(searchJokePhrases, lastJokeIdx));
      setCurrentChips(pickRandomSubset(examplePrompts, CHIP_COUNT));

      // Fetch top 3 for the podium strip (fire-and-forget)
      (async () => {
        try {
          const all = await fetchLeaderboard();
          setTopThree(all.slice(0, 3));
        } catch {
          // Silently ignore — podium just won't show
        }
      })();
    }, []),
  );

  // Atomic cards draft state
  const [draftCards, setDraftCards] = useState<{ front: string; back: string }[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  // --- Bottom search input slide animation ---
  // 0 = visible (resting), 1 = slid down off-screen
  const inputSlide = useSharedValue(0);
  const INPUT_SLIDE_DISTANCE = 120;

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inputSlide.value * INPUT_SLIDE_DISTANCE }],
    opacity: 1 - inputSlide.value,
  }));

  /** Slide the input off-screen */
  const hideInput = useCallback(() => {
    inputSlide.value = withTiming(1, { duration: 300 });
  }, [inputSlide]);

  /** Slide the input back on-screen */
  const showInput = useCallback(() => {
    inputSlide.value = withTiming(0, { duration: 300 });
  }, [inputSlide]);

  const handleSearch = async (query: string) => {
    // Block searching until the user fills in their name
    if (authPending) {
      setNameModalVisible(true);
      return;
    }

    // ── Daily search limit (server-side with local fallback) ──
    try {
      const limitResult = await checkAndIncrementSearch(userId ?? 'anonymous');
      if (!limitResult.allowed) {
        Alert.alert(
          'Daily limit reached',
          `You've used all ${MAX_SEARCHES_PER_DAY} searches for today. Come back tomorrow!`,
        );
        return;
      }
    } catch {
      // If the limit check itself fails, allow the search
      // (fail-open so testers aren't blocked by infra issues)
    }

    setQuestion(query);
    setAnswer('');
    setIsSaved(false);
    setDraftCards([]);
    setInputValue(undefined); // release controlled mode
    setLoading(true);
    hideInput(); // slide input away on submit

    try {
      const response = await askLLM(query);
      setAnswer(response);
    } catch (error) {
      setAnswer('Sorry, something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleChipPress = (prompt: string) => {
    // Block chip search too when auth is pending
    if (authPending) {
      setNameModalVisible(true);
      return;
    }
    setInputValue(prompt);
    // Small delay so the controlled value is flushed before submit
    setTimeout(() => handleSearch(prompt), 0);
  };

  const handleSave = async () => {
    if (!question || !answer) return;

    setIsSaving(true);

    try {
      // Generate atomic cards from the LLM
      const cards = await generateAtomicCards(question, answer);
      setDraftCards(cards);
      setSheetVisible(true);
    } catch (error) {
      console.error('Error generating atomic cards:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDraftCard = (index: number) => {
    setDraftCards(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setDraftCards([]);
    setSheetVisible(false);
  };

  const handleConfirmSave = async () => {
    if (draftCards.length === 0) return;

    // ── Fact storage limit ──
    const currentCount = await getFactCount();
    if (currentCount >= MAX_FACTS_STORED) {
      Alert.alert(
        'Library full',
        `You've reached the maximum of ${MAX_FACTS_STORED} saved facts. Delete some from your library to make room!`,
      );
      return;
    }

    try {
      const factId = Date.now().toString();

      const atomicCards: AtomicCard[] = draftCards.map((card, index) => ({
        id: `${factId}-ac-${index}`,
        front: card.front,
        back: card.back,
        card: createDefaultCard(),
      }));

      const fact: Fact = {
        id: factId,
        question,
        answer,
        createdAt: new Date(),
        card: createDefaultCard(), // Parent card (unused for atomic facts)
        atomicCards,
      };

      await saveFact(fact);
      setIsSaved(true);
      setSheetVisible(false);
      setDraftCards([]);

      // Trigger auth popup sequence right after card save,
      // BEFORE resetting the view — feels more natural
      if (!isLoggedIn && !hasCompletedOnboarding) {
        setNameModalVisible(true);
      } else {
        handleReset();
      }
    } catch (error) {
      console.error('Error saving fact:', error);
    }
  };

  // ── Auth popup handlers ──

  const handleNameSubmit = async (name: string) => {
    await login(name);
    setAuthPending(false);
    setNameModalVisible(false);
    setJokeModalVisible(true);
  };

  const handleNameDismiss = () => {
    // Dismissed without entering — block searching until they fill in their name
    setNameModalVisible(false);
    setAuthPending(true);
    handleReset();
  };

  const handleJokeConfirm = async () => {
    await markOnboardingComplete();
    setJokeModalVisible(false);
    handleReset();
  };

  const handleCloseSheet = () => {
    setSheetVisible(false);
  };

  /** Reset everything so the user can ask a new question */
  const handleReset = useCallback(() => {
    setAnswer('');
    setQuestion('');
    setIsSaved(false);
    setDraftCards([]);
    setInputValue('');
    showInput(); // slide the input back into view
  }, [showInput]);

  // Space / Enter / ArrowRight triggers save when an answer is ready
  useActionKey(handleSave, !!answer && !isSaved && !isSaving && !sheetVisible && !loading);

  return (
    <Container>
      <StatusBar style={isDark ? "light" : "dark"} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={{ width: '100%', flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            showEmptyState && styles.scrollContentCentered,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showEmptyState && (
            <>
              {/* Mini podium — top 3 from leaderboard */}
              {topThree.length > 0 && (
                <Pressable
                  onPress={() => router.push('/leaderboard')}
                  style={styles.podiumStrip}
                >
                  {/* Gold — #1 (top row, biggest) */}
                  {topThree[0] && (
                    <View style={styles.podiumRow}>
                      <Ionicons name="trophy" size={20} color="#FFD700" />
                      <Text
                        style={[styles.podiumNameGold, { color: theme.colors.text }]}
                        numberOfLines={1}
                      >
                        {topThree[0].user_name}
                      </Text>
                    </View>
                  )}

                  {/* Silver — #2 (smaller) */}
                  {topThree[1] && (
                    <View style={styles.podiumRow}>
                      <Ionicons name="medal" size={14} color="#C0C0C0" />
                      <Text
                        style={[styles.podiumNameSilver, { color: theme.colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {topThree[1].user_name}
                      </Text>
                    </View>
                  )}

                  {/* Bronze — #3 (even smaller) */}
                  {topThree[2] && (
                    <View style={styles.podiumRow}>
                      <Ionicons name="ribbon" size={12} color="#CD7F32" />
                      <Text
                        style={[styles.podiumNameBronze, { color: theme.colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {topThree[2].user_name}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}

              <Text style={[styles.header, { color: theme.colors.text }]}>What do you want to learn?</Text>

              {/* Eco-joke subtitle */}
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {currentJoke}
              </Text>
            </>
          )}

          {/* Example prompt chips — visible only in empty state */}
          {showEmptyState && (
            <View style={styles.chipsContainer}>
              {currentChips.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => handleChipPress(prompt)}
                  style={[
                    styles.chip,
                    { backgroundColor: isDark ? theme.colors.primary : theme.colors.surfaceHighlight },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isDark ? theme.colors.text : theme.colors.textSecondary },
                    ]}
                  >
                    {prompt}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Getting answer...</Text>
            </View>
          )}

          {!loading && answer && (
            <>
              <AnswerCard
                answer={answer}
                onSave={handleSave}
                onSkip={handleReset}
                isSaving={isSaving}
                isSaved={isSaved}
              />
            </>
          )}
        </ScrollView>

        {/* Bottom-pinned search input with slide animation.
            Unmounted while an answer is displayed so it doesn't occupy
            layout space (the white box bug). The shared inputSlide value
            survives the unmount, so showInput() still animates correctly. */}
        {!answer && (
          <Animated.View
            style={[
              styles.bottomInputContainer,
              { backgroundColor: theme.colors.background },
              inputAnimatedStyle,
            ]}
          >
            <SearchInput onSubmit={handleSearch} isLoading={loading} value={inputValue} />
          </Animated.View>
        )}
      </KeyboardAvoidingView>

      <AtomicCardsSheet
        visible={sheetVisible}
        cards={draftCards}
        onRemoveCard={handleRemoveDraftCard}
        onClearAll={handleClearAll}
        onConfirm={handleConfirmSave}
        onClose={handleCloseSheet}
      />

      {/* Auth popup sequence */}
      <NameEntryModal
        visible={nameModalVisible}
        onSubmit={handleNameSubmit}
        onDismiss={handleNameDismiss}
      />
      <JokeModal
        visible={jokeModalVisible}
        onConfirm={handleJokeConfirm}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg, // breathing room above bottom input
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 0, // let flexbox handle vertical position
  },
  podiumStrip: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: 2,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  podiumNameGold: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
  podiumNameSilver: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
  },
  podiumNameBronze: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
  },
  header: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xxl,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.borderRadius.round,
  },
  chipText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
  },
  // Bottom-pinned search input
  bottomInputContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});
