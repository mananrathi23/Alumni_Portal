import { Filter } from 'bad-words';

const filter = new Filter();

// 'ho' is a common Hindi word meaning "is/are/be" — removing it prevents
// false positives when users write normal Hindi sentences like "kaise ho".
filter.removeWords('ho');

/**
 * Checks if the given text contains profanity.
 * @param {string} text - The text to check.
 * @returns {boolean} True if profanity is detected, otherwise false.
 */
export const containsProfanity = (text) => {
    if (!text) return false;
    return filter.isProfane(text);
};