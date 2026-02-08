import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { getFacts, deleteFact, deleteAtomicCard } from '../../services/storage';
import { Fact } from '../../types/fact';
import FactCard from '../../components/FactCard';
import { Container } from '../../components/Container';
import { useTheme, typography, spacing } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { emptyLibraryPhrases, getRandomPhrase } from '../../constants/phrases';

const _lastLibraryEmptyIdx = { current: -1 };

export default function LibraryScreen() {
  const { theme, isDark } = useTheme();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const emptyPhrase = useMemo(() => getRandomPhrase(emptyLibraryPhrases, _lastLibraryEmptyIdx), []);

  const loadFacts = async () => {
    try {
      const loadedFacts = await getFacts();
      setFacts(loadedFacts);
    } catch (error) {
      console.error('Error loading facts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFacts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadFacts();
    }, [])
  );

  const handleDeleteFact = async (factId: string) => {
    try {
      await deleteFact(factId);
      await loadFacts();
    } catch (error) {
      console.error('Error deleting fact:', error);
    }
  };

  const handleDeleteAtomicCard = async (factId: string, atomicCardId: string) => {
    try {
      await deleteAtomicCard(factId, atomicCardId);
      await loadFacts();
    } catch (error) {
      console.error('Error deleting atomic card:', error);
    }
  };

  // Count total reviewable cards (atomic cards + legacy facts)
  const totalCards = facts.reduce((sum, f) => {
    return sum + (f.atomicCards && f.atomicCards.length > 0 ? f.atomicCards.length : 1);
  }, 0);

  return (
    <Container>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerText, { color: theme.colors.text }]}>Your Fact Library</Text>
        <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
          {facts.length} {facts.length === 1 ? 'fact' : 'facts'} saved · {totalCards} {totalCards === 1 ? 'card' : 'cards'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading...</Text>
        </View>
      ) : facts.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title={emptyPhrase.title}
          message={emptyPhrase.message}
        />
      ) : (
        <FlatList
          style={{ width: '100%' }}
          data={facts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FactCard
              fact={item}
              onDelete={() => handleDeleteFact(item.id)}
              onDeleteAtomicCard={(atomicCardId) => handleDeleteAtomicCard(item.id, atomicCardId)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    width: '100%',
    borderBottomWidth: 2,
  },
  headerText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  countText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
});
