import { detect } from 'curse-filter';
import profanityHindi from 'profanity-hindi';

// Regex to detect if the ONLY flagged token is a specific common Hindi word
// (e.g., meaning "is/are" — safe in standard usage)
const SAFE_WORD_REGEX = /^ho$/i;

/**
 * Checks if the given text contains unprofessional language.
 *
 * Combines two libraries for maximum coverage:
 *   • curse-filter
 *   • profanity-hindi
 *
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const containsProfanity = async (text) => {
  if (!text) return false;
  const trimmed = text.trim();

  // 1. profanity-hindi check (sync)
  if (profanityHindi.isMessageDirty(trimmed)) return true;

  // 2. curse-filter check (async)
  const flagged = await detect(trimmed, { lang: ['en', 'hi'] });
  if (flagged) {
    // Avoid false positive
    const words = trimmed.toLowerCase().split(/\s+/);
    const allSafe = words.every(w => SAFE_WORD_REGEX.test(w));
    if (allSafe) return false;
    return true;
  }

  return false;
};

/** Alias — for call-sites that import isProfane by name */
export const isProfane = containsProfanity;