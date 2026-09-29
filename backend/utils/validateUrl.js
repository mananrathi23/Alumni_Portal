/**
 * utils/validateUrl.js
 * User-supplied links (profile links, job/event links, project links, meeting
 * links) are rendered as clickable <a href>. Only http(s) URLs are accepted:
 * a "javascript:" link would run script in the viewer's session.
 */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

// "linkedin.com/in/me" → "https://linkedin.com/in/me"; returns null if not a safe web link
const normalizeUrl = (value) => {
  const raw = String(value).trim();
  const candidate = HAS_SCHEME.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return candidate;
  } catch {
    return null;
  }
};

export const isSafeUrl = (value) => normalizeUrl(value) !== null;

// For each non-empty field in `body`, require a safe web link and store its
// normalized form back into `body`. Returns the first invalid field name, or null.
export const findInvalidUrlField = (body, fields) => {
  for (const f of fields) {
    const value = body[f];
    if (value === undefined || value === null || String(value).trim() === "") continue;
    const normalized = normalizeUrl(value);
    if (!normalized) return f;
    body[f] = normalized;
  }
  return null;
};
