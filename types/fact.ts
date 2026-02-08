import { Card } from 'ts-fsrs';

export interface AtomicCard {
  id: string;
  front: string;
  back: string;
  card: Card;
  mnemonic?: string;
}

export interface Fact {
  id: string;
  question: string;
  answer: string;
  mnemonic?: string;
  createdAt: Date;
  card: Card;
  atomicCards?: AtomicCard[];
}

export interface ReviewLog {
  factId: string;
  atomicCardId?: string;
  rating: number;
  reviewedAt: Date;
}

/**
 * Represents a single reviewable item — either a legacy fact or an atomic card within a fact
 */
export interface ReviewItem {
  fact: Fact;
  atomicCard?: AtomicCard;
  isLegacy: boolean;
}
