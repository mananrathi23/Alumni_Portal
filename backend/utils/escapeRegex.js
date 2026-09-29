/**
 * utils/escapeRegex.js
 * Turns user search text into a safe, case-insensitive "contains" match.
 * Without escaping, input like "C++" or "(" makes MongoDB throw (500 error),
 * and crafted patterns can force expensive regex scans.
 */
const MAX_SEARCH_LENGTH = 100;

export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Returns a `{ $regex, $options }` condition, or null when the search is empty.
export const searchRegex = (text) => {
  const trimmed = String(text ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
  if (!trimmed) return null;
  return { $regex: escapeRegex(trimmed), $options: "i" };
};
