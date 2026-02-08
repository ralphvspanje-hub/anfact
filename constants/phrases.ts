import { MutableRefObject } from 'react';

// ──────────────────────────────────────────────
//  Save confirmation phrases (replaces "Saved!")
// ──────────────────────────────────────────────
export const savePhrases = [
  'Hoarded like a digital dragon.',
  "Saved. You'll forget it by Thursday.",
  "Filed under \"things you'll Google again anyway.\"",
  "Congrats, your brain has a new roommate it'll ignore.",
  'Stored. Your future self is already disappointed.',
  "Another fact you'll pretend you always knew.",
  'Saved! Bragging rights: pending.',
  'Absorbed into the void of your long-term memory. Good luck.',
  'Fact locked in. Retrieval not guaranteed.',
  'Added to the graveyard of things you "totally know."',
  "Saved. Your neurons didn't even flinch.",
  'Knowledge acquired. Wisdom? Still loading.',
  "Memorized. Or at least that's what we'll tell ourselves.",
  'Planted in your brain. Survival rate: questionable.',
  'One more fact between you and blissful ignorance.',
];

// ──────────────────────────────────────────────
//  Library empty state (no facts saved yet)
// ──────────────────────────────────────────────
export const emptyLibraryPhrases: { title: string; message: string }[] = [
  {
    title: 'Ah, the void.',
    message: 'Your library is as empty as a motivational poster in a cubicle. Save something.',
  },
  {
    title: 'Nothing here. Just like your childhood dreams.',
    message: 'Start collecting facts before the existential dread fills the space instead.',
  },
  {
    title: 'This is uncomfortably empty.',
    message: "Like a fridge after a breakup. Go search something and pretend it's self-improvement.",
  },
  {
    title: 'Zero facts saved.',
    message: "You're technically less informed than someone who opened this app five seconds ago.",
  },
  {
    title: 'Your library called in sick.',
    message: "It can't come to work because it doesn't exist yet. Save a fact.",
  },
  {
    title: 'Bold of you to have an empty library.',
    message: 'The search tab is right there, staring at you. Judging, probably.',
  },
];

// ──────────────────────────────────────────────
//  Recall empty state (no facts to recall)
// ──────────────────────────────────────────────
export const emptyRecallPhrases: { title: string; message: string }[] = [
  {
    title: "Can't quiz what isn't there.",
    message: 'Save some facts first. Even goldfish have things to remember.',
  },
  {
    title: 'Your recall queue is just… silence.',
    message: "The awkward kind. Go save something so we can pretend you're learning.",
  },
  {
    title: 'No memories to jog.',
    message: "Kind of like your brain after a Monday morning. Save a fact. We'll wait.",
  },
  {
    title: 'The quiz is ready. You are not.',
    message: "Zero facts saved means zero questions asked. That's technically a perfect score.",
  },
  {
    title: 'Nothing to recall.',
    message: 'Your long-term memory and this screen have something in common: both empty.',
  },
];

// ──────────────────────────────────────────────
//  All caught up state
// ──────────────────────────────────────────────
export const allCaughtUpPhrases: { title: string; subtitle: string }[] = [
  {
    title: 'All caught up!',
    subtitle: "Go stare at a wall. You've earned the existential pause.",
  },
  {
    title: "You're done. Somehow.",
    subtitle: 'Your neurons are free to resume their regularly scheduled overthinking.',
  },
  {
    title: 'Nothing left to review.',
    subtitle: "Enjoy this rare moment of competence. It won't last.",
  },
  {
    title: 'Queue empty.',
    subtitle: "Just like your schedule on a Friday night. Don't worry, we won't tell.",
  },
  {
    title: "You're free. For now.",
    subtitle: 'The algorithm remembers. The algorithm always remembers.',
  },
  {
    title: 'Done and dusted.',
    subtitle: 'Go do something productive. Or just scroll. We both know which one.',
  },
  {
    title: 'All reviews complete!',
    subtitle: "Treat yourself to a nap. You'll need the energy for tomorrow's regrets.",
  },
  {
    title: 'Inbox zero. Brain edition.',
    subtitle: "Come back later when your facts have ripened and your ambition hasn't.",
  },
];

