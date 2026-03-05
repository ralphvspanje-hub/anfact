import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEmptyCard } from 'ts-fsrs';
import { Fact, AtomicCard, ReviewLog } from '../types/fact';
import { getSupabase } from './supabase';

const FACTS_STORAGE_KEY = 'facts';
const REVIEW_LOGS_KEY = 'review_logs';
const DAILY_SEARCHES_KEY = 'daily_searches';

// ──────────────────────────────────────────────
// Usage limits
// ──────────────────────────────────────────────
export const MAX_SEARCHES_PER_DAY = 100;
export const MAX_FACTS_STORED = 100;

// ──────────────────────────────────────────────
// Cloud sync helpers
// ──────────────────────────────────────────────

async function getLoggedInUserId(): Promise<string | null> {
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

function factToRow(fact: Fact, userId: string) {
  return {
    id: fact.id,
    user_id: userId,
    question: fact.question,
    answer: fact.answer,
    mnemonic: fact.mnemonic ?? null,
    created_at: fact.createdAt instanceof Date ? fact.createdAt.toISOString() : fact.createdAt,
    card: fact.card,
    atomic_cards: fact.atomicCards ?? null,
  };
}

function rowToFact(row: any): Fact {
  return hydrateFact({
    id: row.id,
    question: row.question,
    answer: row.answer,
    mnemonic: row.mnemonic,
    createdAt: row.created_at,
    card: row.card,
    atomicCards: row.atomic_cards,
  });
}

async function upsertFactToCloud(fact: Fact, userId: string): Promise<void> {
  try {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('facts').upsert(factToRow(fact, userId), { onConflict: 'id' });
  } catch (err) {
    console.warn('Cloud upsert failed (best-effort):', err);
  }
}

async function deleteFactFromCloud(factId: string): Promise<void> {
  try {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('facts').delete().eq('id', factId);
  } catch (err) {
    console.warn('Cloud delete failed (best-effort):', err);
  }
}

/**
 * Hydrate a single FSRS Card object from JSON (dates as Date objects)
 */
function hydrateCard(card: any) {
  return {
    ...card,
    due: new Date(card.due),
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };
}

/**
 * Parse a raw fact from JSON, hydrating dates and ensuring FSRS card exists (migration)
 */
function hydrateFact(f: any): Fact {
  const fact: Fact = {
    ...f,
    createdAt: new Date(f.createdAt),
    card: f.card ? hydrateCard(f.card) : createEmptyCard(),
  };

  // Hydrate atomic cards if present
  if (f.atomicCards && Array.isArray(f.atomicCards)) {
    fact.atomicCards = f.atomicCards.map((ac: any) => ({
      ...ac,
      card: ac.card ? hydrateCard(ac.card) : createEmptyCard(),
    }));
  }

  return fact;
}

/**
 * Save a fact to local storage (and cloud for logged-in users)
 */
export async function saveFact(fact: Fact): Promise<void> {
  try {
    const existingFactsJson = await AsyncStorage.getItem(FACTS_STORAGE_KEY);
    const existingFacts: Fact[] = existingFactsJson
      ? JSON.parse(existingFactsJson).map(hydrateFact)
      : [];

    existingFacts.push(fact);

    await AsyncStorage.setItem(FACTS_STORAGE_KEY, JSON.stringify(existingFacts));

    const userId = await getLoggedInUserId();
    if (userId) upsertFactToCloud(fact, userId);
  } catch (error) {
    console.error('Error saving fact:', error);
    throw error;
  }
}

/**
 * Get all saved facts from local storage (with migration for missing card field)
 */
export async function getFacts(): Promise<Fact[]> {
  try {
    const factsJson = await AsyncStorage.getItem(FACTS_STORAGE_KEY);
    if (!factsJson) {
      return [];
    }

    const facts: Fact[] = JSON.parse(factsJson).map(hydrateFact);
    return facts;
  } catch (error) {
    console.error('Error getting facts:', error);
    return [];
  }
}

/**
 * Update a single fact in storage (used after reviewing a card)
 */
export async function updateFact(updatedFact: Fact): Promise<void> {
  try {
    const existingFactsJson = await AsyncStorage.getItem(FACTS_STORAGE_KEY);
    if (!existingFactsJson) return;

    const existingFacts: Fact[] = JSON.parse(existingFactsJson).map(hydrateFact);
    const index = existingFacts.findIndex(f => f.id === updatedFact.id);

    if (index !== -1) {
      existingFacts[index] = updatedFact;
      await AsyncStorage.setItem(FACTS_STORAGE_KEY, JSON.stringify(existingFacts));

      const userId = await getLoggedInUserId();
      if (userId) upsertFactToCloud(updatedFact, userId);
    }
  } catch (error) {
    console.error('Error updating fact:', error);
    throw error;
  }
}

/**
 * Get the count of saved facts
 */
export async function getFactCount(): Promise<number> {
  try {
    const facts = await getFacts();
    return facts.length;
  } catch (error) {
    console.error('Error getting fact count:', error);
    return 0;
  }
}

/**
 * Delete a fact from local storage (and cloud for logged-in users)
 */
export async function deleteFact(factId: string): Promise<void> {
  try {
    const existingFactsJson = await AsyncStorage.getItem(FACTS_STORAGE_KEY);
    if (!existingFactsJson) return;

    const existingFacts: Fact[] = JSON.parse(existingFactsJson).map(hydrateFact);
    const filteredFacts = existingFacts.filter(f => f.id !== factId);

    await AsyncStorage.setItem(FACTS_STORAGE_KEY, JSON.stringify(filteredFacts));

    const userId = await getLoggedInUserId();
    if (userId) deleteFactFromCloud(factId);
  } catch (error) {
    console.error('Error deleting fact:', error);
    throw error;
  }
}

/**
 * Save a review log entry
 */
export async function saveReviewLog(log: ReviewLog): Promise<void> {
  try {
    const existingJson = await AsyncStorage.getItem(REVIEW_LOGS_KEY);
    const existing: ReviewLog[] = existingJson ? JSON.parse(existingJson) : [];
    existing.push(log);
    await AsyncStorage.setItem(REVIEW_LOGS_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving review log:', error);
  }
}

/**
 * Get all review logs
 */
export async function getReviewLogs(): Promise<ReviewLog[]> {
  try {
    const json = await AsyncStorage.getItem(REVIEW_LOGS_KEY);
    if (!json) return [];
    return JSON.parse(json).map((l: any) => ({
      ...l,
      reviewedAt: new Date(l.reviewedAt),
    }));
  } catch (error) {
    console.error('Error getting review logs:', error);
    return [];
  }
}

/**
 * Delete a single atomic card from a fact.
 * If the fact has no remaining atomic cards after deletion, removes the entire fact.
 */
export async function deleteAtomicCard(factId: string, atomicCardId: string): Promise<void> {
  try {
    const existingFactsJson = await AsyncStorage.getItem(FACTS_STORAGE_KEY);
    if (!existingFactsJson) return;

    let existingFacts: Fact[] = JSON.parse(existingFactsJson).map(hydrateFact);
    const factIndex = existingFacts.findIndex(f => f.id === factId);
    if (factIndex === -1) return;

    const fact = existingFacts[factIndex];
    let removedEntireFact = false;
    if (fact.atomicCards) {
      fact.atomicCards = fact.atomicCards.filter(ac => ac.id !== atomicCardId);
      if (fact.atomicCards.length === 0) {
        existingFacts = existingFacts.filter(f => f.id !== factId);
        removedEntireFact = true;
      } else {
        existingFacts[factIndex] = fact;
      }
    }

    await AsyncStorage.setItem(FACTS_STORAGE_KEY, JSON.stringify(existingFacts));

    const userId = await getLoggedInUserId();
    if (userId) {
      if (removedEntireFact) {
        deleteFactFromCloud(factId);
      } else {
        upsertFactToCloud(fact, userId);
      }
    }
  } catch (error) {
    console.error('Error deleting atomic card:', error);
    throw error;
  }
}

/**
 * Get daily streak from review logs
 * Counts consecutive days (ending today or yesterday) with at least one review
 */
export async function getStreak(): Promise<number> {
  try {
    const logs = await getReviewLogs();
    if (logs.length === 0) return 0;

    // Get unique review dates (YYYY-MM-DD)
    const reviewDates = new Set(
      logs.map(l => {
        const d = new Date(l.reviewedAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    );

    const sortedDates = Array.from(reviewDates).sort().reverse();
    if (sortedDates.length === 0) return 0;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Streak must start from today or yesterday
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i - 1]);
      const prev = new Date(sortedDates[i]);
      const diffDays = Math.round((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

// ──────────────────────────────────────────────
// Cloud sync on login
// ──────────────────────────────────────────────

/**
 * Merge local and remote facts on login.
 * Cloud-wins for conflicts (matching id). Local-only facts are uploaded.
 */
export async function syncFactsOnLogin(userId: string): Promise<void> {
  try {
    const sb = getSupabase();
    if (!sb) return;

    const { data: remoteRows, error } = await sb
      .from('facts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('syncFactsOnLogin: failed to fetch remote facts', error);
      return;
    }

    const remoteFacts: Fact[] = (remoteRows ?? []).map(rowToFact);
    const remoteIds = new Set(remoteFacts.map(f => f.id));

    const localFacts = await getFacts();
    const localOnly = localFacts.filter(f => !remoteIds.has(f.id));

    // Cloud-wins merge: remote facts take priority, append local-only facts
    const merged = [...remoteFacts, ...localOnly];
    await AsyncStorage.setItem(FACTS_STORAGE_KEY, JSON.stringify(merged));

    // Upload local-only facts to cloud (first-login migration)
    if (localOnly.length > 0) {
      const rows = localOnly.map(f => factToRow(f, userId));
      const { error: uploadErr } = await sb.from('facts').upsert(rows, { onConflict: 'id' });
      if (uploadErr) console.warn('syncFactsOnLogin: upload local-only failed', uploadErr);
    }
  } catch (err) {
    console.warn('syncFactsOnLogin: unexpected error', err);
  }
}

// ──────────────────────────────────────────────
// Daily search counter
// ──────────────────────────────────────────────

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get the number of searches performed today
 */
export async function getDailySearchCount(): Promise<number> {
  try {
    const json = await AsyncStorage.getItem(DAILY_SEARCHES_KEY);
    if (!json) return 0;
    const data = JSON.parse(json);
    const today = getTodayKey();
    return data.date === today ? data.count : 0;
  } catch {
    return 0;
  }
}

/**
 * Increment today's search counter by 1. Resets automatically on a new day.
 */
export async function incrementDailySearchCount(): Promise<number> {
  try {
    const today = getTodayKey();
    const json = await AsyncStorage.getItem(DAILY_SEARCHES_KEY);
    let count = 1;

    if (json) {
      const data = JSON.parse(json);
      if (data.date === today) {
        count = data.count + 1;
      }
    }

    await AsyncStorage.setItem(DAILY_SEARCHES_KEY, JSON.stringify({ date: today, count }));
    return count;
  } catch {
    return 0;
  }
}
