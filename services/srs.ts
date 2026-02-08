import { fsrs, createEmptyCard, generatorParameters, Rating, Grade, Card, FSRS } from 'ts-fsrs';
import { Fact, AtomicCard, ReviewItem } from '../types/fact';

// Initialize FSRS scheduler with default parameters, targeting 90% retention
const params = generatorParameters({ request_retention: 0.9 });
const scheduler: FSRS = fsrs(params);

/**
 * Create a default FSRS card for new facts
 */
export function createDefaultCard(): Card {
  return createEmptyCard();
}

// ---------------------------------------------------------------------------
// Legacy helpers (still used by some callers)
// ---------------------------------------------------------------------------

/**
 * Get all facts that are due for review (card.due <= now)
 * Sorted by due date (oldest due first).
 * NOTE: For recall screen prefer getDueReviewItems() which handles atomic cards.
 */
export function getDueCards(facts: Fact[]): Fact[] {
  const now = new Date();
  return facts
    .filter(f => f.card && new Date(f.card.due) <= now)
    .sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime());
}

/**
 * Get non-due facts sorted by nearest due date (for study-ahead)
 * NOTE: For recall screen prefer getStudyAheadReviewItems().
 */
export function getStudyAheadCards(facts: Fact[]): Fact[] {
  const now = new Date();
  return facts
    .filter(f => f.card && new Date(f.card.due) > now)
    .sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime());
}

// ---------------------------------------------------------------------------
// ReviewItem-based helpers (atomic-card aware)
// ---------------------------------------------------------------------------

/** Helper: get the Card state for a ReviewItem */
function getReviewItemCard(item: ReviewItem): Card {
  return item.atomicCard ? item.atomicCard.card : item.fact.card;
}

/**
 * Flatten facts into ReviewItems — each atomic card becomes its own item,
 * legacy facts (no atomicCards) become a single item.
 */
function factsToReviewItems(facts: Fact[]): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const fact of facts) {
    if (fact.atomicCards && fact.atomicCards.length > 0) {
      for (const ac of fact.atomicCards) {
        items.push({ fact, atomicCard: ac, isLegacy: false });
      }
    } else {
      items.push({ fact, atomicCard: undefined, isLegacy: true });
    }
  }
  return items;
}

/**
 * Get due ReviewItems (card.due <= now), sorted oldest-due first.
 */
export function getDueReviewItems(facts: Fact[]): ReviewItem[] {
  const now = new Date();
  return factsToReviewItems(facts)
    .filter(item => {
      const card = getReviewItemCard(item);
      return card && new Date(card.due) <= now;
    })
    .sort((a, b) => {
      const dueA = new Date(getReviewItemCard(a).due).getTime();
      const dueB = new Date(getReviewItemCard(b).due).getTime();
      return dueA - dueB;
    });
}

/**
 * Get non-due ReviewItems sorted by nearest due date (study-ahead).
 */
export function getStudyAheadReviewItems(facts: Fact[]): ReviewItem[] {
  const now = new Date();
  return factsToReviewItems(facts)
    .filter(item => {
      const card = getReviewItemCard(item);
      return card && new Date(card.due) > now;
    })
    .sort((a, b) => {
      const dueA = new Date(getReviewItemCard(a).due).getTime();
      const dueB = new Date(getReviewItemCard(b).due).getTime();
      return dueA - dueB;
    });
}

// ---------------------------------------------------------------------------
// Review helpers
// ---------------------------------------------------------------------------

/**
 * Review a card with the given rating.
 * Returns { card, log } — the updated card state and the FSRS review log.
 */
export function reviewCard(fact: Fact, rating: Grade): { card: Card; log: any } {
  const now = new Date();
  const result = scheduler.next(fact.card, now, rating);
  return result as { card: Card; log: any };
}

/**
 * Review an individual Card state (works for both legacy facts and atomic cards).
 */
export function reviewCardState(card: Card, rating: Grade): { card: Card; log: any } {
  const now = new Date();
  const result = scheduler.next(card, now, rating);
  return result as { card: Card; log: any };
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

/**
 * Collect all individual Card objects across all facts (atomic + legacy)
 */
function getAllCards(facts: Fact[]): Card[] {
  const cards: Card[] = [];
  for (const fact of facts) {
    if (fact.atomicCards && fact.atomicCards.length > 0) {
      for (const ac of fact.atomicCards) {
        if (ac.card) cards.push(ac.card);
      }
    } else {
      if (fact.card) cards.push(fact.card);
    }
  }
  return cards;
}

/**
 * Get the next review time across all facts (including atomic cards)
 */
export function getNextReviewTime(facts: Fact[]): Date | null {
  const cards = getAllCards(facts);
  if (cards.length === 0) return null;

  const dueTimes = cards.map(c => new Date(c.due).getTime());
  return new Date(Math.min(...dueTimes));
}

/**
 * Compute average retrievability across all cards (as a percentage)
 */
export function getRetention(facts: Fact[]): number {
  const cards = getAllCards(facts).filter(c => c.stability > 0);
  if (cards.length === 0) return 0;

  const now = new Date();
  let totalRetrievability = 0;
  let reviewedCount = 0;

  for (const card of cards) {
    const lastReview = card.last_review;
    if (!lastReview) continue;
    reviewedCount++;
    const elapsed = (now.getTime() - new Date(lastReview).getTime()) / (1000 * 60 * 60 * 24);
    const r = Math.pow(1 + elapsed / (9 * card.stability), -1);
    totalRetrievability += r;
  }

  if (reviewedCount === 0) return 0;
  return Math.round((totalRetrievability / reviewedCount) * 100);
}

// Re-export Rating for convenience
export { Rating };
