// safeUrl.js — use for every href that comes from user data (profile links,
// job/event/project links, meeting links). Only http(s) links are allowed: a
// stored "javascript:" URL would run script in the viewer's session. Links saved
// without a scheme ("linkedin.com/in/me") get https:// so they don't resolve
// relative to this site. Returns undefined (no link) for anything else.
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function safeUrl(value) {
  if (!value) return undefined;
  const raw = String(value).trim();
  const candidate = HAS_SCHEME.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
