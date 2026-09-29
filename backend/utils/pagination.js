/**
 * utils/pagination.js
 * Parses ?page and ?limit safely: page ≥ 1, 1 ≤ limit ≤ maxLimit.
 * (limit=0 would otherwise mean "no limit" to MongoDB, and page=0 a negative skip.)
 */
export const pageParams = (query, { defaultLimit = 20, maxLimit = 50 } = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};
