// ── Azerbaijani-tolerant search regex ──
// MongoDB's case-insensitive regex ($options:"i") does NOT fold the Azerbaijani
// İ/ı pair correctly, and users often type ASCII ("ingilis") expecting to match
// diacritics ("İngilis"). This builds a regex where each character matches its
// whole AZ equivalence group, so search works both ways.

// Each string is a group of interchangeable letters (both cases + ASCII/diacritic).
const GROUPS = [
  "iıİI",   // i / ı / İ / I
  "eEəƏ",   // e / ə
  "oOöÖ",   // o / ö
  "uUüÜ",   // u / ü
  "cCçÇ",   // c / ç
  "sSşŞ",   // s / ş
  "gGğĞ",   // g / ğ
  "aA",
];

const REGEX_META = /[.*+?^${}()|[\]\\]/;

function charClass(ch) {
  const group = GROUPS.find((g) => g.includes(ch));
  const chars = group || ch.toLowerCase() + ch.toUpperCase();
  // De-dupe and escape characters that are special inside a [...] class.
  const body = [...new Set(chars)].map((c) => c.replace(/[-\]\\^]/g, "\\$&")).join("");
  return `[${body}]`;
}

/**
 * Build a diacritic/case-tolerant RegExp for a search term.
 * @param {string} term
 * @param {number} max - max term length (guards against ReDoS)
 * @returns {RegExp}
 */
export function fuzzyRegex(term, max = 100) {
  const t = String(term || "").slice(0, max).trim();
  const pattern = [...t]
    .map((ch) => {
      if (/\s/.test(ch)) return "\\s+";
      if (REGEX_META.test(ch)) return "\\" + ch; // keep metachars literal
      return charClass(ch);
    })
    .join("");
  return new RegExp(pattern || "", "i");
}
