import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Rating, type Grade } from 'ts-fsrs';
import {
  getFacts,
  deleteFact,
  updateFact,
  saveReviewLog,
  getStreak,
  getReviewLogs,
} from '../../services/storage';
import {
  getDueReviewItems,
  getStudyAheadReviewItems,
  reviewCardState,
  getNextReviewTime,
  getRetention,
  createDefaultCard,
} from '../../services/srs';
import { Fact, AtomicCard, ReviewItem, ReviewLog } from '../../types/fact';
import { generateMnemonic, generateAtomicCards } from '../../services/llm';
import AtomicCardsSheet from '../../components/AtomicCardsSheet';
import MarkdownText from '../../components/MarkdownText';
import { Container } from '../../components/Container';
import { useTheme, typography, spacing, layout } from '../../theme';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { EmptyState } from '../../components/EmptyState';
import { FlipCard } from '../../components/FlipCard';
import { useFlipKey, useRateGoodKey } from '../../hooks/useActionKey';
import { useAuth } from '../../contexts/AuthContext';
import { submitScore } from '../../services/leaderboard';
import {
  emptyRecallPhrases,
  allCaughtUpPhrases,
  quizIntroPhrases,
  getRandomPhrase,
} from '../../constants/phrases';

const _lastEmptyRecallIdx = { current: -1 };
const _lastCaughtUpIdx = { current: -1 };
const _lastQuizIntroIdx = { current: -1 };

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const RATING_CONFIG: { rating: Grade; label: string; color: string; darkColor: string }[] = [
  { rating: Rating.Again, label: 'Again', color: '#c4726a', darkColor: '#c87e78' },
  { rating: Rating.Hard, label: 'Hard', color: '#ad8a47', darkColor: '#b58d50' },
  { rating: Rating.Good, label: 'Good', color: '#4d9e80', darkColor: '#4fa483' },
  { rating: Rating.Easy, label: 'Easy', color: '#5a8faa', darkColor: '#6399b4' },
];

/** Animation speeds (ms) for exit per rating */
const EXIT_DURATION: Record<string, number> = {
  Again: 350,
  Hard: 400,
  Good: 300,
  Easy: 200,
};
const ENTER_DURATION = 300;

