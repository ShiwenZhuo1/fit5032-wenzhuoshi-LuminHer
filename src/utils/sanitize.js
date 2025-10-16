// src/utils/sanitize.js
import DOMPurify from 'dompurify'

// Very strict: strip all tags/attrs (pure text only)
export function sanitize(str) {
  return DOMPurify.sanitize(String(str ?? ''), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

// Sanitize an object by key whitelist
export function sanitizePick(obj, keys) {
  const out = { ...obj }
  keys.forEach(k => { out[k] = sanitize(out[k]) })
  return out
}

// Allow a minimal set of HTML for formatted tips
export function sanitizeBasicHtml(str) {
  return DOMPurify.sanitize(String(str ?? ''), {
    ALLOWED_TAGS: ['p','ul','ol','li','strong','em','b','i','h2','h3','h4','br'],
    ALLOWED_ATTR: [],
  })
}