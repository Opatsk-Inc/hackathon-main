/**
 * matching.ts — Fuzzy-matching and unit-detection utilities.
 *
 * All functions here are pure (no I/O, no DB access) and can be unit-tested independently.
 * normalizeName and normalizeTaxId remain in import.service.ts — not duplicated here.
 */

import { normalizeName } from './import.service';

// ── Lookalike substitution map (Latin→Cyrillic) ──────────────────────────────

/**
 * Latin→Cyrillic lookalike substitution table.
 * Applied after lowercasing so only lowercase latin keys are needed.
 * Covers the full set of visually-identical Latin/Cyrillic pairs.
 */
const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: 'а',
  b: 'в', // less common but appears in OCR
  e: 'е',
  i: 'і',
  k: 'к',
  m: 'м',
  n: 'н', // OCR sometimes confuses
  o: 'о',
  p: 'р',
  c: 'с',
  t: 'т',
  x: 'х',
  y: 'у',
};

/**
 * Ukrainian phonetic equivalences — applied AFTER lookalike substitution.
 * Makes е/є, и/і/ї, г/ґ equivalent for distance comparison.
 */
const PHONETIC_EQUIVALENCES: Record<string, string> = {
  є: 'е',
  і: 'и',
  ї: 'и',
  ґ: 'г',
  ё: 'е', // Russian leftover in some docs
  ъ: '',  // hard sign — noise
  ь: '',  // soft sign — noise in fuzzy context
};

// ── Normalisation ─────────────────────────────────────────────────────────────

/**
 * Extend normalizeName with OCR/lookalike and phonetic normalisation.
 *
 * Pipeline:
 *   1. normalizeName() — NFC lowercase, apostrophe/dash unification, whitespace collapse
 *   2. Replace latin lookalikes char-by-char
 *   3. Apply Ukrainian phonetic equivalences
 *   4. Strip remaining apostrophes and hyphens (noise for edit distance)
 *
 * IMPORTANT: This function accepts EITHER raw OR already-normalized names.
 * normalizeName() is idempotent so double-calling is safe.
 */
export function normalizeForFuzzy(name: string): string {
  if (!name) return '';

  // Step 1: canonical form (idempotent)
  let s = normalizeName(name);

  // Step 2: latin→cyrillic lookalike replacement
  let result = '';
  for (const ch of s) {
    result += LATIN_TO_CYRILLIC[ch] ?? ch;
  }

  // Step 3: Ukrainian phonetic equivalences
  let result2 = '';
  for (const ch of result) {
    result2 += PHONETIC_EQUIVALENCES[ch] ?? ch;
  }

  // Step 4: replace hyphens with spaces (hyphenated surnames = separate tokens),
  // strip apostrophes
  return result2
    .replace(/-/g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sort the space-separated tokens of a name alphabetically,
 * then rejoin — making comparison word-order-independent.
 *
 * Input should already be normalized (via normalizeForFuzzy or normalizeName).
 */
export function tokenSortName(normalized: string): string {
  if (!normalized) return '';
  return normalized
    .split(' ')
    .filter((t) => t.length > 0)
    .sort()
    .join(' ');
}

// ── Levenshtein distance (space-optimized 1D DP) ──────────────────────────────

/**
 * Standard Levenshtein distance — insertions, deletions, substitutions.
 * Uses 1D DP array for O(min(n,m)) space and better cache locality.
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Ensure 'a' is the shorter string for space efficiency
  if (la > lb) return levenshtein(b, a);

  const dp = new Array<number>(la + 1);
  for (let i = 0; i <= la; i++) dp[i] = i;

  for (let j = 1; j <= lb; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= la; i++) {
      const temp = dp[i];
      dp[i] =
        a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i], dp[i - 1]);
      prev = temp;
    }
  }
  return dp[la];
}

// ── Bigram similarity (Dice coefficient) ──────────────────────────────────────

/**
 * Compute Dice coefficient (bigram overlap) between two strings.
 * Good for short strings where Levenshtein can be misleading.
 * Returns a value in [0.0, 1.0].
 */
function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) return 0.0;

  const bigramsA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.substring(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) ?? 0) + 1);
  }

  const bigramsB = new Map<string, number>();
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.substring(i, i + 2);
    bigramsB.set(bg, (bigramsB.get(bg) ?? 0) + 1);
  }

  let intersection = 0;
  for (const [bg, countA] of bigramsA) {
    const countB = bigramsB.get(bg) ?? 0;
    intersection += Math.min(countA, countB);
  }

  return (2.0 * intersection) / (a.length - 1 + (b.length - 1));
}

