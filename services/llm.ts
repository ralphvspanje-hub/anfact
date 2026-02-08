/**
 * LLM API wrapper service
 *
 * Routes all chat-completions through the Supabase Edge Function
 * ("llm-proxy") so the Groq API key never ships in the client bundle.
 */

import { getSupabase } from './supabase';

// ──────────────────────────────────────────────
// Internal: route a chat-completion through the
// Edge Function (server-side only — no client key)
// ──────────────────────────────────────────────

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chatCompletion(
  messages: ChatMessage[],
  maxTokens: number,
  temperature = 1,
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured — LLM calls disabled.');
    return null;
  }

  const { data, error } = await supabase.functions.invoke('llm-proxy', {
    body: { messages, max_tokens: maxTokens, temperature },
  });

  if (error) {
    console.error('Edge function llm-proxy error:', error.message);
    return null;
  }

  return (data?.content as string) ?? null;
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Ask the LLM a question and get a concise answer.
 */
export async function askLLM(question: string): Promise<string> {
  try {
    const prompt = `Answer this question. Start with the direct answer in the first sentence, then provide brief context. Use **bold** for important terms and names. Keep it concise (under 100 words). Question: ${question}`;

    const content = await chatCompletion(
      [{ role: 'user', content: prompt }],
      500,
    );

    return content || 'Sorry, something went wrong.';
  } catch (error) {
    console.error('LLM error:', error);
    return 'Sorry, something went wrong.';
  }
}

/**
 * Split a user question + LLM answer into atomic Q&A flashcards
 * using the Minimum Information Principle. Returns 1–5 {front, back} pairs.
 */
export async function generateAtomicCards(
  userInput: string,
  llmAnswer: string,
): Promise<{ front: string; back: string }[]> {
  const fallback = [{ front: userInput, back: llmAnswer }];

  try {
    const prompt = `You are a flashcard creator following the Minimum Information Principle. Given the user's question and the answer, split the knowledge into atomic flashcards.

Rules:
- Create 1 to 5 independent Q&A flashcard pairs
- Each card should test ONE piece of knowledge
- Front: A clear, specific question
- Back: A concise, direct answer (no bullet points, no markdown formatting)
- Even simple inputs should be reformulated into proper Q&A format
- Cards should be self-contained (understandable without seeing other cards)

Return ONLY a valid JSON array, no other text:
[{"front": "question here", "back": "answer here"}]

User's question: ${userInput}
Answer: ${llmAnswer}`;

    const content = await chatCompletion(
      [{ role: 'user', content: prompt }],
      1000,
      0.3,
    );

    if (content) {
      const jsonMatch = content.trim().match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed
            .filter(
              (item: any) =>
                item &&
                typeof item.front === 'string' &&
                typeof item.back === 'string' &&
                item.front.trim().length > 0 &&
                item.back.trim().length > 0,
            )
            .slice(0, 5)
            .map((item: any) => ({
              front: item.front.trim(),
              back: item.back.trim(),
            }));

          if (valid.length > 0) return valid;
        }
      }
    }

    return fallback;
  } catch (error) {
    console.error('LLM error (atomic cards):', error);
    return fallback;
  }
}

/**
 * Generate a mnemonic for a fact using the LLM.
 */
export async function generateMnemonic(
  question: string,
  answer: string,
): Promise<string> {
  try {
    const prompt = `Create a short, memorable mnemonic or memory hook (max 15 words) to help remember this fact. Question: ${question}. Answer: ${answer}. Reply with only the mnemonic, nothing else.`;

    const content = await chatCompletion(
      [{ role: 'user', content: prompt }],
      100,
    );

    return content?.trim() || '';
  } catch (error) {
    console.error('LLM error (mnemonic):', error);
    return '';
  }
}
