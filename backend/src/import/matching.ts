/**
 * matching.ts — Fuzzy-matching and unit-detection utilities for Phase 1 algorithm.
 *
 * All functions here are pure (no I/O, no DB access) and can be unit-tested independently.
 * normalizeName and normalizeTaxId remain in import.service.ts — not duplicated here.
 */

import { normalizeName } from './import.service';

// ── Lookalike substitution maps ───────────────────────────────────────────────

/**
 * Latin→Cyrillic lookalike substitution table.
 * Applied after lowercasing so only lowercase latin keys are needed.
 */
const CYRILLIC_LOOKALIKES: Record<string, string> = {
  a: 'а',
  e: 'е',
  i: 'і',
  o: 'о',
  p: 'р',
  c: 'с',
  x: 'х',
  // uppercase forms (lowercased before substitution, but kept for clarity):
  // actual substitutions happen after toLowerCase, so these are redundant
  // but present for documentation
};

/**
 * Ukrainian vowel-softening variants — applied AFTER lookalike substitution.
 * Makes е/є and и/і equivalent for Levenshtein distance purposes.
 */
const UKRAINIAN_VARIANTS: Record<string, string> = {
  'є': 'е',
  'і': 'и',
  'ї': 'и',
};

// ── Normalisation ─────────────────────────────────────────────────────────────

/**
 * Extend normalizeName with OCR/lookalike and vowel-softening normalisation.
 *
 * Pipeline:
 *   1. normalizeName() — NFC lowercase, apostrophe/dash unification, whitespace collapse
 *   2. Replace latin lookalikes char-by-char (post-lowercase so only lc keys matter)
 *   3. Apply Ukrainian vowel softening (є→е, і→и, ї→и)
 *   4. Strip remaining apostrophes and hyphens (add noise to edit distance)
 */
export function normalizeForFuzzy(name: string): string {
  // Step 1: canonical form
  let s = normalizeName(name);

  // Step 2: latin→cyrillic lookalike replacement (after lowercasing)
  // The full set needed for lowercase after step 1:
  const lookalikes: Record<string, string> = {
    a: 'а',
    e: 'е',
    i: 'і',
    o: 'о',
    p: 'р',
    c: 'с',
    x: 'х',
    // uppercase versions won't occur after toLowerCase, but map them anyway
    // to be defensive (normalizeName lowercases, so these are no-ops):
  };

  let result = '';
  for (const ch of s) {
    result += lookalikes[ch] ?? ch;
  }

  // Step 3: Ukrainian vowel softening
  const variants: Record<string, string> = {
    'є': 'е',
    'і': 'и',
    'ї': 'и',
  };
  let result2 = '';
  for (const ch of result) {
    result2 += variants[ch] ?? ch;
  }

  // Step 4: strip apostrophes and hyphens
  return result2.replace(/['\-]/g, '');
}

/**
 * Sort the space-separated tokens of a normalized name alphabetically,
 * then rejoin — making comparison word-order-independent.
 *
 * Input must already be normalized (via normalizeForFuzzy or normalizeName).
 */
export function tokenSortName(normalized: string): string {
  if (!normalized) return '';
  return normalized
    .split(' ')
    .filter((t) => t.length > 0)
    .sort()
    .join(' ');
}

// ── Levenshtein distance (inline — no external dep) ───────────────────────────

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[b.length];
}

// ── Fuzzy name similarity ─────────────────────────────────────────────────────

/**
 * Compute similarity score in [0.0, 1.0] between two owner names.
 *
 * Algorithm:
 *   1. Edge cases: both empty → 1.0; one empty → 0.0
 *   2. normalizeForFuzzy + tokenSortName both inputs
 *   3. Levenshtein distance on token-sorted strings
 *   4. similarity = 1 − dist / max(len_a, len_b)
 */
export function fuzzyNameSimilarity(a: string, b: string): number {
  const emptyA = !a || a.trim().length === 0;
  const emptyB = !b || b.trim().length === 0;
  if (emptyA && emptyB) return 1.0;
  if (emptyA || emptyB) return 0.0;

  const sortedA = tokenSortName(normalizeForFuzzy(a));
  const sortedB = tokenSortName(normalizeForFuzzy(b));

  if (sortedA === sortedB) return 1.0;

  const dist = levenshtein(sortedA, sortedB);
  const maxLen = Math.max(sortedA.length, sortedB.length);
  return Math.max(0.0, Math.min(1.0, 1 - dist / maxLen));
}

// ── Owner key resolution ──────────────────────────────────────────────────────

/** Result of owner key resolution for cross-registry matching. */
export interface OwnerKeyResult {
  /** Whether the match was established via identical IPN (tax ID). */
  matchedByIpn: boolean;
  /** Canonical key used for grouping/matching; empty string means no confident match. */
  key: string;
  /** Confidence: 1.0 for IPN match, 0.0–1.0 for name fuzzy match. */
  similarity: number;
}

/**
 * Resolve the canonical owner key for cross-registry matching.
 *
 * IPN-priority rules:
 * - Both IPNs non-empty AND equal   → IPN match (similarity 1.0)
 * - Both IPNs non-empty AND unequal → different persons; no match (similarity 0.0)
 * - Either IPN empty                → fall back to fuzzy name similarity
 *
 * @param landTaxId  Normalised IPN from the land registry (may be empty string)
 * @param landNameNorm  Normalised name from the land registry
 * @param reTaxId    Normalised IPN from the real-estate registry (may be empty string)
 * @param reNameNorm Normalised name from the real-estate registry
 */
export function resolveOwnerKey(
  landTaxId: string,
  landNameNorm: string,
  reTaxId: string,
  reNameNorm: string,
): OwnerKeyResult {
  const bothHaveIpn = landTaxId.length > 0 && reTaxId.length > 0;

  if (bothHaveIpn) {
    if (landTaxId === reTaxId) {
      return { matchedByIpn: true, key: landTaxId, similarity: 1.0 };
    }
    // Different IPNs → definitively different persons
    return { matchedByIpn: false, key: '', similarity: 0.0 };
  }

  // At least one side has no IPN → fall back to name similarity
  const sim = fuzzyNameSimilarity(landNameNorm, reNameNorm);
  const key =
    sim >= 0.85 ? tokenSortName(normalizeForFuzzy(landNameNorm)) : '';
  return { matchedByIpn: false, key, similarity: sim };
}

// ── Area unit detection ───────────────────────────────────────────────────────

/**
 * Detect whether a column of area values is expressed in hectares or square metres.
 *
 * Heuristic: compute the median of non-zero values.
 * - median < 50  → likely hectares  (typical parcel: 0.1–20 ha)
 * - median >= 50 → likely m²        (typical parcel: 500–20 000 m²)
 *
 * Safe default for empty input: 'm2'
 */
export function detectAreaUnit(sampleValues: number[]): 'ha' | 'm2' {
  const vals = sampleValues.filter((v) => v > 0);
  if (vals.length === 0) return 'm2';

  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  return median < 50 ? 'ha' : 'm2';
}