// ── Token-level matching ──────────────────────────────────────────────────────

/**
 * Check if one name could be an abbreviated form of the other.
 * E.g., "іваненко о м" matches "іваненко олег михайлович".
 * Returns a confidence score 0.0–1.0.
 */
function initialsMatchScore(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;

  // Make 'long' the one with more characters total, 'short' the other
  const [long, short] =
    tokensA.join('').length >= tokensB.join('').length
      ? [tokensA, tokensB]
      : [tokensB, tokensA];

  // The short side must have at least one "full" token (surname) matching
  let fullMatches = 0;
  let initialMatches = 0;
  const usedLong = new Set<number>();

  for (const st of short) {
    let matched = false;
    for (let li = 0; li < long.length; li++) {
      if (usedLong.has(li)) continue;

      if (st === long[li]) {
        // Exact token match
        fullMatches++;
        usedLong.add(li);
        matched = true;
        break;
      }

      // Initial match: "о" matches "олег", or "ол" matches "олег"
      if (st.length <= 2 && long[li].startsWith(st)) {
        initialMatches++;
        usedLong.add(li);
        matched = true;
        break;
      }
    }
    if (!matched) return 0.0; // Unmatched token — no initials match
  }

  if (fullMatches === 0) return 0.0; // Need at least one full token (surname)

  // Score: full matches = 1.0 each, initial matches = 0.7 each
  const maxTokens = Math.max(long.length, short.length);
  const score = (fullMatches * 1.0 + initialMatches * 0.7) / maxTokens;
  return Math.min(1.0, score);
}

/**
 * Token-level set similarity: how many tokens from A appear in B (fuzzy, per token).
 * Each token pair scores via Damerau-Levenshtein. Best match is greedy.
 */
function tokenSetSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;

  // Make sure A is the shorter list for greedy matching
  const [shorter, longer] =
    tokensA.length <= tokensB.length
      ? [tokensA, tokensB]
      : [tokensB, tokensA];

  let totalScore = 0;
  const usedIndices = new Set<number>();

  for (const tokenS of shorter) {
    let bestScore = 0;
    let bestIdx = -1;

    for (let i = 0; i < longer.length; i++) {
      if (usedIndices.has(i)) continue;

      const tokenL = longer[i];
      const maxLen = Math.max(tokenS.length, tokenL.length);
      if (maxLen === 0) continue;

      const dist = levenshtein(tokenS, tokenL);
      const sim = 1 - dist / maxLen;

      if (sim > bestScore) {
        bestScore = sim;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      usedIndices.add(bestIdx);
      totalScore += bestScore;
    }
  }

  // Normalize by the longer set to penalize missing tokens
  return totalScore / Math.max(shorter.length, longer.length);
}

// ── Fuzzy name similarity (main export) ───────────────────────────────────────

/**
 * Compute similarity score in [0.0, 1.0] between two owner names.
 *
 * Uses a composite approach — takes the MAXIMUM of:
 *   1. Token-sorted Damerau-Levenshtein similarity (catches typos + word order)
 *   2. Bigram (Dice) similarity (robust for short strings)
 *   3. Token-set similarity (each token matched independently — catches partial names)
 *   4. Initials matching (e.g., "Іваненко О.М." vs "Іваненко Олег Михайлович")
 *
 * Both inputs can be either raw or already-normalized names.
 */
export function fuzzyNameSimilarity(a: string, b: string): number {
  const emptyA = !a || a.trim().length === 0;
  const emptyB = !b || b.trim().length === 0;
  if (emptyA && emptyB) return 1.0;
  if (emptyA || emptyB) return 0.0;

  // Normalize both through the full pipeline
  const normA = normalizeForFuzzy(a);
  const normB = normalizeForFuzzy(b);

  if (normA === normB) return 1.0;

  // Early exit: if lengths are too different, can't be a good match
  const lenRatio = Math.min(normA.length, normB.length) / Math.max(normA.length, normB.length);
  if (lenRatio < 0.3) return lenRatio * 0.5; // Very different lengths → low score quickly

  // Strategy 1: Token-sorted Levenshtein
  const sortedA = tokenSortName(normA);
  const sortedB = tokenSortName(normB);
  const dist = levenshtein(sortedA, sortedB);
  const maxLen = Math.max(sortedA.length, sortedB.length);
  const levSim = maxLen > 0 ? 1 - dist / maxLen : 0;

  // Early exit: if Levenshtein is already great, no need for more strategies
  if (levSim >= 0.95) return levSim;

  // Strategy 2: Bigram similarity on token-sorted
  const bigramSim = bigramSimilarity(sortedA, sortedB);

  let best = Math.max(levSim, bigramSim);

  // Strategy 3 & 4 only if we haven't reached threshold yet
  if (best < 0.82) {
    const tokensA = normA.split(' ').filter((t) => t.length > 0);
    const tokensB = normB.split(' ').filter((t) => t.length > 0);

    // Strategy 3: Token-set similarity
    const tokenSetSim = tokenSetSimilarity(tokensA, tokensB);
    best = Math.max(best, tokenSetSim);

    // Strategy 4: Initials matching (only if tokens differ in count or length)
    if (best < 0.82) {
      const initialsSim = initialsMatchScore(tokensA, tokensB);
      best = Math.max(best, initialsSim);
    }
  }

  return best;
}