// ──────────────────────────────────────────────
//  Quiz intro phrases (shown as subtitle in stats bar)
// ──────────────────────────────────────────────
export const quizIntroPhrases = [
  'Time to confront what you almost learned.',
  "Let's see what your brain actually retained. Spoiler: less than you think.",
  'Your facts missed you. Your memory did not.',
  "Neurons: reluctantly activated. Let's go.",
  'Pop quiz. No, you can\'t phone a friend.',
  'Recall mode: where confidence goes to die.',
  "Flashcard time — emotionally cheaper than therapy.",
  'Your brain called. It wants an apology.',
  "Ready to discover how little you remember?",
  'The algorithm believes in you. It has to — nobody else signed up.',
  'Spaced repetition: because your first attempt clearly didn\'t stick.',
  "Let's turn \"I definitely knew that\" into actual knowledge.",
];

// ──────────────────────────────────────────────
//  Search empty state: eco-joke subtitles
// ──────────────────────────────────────────────
export const searchJokePhrases = [
  'Did you know? Searching here emits 0 g of CO₂. Unlike your existential sighs.',
  "Your brain's carbon footprint is low. Its coping mechanisms? Not so much.",
  'Fun fact: curiosity killed the cat, but ignorance buried it.',
  'No trees were harmed. Your productivity, on the other hand…',
  'Powered by caffeine, spite, and free-range electrons.',
  "Ask a question. It's cheaper than a philosophy degree.",
  'This app runs on algorithms and quiet desperation. Mostly.',
  'Go ahead, search. Distract yourself from the inevitable.',
  'Every question asked plants a virtual tree. (It dies virtually too.)',
  "Curious? Good. It's the only renewable resource you've got.",
  "Your search history says more about you than your résumé ever will.",
  'Warning: excessive learning may cause unsolicited opinions at dinner parties.',
];

// ──────────────────────────────────────────────
//  Search empty state: example prompt chips
// ──────────────────────────────────────────────
export const examplePrompts = [
  'Can a human survive on coffee alone?',
  'Why do we forget dreams within minutes?',
  'What happens to your body in space without a suit?',
  'How many extinct species were delicious?',
  'Why does time feel faster as you age?',
  'What is the most lethal animal on Earth?',
  'Can octopuses feel existential dread?',
  'Why do we cringe at old memories?',
  'What would happen if the Moon disappeared?',
  'How long could civilization survive without the Sun?',
  'Why is the Fermi Paradox so unsettling?',
  'What is the deadliest substance known to science?',
  'Can you die from a broken heart? Literally?',
  'Why do humans have an appendix?',
  'How close have we come to nuclear war?',
  'What is the heat death of the universe?',
];

/**
 * Pick `count` random items from an array without repeats.
 */
export function pickRandomSubset<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ──────────────────────────────────────────────
//  Helper: pick a random phrase, avoid back-to-back repeats
// ──────────────────────────────────────────────
/**
 * Returns a random element from `phrases`, avoiding the index stored in
 * `lastIndexRef`. Updates `lastIndexRef` with the chosen index.
 *
 * Works with any array (strings or objects).
 */
export function getRandomPhrase<T>(
  phrases: T[],
  lastIndexRef: MutableRefObject<number>,
): T {
  if (phrases.length === 0) {
    throw new Error('phrases array must not be empty');
  }
  if (phrases.length === 1) {
    lastIndexRef.current = 0;
    return phrases[0];
  }

  let index: number;
  do {
    index = Math.floor(Math.random() * phrases.length);
  } while (index === lastIndexRef.current);

  lastIndexRef.current = index;
  return phrases[index];
}
