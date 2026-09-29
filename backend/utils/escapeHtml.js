/**
 * utils/escapeHtml.js
 * User text is stored as typed; React escapes it on screen. HTML emails are the
 * one place it is interpolated into raw HTML, so escape it there.
 */
const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

const escapeHtml = (value) =>
  value === undefined || value === null ? "" : String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);

// Escapes every value of an object (template parameters)
export const escapeFields = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, escapeHtml(v)]));
