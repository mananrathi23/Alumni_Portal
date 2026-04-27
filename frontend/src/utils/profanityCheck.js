/**
 * Client-side profanity check — lightweight pre-filter.
 * The backend ProfanityFilter.js (using `bad-words`) is the authoritative check;
 * this is just a quick UX guard so users get instant feedback before the message
 * even leaves the browser.
 */

const PROFANE_WORDS = [
  "ass", "asshole", "bastard", "bitch", "bullshit", "crap", "cunt",
  "damn", "dick", "dumbass", "fag", "fuck", "goddamn", "hell",
  "idiot", "jerk", "motherfucker", "nigger", "piss", "prick",
  "pussy", "shit", "slut", "stupid", "whore",
];

const pattern = new RegExp(
  `\\b(${PROFANE_WORDS.join("|")})\\b`,
  "i"
);

/**
 * Checks if the given text contains profanity.
 * Returns a Promise to stay compatible with the async call-sites.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function isProfane(text) {
  if (!text) return false;
  return pattern.test(text);
}
