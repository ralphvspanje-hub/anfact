# constants/ — Agent Context

Static content: UI copy, phrase arrays, and utility functions for picking from them.

## `phrases.ts`

All user-facing copy that has a humorous/witty tone. Organized by context.

### Phrase arrays (all used with `getRandomPhrase` to avoid repeats)

| Export | Used in |
|---|---|
| `savePhrases` | Confirmation message after saving a fact |
| `emptyLibraryPhrases` | `{ title, message }` — library screen when no facts saved |
| `emptyRecallPhrases` | `{ title, message }` — recall screen when no facts saved |
| `allCaughtUpPhrases` | `{ title, subtitle }` — recall screen when all cards reviewed |
| `quizIntroPhrases` | Subtitle shown in the stats bar at the start of a review session |
| `searchJokePhrases` | Eco-joke subtitle on the search screen empty state |
| `examplePrompts` | Prompt chips shown on the search screen to inspire questions |

### Utility functions

**`getRandomPhrase<T>(phrases, lastIndexRef)`**
Returns a random element from `phrases`, avoiding the same index as `lastIndexRef.current`. Updates `lastIndexRef.current`. Works for all phrase arrays (string or object).

Usage pattern in a component:
```tsx
const lastPhraseIndex = useRef(-1);
const phrase = getRandomPhrase(savePhrases, lastPhraseIndex);
```

**`pickRandomSubset<T>(items, count)`**
Returns `count` random non-repeating items from `items`. Used for selecting which example prompts to show.

## Tone

All phrases have a dry, self-deprecating humor tone. When adding new phrases, match the existing tone — deadpan, slightly nihilistic, never cheesy or earnest.
