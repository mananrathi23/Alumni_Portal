/**
 * Client-side profanity check using the curse-filter library.
 * No word lists in this file — all detection is handled by the package.
 * Backend (curse-filter) is the real enforcement layer; this only shows a UI warning.
 */
import { detect } from 'curse-filter';

export async function isProfane(text) {
  if (!text) return false;
  return await detect(text, { lang: ['en', 'hi'] });
}