/**
 * Internal: Score two names that are already normalized via normalizeForFuzzy.
 * Avoids redundant normalization when called from indexed matching.
 */
function _scorePrenormalized(
  normA: string, sortedA: string, tokensA: string[],
  normB: string, sortedB: string,
): number {
  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  // Early exit for very different lengths
  const lenRatio = Math.min(normA.length, normB.length) / Math.max(normA.length, normB.length);
  if (lenRatio < 0.3) return lenRatio * 0.5;

  // Strategy 1: Token-sorted Levenshtein
  const dist = levenshtein(sortedA, sortedB);
  const maxLen = Math.max(sortedA.length, sortedB.length);
  const levSim = maxLen > 0 ? 1 - dist / maxLen : 0;

  if (levSim >= 0.95) return levSim;

  // Strategy 2: Bigram
  const bigramSim = bigramSimilarity(sortedA, sortedB);

  let best = Math.max(levSim, bigramSim);

  if (best < 0.82) {
    const tokensB = normB.split(' ').filter((t) => t.length > 0);
    const tokenSetSim = tokenSetSimilarity(tokensA, tokensB);
    best = Math.max(best, tokenSetSim);

    if (best < 0.82) {
      const initialsSim = initialsMatchScore(tokensA, tokensB);
      best = Math.max(best, initialsSim);
    }
  }

  return best;
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
 * @param landName   Owner name from the land registry (raw or normalized — both work)
 * @param reTaxId    Normalised IPN from the real-estate registry (may be empty string)
 * @param reName     Owner name from the real-estate registry (raw or normalized — both work)
 */
export function resolveOwnerKey(
  landTaxId: string,
  landName: string,
  reTaxId: string,
  reName: string,
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
  const sim = fuzzyNameSimilarity(landName, reName);
  const key =
    sim >= 0.82 ? tokenSortName(normalizeForFuzzy(landName)) : '';
  return { matchedByIpn: false, key, similarity: sim };
}

// ── Pre-indexed matching for O(n*m) → near-O(n) lookups ──────────────────────

/**
 * Build a fuzzy-searchable index from a list of names.
 * Groups names by their first 2-character prefix (after normalization)
 * for approximate O(1) bucket lookups instead of scanning all names.
 *
 * This is used internally by buildOwnerIndex.
 */
interface OwnerEntry {
  taxId: string;
  nameRaw: string;
  nameNorm: string;  // result of normalizeForFuzzy
  nameSorted: string; // result of tokenSortName(nameNorm)
  prefixes: string[]; // 2-char prefixes of each token for bucketing
}

export interface OwnerIndex {
  byTaxId: Map<string, OwnerEntry[]>;
  byPrefix: Map<string, OwnerEntry[]>;
  all: OwnerEntry[];
}

/**
 * Build an owner index from a list of records for efficient matching.
 * Each record must have taxId, ownerNameRaw, and ownerNameNorm fields.
 */
export function buildOwnerIndex(
  records: Array<{ taxId: string; ownerNameRaw: string; ownerNameNorm: string }>,
): OwnerIndex {
  const byTaxId = new Map<string, OwnerEntry[]>();
  const byPrefix = new Map<string, OwnerEntry[]>();
  const all: OwnerEntry[] = [];

  for (const rec of records) {
    const nameNorm = normalizeForFuzzy(rec.ownerNameNorm || rec.ownerNameRaw);
    const nameSorted = tokenSortName(nameNorm);
    const tokens = nameNorm.split(' ').filter((t) => t.length > 0);
    const prefixes = tokens
      .map((t) => t.substring(0, 3))
      .filter((p) => p.length >= 2);

    const entry: OwnerEntry = {
      taxId: rec.taxId,
      nameRaw: rec.ownerNameRaw,
      nameNorm,
      nameSorted,
      prefixes,
    };

    all.push(entry);

    // Index by tax ID
    if (rec.taxId) {
      if (!byTaxId.has(rec.taxId)) byTaxId.set(rec.taxId, []);
      byTaxId.get(rec.taxId)!.push(entry);
    }

    // Index by all token prefixes (for fuzzy bucket lookup)
    for (const prefix of prefixes) {
      if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
      byPrefix.get(prefix)!.push(entry);
    }
  }

  return { byTaxId, byPrefix, all };
}

/**
 * Find matches for a given owner in an index.
 * Returns all entries with similarity >= threshold.
 *
 * Uses prefix-bucketing to avoid O(n) full scans in most cases.
 */
export function findMatches(
  taxId: string,
  nameRaw: string,
  nameNorm: string,
  index: OwnerIndex,
  threshold: number = 0.82,
): Array<{ entry: OwnerEntry; similarity: number; matchedByIpn: boolean }> {
  const results: Array<{
    entry: OwnerEntry;
    similarity: number;
    matchedByIpn: boolean;
  }> = [];

  // IPN-priority: exact tax ID match
  if (taxId) {
    const ipnMatches = index.byTaxId.get(taxId);
    if (ipnMatches) {
      for (const entry of ipnMatches) {
        results.push({ entry, similarity: 1.0, matchedByIpn: true });
      }
      return results; // IPN match is definitive — don't check names
    }
  }

  // No IPN match — fall back to fuzzy name matching
  const queryNorm = normalizeForFuzzy(nameNorm || nameRaw);
  const queryTokens = queryNorm.split(' ').filter((t) => t.length > 0);
  const queryPrefixes = queryTokens
    .map((t) => t.substring(0, 3))
    .filter((p) => p.length >= 2);

  // Collect candidate entries from prefix buckets
  // Count how many prefixes each candidate shares with query — more = better
  const candidateHits = new Map<OwnerEntry, number>();
  for (const prefix of queryPrefixes) {
    const bucket = index.byPrefix.get(prefix);
    if (bucket) {
      for (const entry of bucket) {
        if (taxId && entry.taxId && taxId !== entry.taxId) continue;
        candidateHits.set(entry, (candidateHits.get(entry) ?? 0) + 1);
      }
    }
  }

  // Filter: keep candidates that share at least 1 prefix
  // (for 3-token names like "Іваненко Олег Михайлович", 1 prefix hit is enough)
  const candidates = new Set<OwnerEntry>();
  for (const [entry, hits] of candidateHits) {
    candidates.add(entry);
  }

  // If prefix buckets returned NO candidates at all, try a broader search
  // using 2-char prefixes as fallback
  if (candidates.size === 0) {
    const broadPrefixes = queryTokens
      .map((t) => t.substring(0, 2))
      .filter((p) => p.length === 2);
    for (const prefix of broadPrefixes) {
      const bucket = index.byPrefix.get(prefix);
      if (bucket) {
        for (const entry of bucket) {
          if (taxId && entry.taxId && taxId !== entry.taxId) continue;
          candidates.add(entry);
        }
      }
    }
  }

  // Score each candidate — use pre-computed normalized names from index
  const querySorted = tokenSortName(queryNorm);
  const queryTokensSplit = queryNorm.split(' ').filter((t) => t.length > 0);

  for (const entry of candidates) {
    // Skip if both have IPN but different
    if (taxId && entry.taxId && taxId !== entry.taxId) continue;

    // Use pre-computed sorted names to avoid re-normalization
    const sim = _scorePrenormalized(
      queryNorm, querySorted, queryTokensSplit,
      entry.nameNorm, entry.nameSorted,
    );
    if (sim >= threshold) {
      results.push({ entry, similarity: sim, matchedByIpn: false });
    }
  }

  return results;
}

/**
 * Check if a given owner has ANY match in the index (fast boolean).
 */
export function hasMatch(
  taxId: string,
  nameRaw: string,
  nameNorm: string,
  index: OwnerIndex,
  threshold: number = 0.82,
): boolean {
  // IPN-priority
  if (taxId && index.byTaxId.has(taxId)) return true;

  // Fuzzy name
  const matches = findMatches(taxId, nameRaw, nameNorm, index, threshold);
  return matches.length > 0;
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
