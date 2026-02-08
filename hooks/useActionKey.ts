import { useEffect } from 'react';
import { Platform } from 'react-native';

const FLIP_KEYS = new Set([' ', 'Enter']);
const RATE_GOOD_KEY = 'ArrowRight';

const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  if (IGNORED_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/**
 * Calls `action` when the user presses Space or Enter (web only).
 * Used to toggle the card flip.
 *
 * @param action  Callback to fire on key match
 * @param enabled Guard — listener is only active when true
 */
export function useFlipKey(action: () => void, enabled: boolean): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (!FLIP_KEYS.has(e.key)) return;
      if (isInputFocused()) return;

      e.preventDefault(); // stop Space from scrolling the page
      action();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [action, enabled]);
}

/**
 * Calls `action` when the user presses ArrowRight (web only).
 * Used to rate the current card as Good.
 *
 * @param action  Callback to fire on key match
 * @param enabled Guard — listener is only active when true
 */
export function useRateGoodKey(action: () => void, enabled: boolean): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key !== RATE_GOOD_KEY) return;
      if (isInputFocused()) return;

      e.preventDefault();
      action();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [action, enabled]);
}

/**
 * @deprecated Use useFlipKey + useRateGoodKey instead.
 * Kept for backward-compat; maps Space/Enter/ArrowRight to a single action.
 */
export function useActionKey(action: () => void, enabled: boolean): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;

    const ALL_KEYS = new Set([' ', 'Enter', 'ArrowRight']);
    const handler = (e: KeyboardEvent) => {
      if (!ALL_KEYS.has(e.key)) return;
      if (isInputFocused()) return;

      e.preventDefault();
      action();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [action, enabled]);
}