function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return 'now';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffDays}d ${diffHours % 24}h`;
}

/** Unique key for a ReviewItem (used for queue identity) */
function reviewItemKey(item: ReviewItem): string {
  return item.atomicCard
    ? `${item.fact.id}::${item.atomicCard.id}`
    : item.fact.id;
}

export default function RecallScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { userId, userName } = useAuth();
  const [allFacts, setAllFacts] = useState<Fact[]>([]);
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ReviewItem | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasBeenFlipped, setHasBeenFlipped] = useState(false);
  const [animateFlip, setAnimateFlip] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudyAhead, setIsStudyAhead] = useState(false);

  // Mnemonic generation state
  const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);

  // Source context collapsible
  const [sourceExpanded, setSourceExpanded] = useState(false);

  // Split-this-card state (for legacy facts)
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitDraftCards, setSplitDraftCards] = useState<
    { front: string; back: string }[]
  >([]);
  const [splitSheetVisible, setSplitSheetVisible] = useState(false);

  // Session stats
  const [reviewedCount, setReviewedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [retention, setRetention] = useState(0);

  // Prevent double-rating while exit animation is running
  const [isAnimatingExit, setIsAnimatingExit] = useState(false);

  // Easter egg phrases (picked once per mount)
  const emptyRecallPhrase = useMemo(() => getRandomPhrase(emptyRecallPhrases, _lastEmptyRecallIdx), []);
  const caughtUpPhrase = useMemo(() => getRandomPhrase(allCaughtUpPhrases, _lastCaughtUpIdx), []);
  const quizIntroPhrase = useMemo(() => getRandomPhrase(quizIntroPhrases, _lastQuizIntroIdx), []);

  // --- Card transition animations (reanimated shared values) ---
  const cardTranslateX = useSharedValue(0);
  const cardTranslateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const cardContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cardTranslateX.value },
      { translateY: cardTranslateY.value },
    ],
    opacity: cardOpacity.value,
  }));

  // We use refs so handleRating closure always has latest state
  const allFactsRef = useRef(allFacts);
  allFactsRef.current = allFacts;
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const loadFacts = useCallback(async () => {
    try {
      const loadedFacts = await getFacts();
      setAllFacts(loadedFacts);

      const dueItems = getDueReviewItems(loadedFacts);
      setQueue(dueItems);

      if (dueItems.length > 0) {
        setCurrentItem(dueItems[0]);
        setIsFlipped(false);
        setHasBeenFlipped(false);
        setSourceExpanded(false);
      } else {
        setCurrentItem(null);
      }

      // Load stats
      const currentStreak = await getStreak();
      setStreak(currentStreak);
      setRetention(getRetention(loadedFacts));
      setIsStudyAhead(false);
      setReviewedCount(0);
    } catch (error) {
      console.error('Error loading facts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacts();
  }, [loadFacts]);

  // Submit score to leaderboard on screen blur (navigating away)
  useFocusEffect(
    useCallback(() => {
      // onFocus — reload facts
      loadFacts();

      // onBlur — submit score
      return () => {
        if (!userId || !userName) return;
        (async () => {
          try {
            const [currentStreak, facts, logs] = await Promise.all([
              getStreak(),
              getFacts(),
              getReviewLogs(),
            ]);
            const currentRetention = getRetention(facts);
            const totalReviews = logs.length;
            await submitScore(userId, userName, currentStreak, currentRetention, totalReviews);
          } catch (err) {
            console.error('Failed to submit leaderboard score on blur:', err);
          }
        })();
      };
    }, [loadFacts, userId, userName]),
  );

  /** Advance to the next item without animation (used internally after exit animation completes) */
  const advanceToNext = useCallback(
    (currentQueue: ReviewItem[]) => {
      // Snap rotation to front instantly so the next card never briefly shows the answer
      setAnimateFlip(false);
      setIsFlipped(false);
      setHasBeenFlipped(false);
      setSourceExpanded(false);

      if (currentQueue.length > 0) {
        setCurrentItem(currentQueue[0]);
      } else {
        setCurrentItem(null);
      }

      // Re-enable flip animation for user interactions on the next tick
      requestAnimationFrame(() => setAnimateFlip(true));
    },
    [],
  );

  // --- Flip handlers ---
  const handleFlip = useCallback(() => {
    if (isAnimatingExit) return;
    setIsFlipped((prev) => !prev);
    setHasBeenFlipped(true);
  }, [isAnimatingExit]);

  // Helper to get display text for the current item
  const getQuestionText = (): string => {
    if (!currentItem) return '';
    return currentItem.atomicCard
      ? currentItem.atomicCard.front
      : currentItem.fact.question;
  };

  const getAnswerText = (): string => {
    if (!currentItem) return '';
    return currentItem.atomicCard
      ? currentItem.atomicCard.back
      : currentItem.fact.answer;
  };

  const getTopicText = (): string | null => {
    if (!currentItem || currentItem.isLegacy) return null;
    return currentItem.fact.question; // Original user input as topic
  };

  const getMnemonic = (): string | undefined => {
    if (!currentItem) return undefined;
    return currentItem.atomicCard
      ? currentItem.atomicCard.mnemonic
      : currentItem.fact.mnemonic;
  };

  /** Run card-enter animation (slide in from right) */
  const animateEnter = useCallback(() => {
    cardTranslateX.value = 300;
    cardTranslateY.value = 0;
    cardOpacity.value = 0;
    cardTranslateX.value = withTiming(0, {
      duration: ENTER_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    cardOpacity.value = withTiming(1, {
      duration: ENTER_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  /** Play exit animation for a given rating label, then call onDone on the JS thread */
  const animateExit = useCallback(
    (ratingLabel: string, onDone: () => void) => {
      const duration = EXIT_DURATION[ratingLabel] ?? 300;
      const safeOnDone = () => {
        'worklet';
        runOnJS(onDone)();
      };

      if (ratingLabel === 'Again') {
        // Drop down + fade out
        cardTranslateY.value = withTiming(200, {
          duration,
          easing: Easing.in(Easing.cubic),
        });
        cardOpacity.value = withTiming(0, { duration }, safeOnDone);
      } else {
        // Slide left (speed varies)
        cardTranslateX.value = withTiming(-400, {
          duration,
          easing: Easing.in(Easing.cubic),
        });
        cardOpacity.value = withTiming(0, { duration }, safeOnDone);
      }
    },
    [],
  );

  // ---- Rating handler ----
  const handleRating = useCallback(
    async (rating: Grade) => {
      if (!currentItem || isAnimatingExit) return;

      // Find the label for the exit animation
      const ratingLabel =
        RATING_CONFIG.find((r) => r.rating === rating)?.label ?? 'Good';

      setIsAnimatingExit(true);

      try {
        const cardToReview = currentItem.atomicCard
          ? currentItem.atomicCard.card
          : currentItem.fact.card;

        // Run FSRS scheduling
        const result = reviewCardState(cardToReview, rating);

        // Build updated fact
        let updatedFact: Fact;
        if (currentItem.atomicCard) {
          const updatedAtomicCards = currentItem.fact.atomicCards!.map((ac) =>
            ac.id === currentItem.atomicCard!.id
              ? { ...ac, card: result.card }
              : ac,
          );
          updatedFact = {
            ...currentItem.fact,
            atomicCards: updatedAtomicCards,
          };
        } else {
          updatedFact = { ...currentItem.fact, card: result.card };
        }
        await updateFact(updatedFact);

        // Save review log
        const reviewLog: ReviewLog = {
          factId: currentItem.fact.id,
          atomicCardId: currentItem.atomicCard?.id,
          rating,
          reviewedAt: new Date(),
        };
        await saveReviewLog(reviewLog);

        // Update stats
        setReviewedCount((prev) => prev + 1);
        const currentStreak = await getStreak();
        setStreak(currentStreak);

        // Update allFacts with the new state
        const newAllFacts = allFactsRef.current.map((f) =>
          f.id === currentItem.fact.id ? updatedFact : f,
        );
        setAllFacts(newAllFacts);
        setRetention(getRetention(newAllFacts));

        // Build updated current item for possible re-insertion
        const updatedItem: ReviewItem = currentItem.atomicCard
          ? {
            ...currentItem,
            fact: updatedFact,
            atomicCard: updatedFact.atomicCards!.find(
              (ac) => ac.id === currentItem.atomicCard!.id,
            )!,
          }
          : { ...currentItem, fact: updatedFact };

        // Remove current from queue
        const currentKey = reviewItemKey(currentItem);
        const remainingQueue = queueRef.current.filter(
          (item) => reviewItemKey(item) !== currentKey,
        );

        let newQueue: ReviewItem[];
        if (
          rating === Rating.Again &&
          new Date(result.card.due) <= new Date()
        ) {
          // Re-add to end of queue for intra-session re-learning
          newQueue = [...remainingQueue, updatedItem];
        } else {
          // Don't dynamically add newly-due items mid-session — it causes
          // the remaining count to stay flat (remove 1 + add 1 = no change).
          // Cards that become due during the session will be picked up on
          // the next screen focus / refresh.
          newQueue = [...remainingQueue];
        }

        // Update queue immediately so remaining count reflects the change
        setQueue(newQueue);

        // Animate exit, then advance
        animateExit(ratingLabel, () => {
          advanceToNext(newQueue);
          setIsAnimatingExit(false);
          if (newQueue.length > 0) {
            animateEnter();
          }
        });
      } catch (error) {
        console.error('Error processing rating:', error);
        setIsAnimatingExit(false);
      }
    },
    [currentItem, isAnimatingExit, animateExit, advanceToNext, animateEnter],
  );

  const handleStudyAhead = () => {
    const aheadItems = getStudyAheadReviewItems(allFacts);
    if (aheadItems.length > 0) {
      // Reset card animation position so the card is visible
      cardTranslateX.value = 0;
      cardTranslateY.value = 0;
      cardOpacity.value = 1;

      setIsStudyAhead(true);
      setQueue(aheadItems);
      setCurrentItem(aheadItems[0]);
      setIsFlipped(false);
      setHasBeenFlipped(false);
      setSourceExpanded(false);
    }
  };

  const handleDelete = async () => {
    if (!currentItem) return;

    try {
      const currentKey = reviewItemKey(currentItem);

      if (currentItem.atomicCard && currentItem.fact.atomicCards) {
        // Deleting a single atomic card — remove it from the parent fact
        const remainingCards = currentItem.fact.atomicCards.filter(
          (ac) => ac.id !== currentItem.atomicCard!.id,
        );

        if (remainingCards.length === 0) {
          // Last atomic card — delete the entire parent fact
          await deleteFact(currentItem.fact.id);
          const newAllFacts = allFacts.filter(
            (f) => f.id !== currentItem.fact.id,
          );
          setAllFacts(newAllFacts);

          const newQueue = queue.filter(
            (item) => item.fact.id !== currentItem.fact.id,
          );
          setQueue(newQueue);
          advanceToNext(newQueue);
        } else {
          // Other atomic cards remain — update the parent fact
          const updatedFact: Fact = {
            ...currentItem.fact,
            atomicCards: remainingCards,
          };
          await updateFact(updatedFact);

          const newAllFacts = allFacts.map((f) =>
            f.id === currentItem.fact.id ? updatedFact : f,
          );
          setAllFacts(newAllFacts);

          // Remove only this atomic card from the queue
          const newQueue = queue.filter(
            (item) => reviewItemKey(item) !== currentKey,
          );
          setQueue(newQueue);
          advanceToNext(newQueue);
        }
      } else {
        // Legacy fact (no atomic cards) — delete the whole fact
        await deleteFact(currentItem.fact.id);
        const newAllFacts = allFacts.filter(
          (f) => f.id !== currentItem.fact.id,
        );
        setAllFacts(newAllFacts);

        const newQueue = queue.filter(
          (item) => item.fact.id !== currentItem.fact.id,
        );
        setQueue(newQueue);
        advanceToNext(newQueue);
      }
    } catch (error) {
      console.error('Error deleting fact:', error);
    }
  };

  // --- On-demand mnemonic generation ---
  const handleGenerateMnemonic = async () => {
    if (!currentItem) return;

    setIsGeneratingMnemonic(true);
    try {
      const front = currentItem.atomicCard
        ? currentItem.atomicCard.front
        : currentItem.fact.question;
      const back = currentItem.atomicCard
        ? currentItem.atomicCard.back
        : currentItem.fact.answer;
      const mnemonic = await generateMnemonic(front, back);

      if (mnemonic) {
        let updatedFact: Fact;
        if (currentItem.atomicCard) {
          const updatedAtomicCards = currentItem.fact.atomicCards!.map((ac) =>
            ac.id === currentItem.atomicCard!.id ? { ...ac, mnemonic } : ac,
          );
          updatedFact = {
            ...currentItem.fact,
            atomicCards: updatedAtomicCards,
          };
        } else {
          updatedFact = { ...currentItem.fact, mnemonic };
        }
        await updateFact(updatedFact);

        // Update local state
        const newAllFacts = allFacts.map((f) =>
          f.id === currentItem.fact.id ? updatedFact : f,
        );
        setAllFacts(newAllFacts);

        // Update current item in place
        if (currentItem.atomicCard) {
          const updatedAc = updatedFact.atomicCards!.find(
            (ac) => ac.id === currentItem.atomicCard!.id,
          )!;
          setCurrentItem({
            ...currentItem,
            fact: updatedFact,
            atomicCard: updatedAc,
          });
        } else {
          setCurrentItem({ ...currentItem, fact: updatedFact });
        }

        // Update the queue as well
        setQueue((prev) =>
          prev.map((item) => {
            if (item.fact.id !== currentItem.fact.id) return item;
            if (
              item.atomicCard &&
              currentItem.atomicCard &&
              item.atomicCard.id === currentItem.atomicCard.id
            ) {
              const updatedAc = updatedFact.atomicCards!.find(
                (ac) => ac.id === item.atomicCard!.id,
              )!;
              return { ...item, fact: updatedFact, atomicCard: updatedAc };
            }
            if (!item.atomicCard && !currentItem.atomicCard) {
              return { ...item, fact: updatedFact };
            }
            return { ...item, fact: updatedFact };
          }),
        );
      }
    } catch (error) {
      console.error('Error generating mnemonic:', error);
    } finally {
      setIsGeneratingMnemonic(false);
    }
  };

  // --- Split this card (legacy facts) ---
  const handleSplitCard = async () => {
    if (!currentItem || !currentItem.isLegacy) return;

    setIsSplitting(true);
    try {
      const cards = await generateAtomicCards(
        currentItem.fact.question,
        currentItem.fact.answer,
      );
      setSplitDraftCards(cards);
      setSplitSheetVisible(true);
    } catch (error) {
      console.error('Error splitting card:', error);
    } finally {
      setIsSplitting(false);
    }
  };

  const handleSplitRemoveCard = (index: number) => {
    setSplitDraftCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSplitClearAll = () => {
    setSplitDraftCards([]);
    setSplitSheetVisible(false);
  };

  const handleSplitConfirm = async () => {
    if (!currentItem || splitDraftCards.length === 0) return;

    try {
      const factId = currentItem.fact.id;
      const atomicCards: AtomicCard[] = splitDraftCards.map((card, index) => ({
        id: `${factId}-ac-${index}`,
        front: card.front,
        back: card.back,
        card: createDefaultCard(),
      }));

      const updatedFact: Fact = {
        ...currentItem.fact,
        atomicCards,
      };

      await updateFact(updatedFact);

      // Update local state
      const newAllFacts = allFacts.map((f) =>
        f.id === factId ? updatedFact : f,
      );
      setAllFacts(newAllFacts);

      // Remove the legacy item from queue and add the new atomic items
      const currentKey = reviewItemKey(currentItem);
      const remainingQueue = queue.filter(
        (item) => reviewItemKey(item) !== currentKey,
      );
      const newDueItems = getDueReviewItems(newAllFacts).filter(
        (item) => item.fact.id === factId,
      );
      const newQueue = [...newDueItems, ...remainingQueue];
      setQueue(newQueue);
      advanceToNext(newQueue);

      setSplitSheetVisible(false);
      setSplitDraftCards([]);
    } catch (error) {
      console.error('Error confirming split:', error);
    }
  };

  const handleSplitClose = () => {
    setSplitSheetVisible(false);
  };

  const nextReviewTime = getNextReviewTime(allFacts);
  const remainingCount = queue.length;
  const currentMnemonic = getMnemonic();

  // Navigate to leaderboard
  const handleOpenLeaderboard = () => {
    router.push('/leaderboard');
  };

  // ---- Keyboard shortcuts ----
  // Space / Enter → toggle flip
  const handleFlipKey = useCallback(() => {
    if (!currentItem || isAnimatingExit) return;
    handleFlip();
  }, [currentItem, isAnimatingExit, handleFlip]);

  useFlipKey(
    handleFlipKey,
    !!currentItem && !splitSheetVisible && !isGeneratingMnemonic && !isSplitting && !isAnimatingExit,
  );

  // ArrowRight → rate Good (only when card has been flipped at least once)
  const handleRateGoodKey = useCallback(() => {
    if (!currentItem || !hasBeenFlipped || isAnimatingExit) return;
    handleRating(Rating.Good);
  }, [currentItem, hasBeenFlipped, isAnimatingExit, handleRating]);

  useRateGoodKey(
    handleRateGoodKey,
    !!currentItem &&
    hasBeenFlipped &&
    !splitSheetVisible &&
    !isGeneratingMnemonic &&
    !isSplitting &&
    !isAnimatingExit,
  );

  // ---- Render helpers ----
  const renderFrontFace = () => (
    <View style={styles.faceInner}>
      {getTopicText() && (
        <Text
          style={[styles.topicText, { color: theme.colors.textSecondary }]}
        >
          {getTopicText()}
        </Text>
      )}
      <Text style={[styles.questionText, { color: theme.colors.text }]}>
        {getQuestionText()}
      </Text>
      <Text
        style={[styles.flipHint, { color: theme.colors.textSecondary }]}
      >
        Tap to reveal
      </Text>
    </View>
  );

  const renderBackFace = () => (
    <View style={styles.backFaceLayout}>
      {/* Centered answer area — matches question vertical position */}
      <View style={styles.backFaceCenter}>
        <Text
          style={[styles.answerLabel, { color: theme.colors.textSecondary }]}
        >
          ANSWER
        </Text>
        <View style={styles.answerContent}>
          <MarkdownText
            text={getAnswerText()}
            style={{
              fontSize: typography.sizes.lg,
              fontFamily: typography.fontFamily.bold,
              color: theme.colors.text,
              textAlign: 'center',
            }}
          />
        </View>
      </View>

      {/* Bottom area — mnemonic, source context, split button */}
      <View style={styles.backFaceBottom}>
        {/* Mnemonic */}
        {currentMnemonic ? (
          <Text
            style={[
              styles.mnemonicText,
              { color: theme.colors.textSecondary },
            ]}
          >
            💡 {currentMnemonic}
          </Text>
        ) : (
          <View
            onTouchEnd={(e) => e.stopPropagation()}
            {...(Platform.OS === 'web' ? { onMouseDown: (e: any) => e.stopPropagation() } : {})}
          >
          <TouchableOpacity
            style={[
              styles.mnemonicButton,
              { borderColor: theme.colors.border },
            ]}
            onPress={handleGenerateMnemonic}
            disabled={isGeneratingMnemonic}
          >
            {isGeneratingMnemonic ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="bulb-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.mnemonicButtonText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Generate Mnemonic
                </Text>
              </>
            )}
          </TouchableOpacity>
          </View>
        )}

        {/* Source context collapsible for atomic cards */}
        {!currentItem?.isLegacy && currentItem?.atomicCard && (
          <View style={styles.sourceContextContainer}>
            <View
              onTouchEnd={(e) => e.stopPropagation()}
              {...(Platform.OS === 'web' ? { onMouseDown: (e: any) => e.stopPropagation() } : {})}
            >
            <TouchableOpacity
              style={styles.sourceContextToggle}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setSourceExpanded(!sourceExpanded);
              }}
            >
              <Text
                style={[
                  styles.sourceContextLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Source Context
              </Text>
              <Ionicons
                name={sourceExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            </View>
            {sourceExpanded && (
              <ScrollView
                style={[
                  styles.sourceContextContent,
                  { borderTopColor: theme.colors.border },
                ]}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                <MarkdownText
                  text={currentItem.fact.answer}
                  style={{
                    fontSize: typography.sizes.sm,
                    color: theme.colors.textSecondary,
                  }}
                />
              </ScrollView>
            )}
          </View>
        )}

        {/* Split-this-card for legacy facts */}
        {currentItem?.isLegacy && (
          <View
            onTouchEnd={(e) => e.stopPropagation()}
            {...(Platform.OS === 'web' ? { onMouseDown: (e: any) => e.stopPropagation() } : {})}
          >
          <AnimatedPressable
            style={[styles.splitButton, { borderColor: theme.colors.border }]}
            onPress={handleSplitCard}
            disabled={isSplitting}
          >
            {isSplitting ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="git-branch-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.splitButtonText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Split this card
                </Text>
              </>
            )}
          </AnimatedPressable>
          </View>
        )}
      </View>
    </View>
  );

  /** Reusable stats bar content for the active session */
  const renderActiveStatsBar = () => (
    <Pressable onPress={handleOpenLeaderboard}>
      <View
        style={[
          styles.statsBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              { color: theme.colors.primary },
            ]}
          >
            {reviewedCount}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Reviewed
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />
        <View style={styles.statItem}>
          <Text
            style={[styles.statValue, { color: theme.colors.text }]}
          >
            {remainingCount}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Remaining
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              { color: theme.colors.warning },
            ]}
          >
            {streak}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Streak
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              { color: theme.colors.success },
            ]}
          >
            {retention > 0 ? `${retention}%` : '—'}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Retention
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />
        <View style={styles.leaderboardLink}>
          <Ionicons
            name="trophy"
            size={20}
            color={theme.colors.warning}
          />
          <Text style={[styles.leaderboardLinkText, { color: theme.colors.textSecondary }]}>
            Board
          </Text>
        </View>
      </View>
    </Pressable>
  );

  /** Reusable stats bar content for the caught-up state */
  const renderCaughtUpStatsBar = () => (
    <Pressable onPress={handleOpenLeaderboard}>
      <View
        style={[
          styles.statsBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              { color: theme.colors.primary },
            ]}
          >
            {reviewedCount}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Reviewed
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              { color: theme.colors.warning },
            ]}
          >
            {streak}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Streak
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              { color: theme.colors.success },
            ]}
          >
            {retention > 0 ? `${retention}%` : '—'}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Retention
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />
        <View style={styles.leaderboardLink}>
          <Ionicons
            name="trophy"
            size={20}
            color={theme.colors.warning}
          />
          <Text style={[styles.leaderboardLinkText, { color: theme.colors.textSecondary }]}>
            Board
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <Container>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Loading...
          </Text>
        </View>
      ) : allFacts.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title={emptyRecallPhrase.title}
          message={emptyRecallPhrase.message}
        />
      ) : currentItem ? (
        <View style={styles.activeCardContainer}>
          {/* Stats bar — tap to open leaderboard */}
          {renderActiveStatsBar()}

          {/* Sarcastic quiz intro subtitle */}
          <Text style={[styles.quizIntroSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {quizIntroPhrase}
          </Text>

          {/* Flip card with exit/enter animation wrapper — fills remaining space but leaves room for buttons */}
          <Animated.View style={[{ flex: 1, marginBottom: spacing.sm }, cardContainerStyle]}>
            <FlipCard
              front={renderFrontFace()}
              back={renderBackFace()}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              animateFlip={animateFlip}
              cardBackgroundColor={theme.colors.surface}
              cardBorderColor={theme.colors.border}
              flexHeight
              overlay={
                isStudyAhead ? (
                  <View
                    style={[
                      styles.studyAheadOverlay,
                      { backgroundColor: theme.colors.info + '18' },
                    ]}
                  >
                    <Ionicons
                      name="rocket-outline"
                      size={14}
                      color={theme.colors.info}
                    />
                    <Text
                      style={[
                        styles.studyAheadOverlayText,
                        { color: theme.colors.info },
                      ]}
                    >
                      OK Nerd
                    </Text>
                  </View>
                ) : undefined
              }
            />
          </Animated.View>

          {/* Rating buttons — always rendered to reserve space, invisible until flipped */}
          <View style={[styles.ratingRow, { opacity: hasBeenFlipped ? 1 : 0 }]} pointerEvents={hasBeenFlipped ? 'auto' : 'none'}>
            {RATING_CONFIG.map(({ rating, label, color, darkColor }) => (
              <AnimatedPressable
                key={label}
                style={[
                  styles.ratingButton,
                  {
                    backgroundColor: isDark ? darkColor : color,
                  },
                ]}
                onPress={() => handleRating(rating)}
                disabled={isAnimatingExit}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    { color: '#ffffff' },
                  ]}
                >
                  {label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          {/* Delete button */}
          <AnimatedPressable
            style={[styles.deleteButton, { backgroundColor: 'transparent' }]}
            onPress={handleDelete}
          >
            <Text
              style={[
                styles.deleteButtonText,
                { color: theme.colors.error },
              ]}
            >
              {currentItem?.atomicCard ? 'Delete Card' : 'Delete Fact'}
            </Text>
          </AnimatedPressable>
        </View>
      ) : (
        /* All caught up state */
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={[
            styles.scrollContent,
            styles.caughtUpContainer,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats bar even when caught up — tap to open leaderboard */}
          {reviewedCount > 0 && renderCaughtUpStatsBar()}

          <View style={styles.caughtUpContent}>
            <Ionicons
              name="checkmark-circle-outline"
              size={72}
              color={theme.colors.primary}
              style={{ marginBottom: spacing.lg }}
            />
            <Text
              style={[styles.caughtUpTitle, { color: theme.colors.text }]}
            >
              {caughtUpPhrase.title}
            </Text>
            <Text
              style={[
                styles.caughtUpSubtext,
                { color: theme.colors.textSecondary, marginBottom: spacing.sm },
              ]}
            >
              {caughtUpPhrase.subtitle}
            </Text>
            {nextReviewTime && (
              <Text
                style={[
                  styles.caughtUpSubtext,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Next review in {formatTimeUntil(nextReviewTime)}
              </Text>
            )}
          </View>

          {getStudyAheadReviewItems(allFacts).length > 0 && (
            <AnimatedPressable
              style={[
                styles.studyAheadButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={handleStudyAhead}
            >
              <Ionicons
                name="rocket-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.studyAheadButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                Study Ahead
              </Text>
            </AnimatedPressable>
          )}

          <Text
            style={[
              styles.factCount,
              { color: theme.colors.textSecondary },
            ]}
          >
            {allFacts.length} {allFacts.length === 1 ? 'fact' : 'facts'} in
            your library
          </Text>
        </ScrollView>
      )}

      {/* Split card sheet */}
      <AtomicCardsSheet
        visible={splitSheetVisible}
        cards={splitDraftCards}
        onRemoveCard={handleSplitRemoveCard}
        onClearAll={handleSplitClearAll}
        onConfirm={handleSplitConfirm}
        onClose={handleSplitClose}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
  },
  activeCardContainer: {
    flex: 1,
    width: '100%',
    paddingTop: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
  },
  quizIntroSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    opacity: 0.7,
  },
  // Stats bar
  statsBar: {
    flexDirection: 'row',
    borderRadius: layout.borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 2,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  leaderboardLink: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  leaderboardLinkText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    marginTop: 2,
  },
  // Study ahead overlay (inside FlipCard)
  studyAheadOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: layout.borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  studyAheadOverlayText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xs,
  },
  // Face inner content
  faceInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Back face uses flex layout: centered answer + bottom controls
  backFaceLayout: {
    flex: 1,
    width: '100%',
  },
  backFaceCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backFaceBottom: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  topicText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  questionText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    textAlign: 'center',
  },
  flipHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    marginTop: spacing.lg,
    opacity: 0.6,
  },
  // Answer section (back face)
  answerLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  answerContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mnemonicText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: spacing.md,
  },
  mnemonicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 2,
    gap: spacing.xs,
  },
  mnemonicButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.sm,
  },
  // Source context (collapsible)
  sourceContextContainer: {
    marginTop: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  sourceContextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  sourceContextLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceContextContent: {
    borderTopWidth: 2,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    maxHeight: 150,
  },
  // Split button (inside back face)
  splitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.borderRadius.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    marginTop: spacing.md,
    gap: spacing.sm,
    minHeight: 40,
    width: '100%',
  },
  splitButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingButton: {
    flex: 1,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  ratingButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
  // Delete button
  deleteButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
  // Caught up state
  caughtUpContainer: {
    justifyContent: 'center',
  },
  caughtUpContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  caughtUpTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xxl,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  caughtUpSubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  studyAheadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    gap: spacing.sm,
  },
  studyAheadButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
  factCount: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
});
