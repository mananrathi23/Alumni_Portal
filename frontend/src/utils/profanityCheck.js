import { detect } from 'curse-filter';
import profanityHindi from 'profanity-hindi';

// Regex to detect if the ONLY flagged token is a specific common Hindi word
const SAFE_WORD_REGEX = /^ho$/i;

/**
 * Client-side profanity check — lightweight pre-filter using libraries.
 * Returns a Promise to stay compatible with the async call-sites.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function isProfane(text) {
  if (!text) return false;
  const trimmed = text.trim();

  // 1. profanity-hindi check (sync)
  if (profanityHindi.isMessageDirty(trimmed)) return true;

  // 2. curse-filter check (async)
  try {
    const flagged = await detect(trimmed, { lang: ['en', 'hi'] });
    if (flagged) {
      // Avoid false positive
      const words = trimmed.toLowerCase().split(/\s+/);
      const allSafe = words.every(w => SAFE_WORD_REGEX.test(w));
      if (allSafe) return false;
      return true;
    }
  } catch (error) {
    // If browser environment blocks the library, fallback to false to let backend handle it
    console.error("Profanity filter error:", error);
  }

  return false;
}
