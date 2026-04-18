/**
 * matching.ts — Fuzzy-matching and unit-detection utilities.
 *
 * All functions here are pure (no I/O, no DB access) and can be unit-tested independently.
 * normalizeName and normalizeTaxId remain in import.service.ts — not duplicated here.
 *
 * Matching cascade (three tiers):
 *   Tier 1 — IPN exact match         (definitive, highest confidence)
 *   Tier 2 — Fuzzy name match         (composite Levenshtein + bigram + token-set + initials)
 *   Tier 3 — Normalised address match (street name tokens + building number; last resort)
 */

import { normalizeName } from './import.service';

// ── Lookalike substitution map (Latin→Cyrillic) ──────────────────────────────

const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: 'а', b: 'в', e: 'е', i: 'і', k: 'к', m: 'м',
  n: 'н', o: 'о', p: 'р', c: 'с', t: 'т', x: 'х', y: 'у',
};

const PHONETIC_EQUIVALENCES: Record<string, string> = {
  є: 'е', і: 'и', ї: 'и', ґ: 'г', ё: 'е', ъ: '', ь: '',
};

// ── Character-level normalization pipeline ────────────────────────────────────

function applyCharMaps(s: string): string {
  let r = '';
  for (const ch of s) r += LATIN_TO_CYRILLIC[ch] ?? ch;
  let r2 = '';
  for (const ch of r) r2 += PHONETIC_EQUIVALENCES[ch] ?? ch;
  return r2;
}

// ── Name normalisation ────────────────────────────────────────────────────────

export function normalizeForFuzzy(name: string): string {
  if (!name) return '';
  const s = applyCharMaps(normalizeName(name));
  return s.replace(/-/g, ' ').replace(/'/g, '').replace(/\s+/g, ' ').trim();
}

export function tokenSortName(normalized: string): string {
  if (!normalized) return '';
  return normalized.split(' ').filter((t) => t.length > 0).sort().join(' ');
}

// ── Address normalisation ─────────────────────────────────────────────────────

/**
 * Street-type abbreviation → canonical short form.
 * Applied on already-lowercased text.
 */
const STREET_TYPE_MAP: Record<string, string> = {
  вулиця: 'вул', проспект: 'пр', просп: 'пр',
  провулок: 'пров', бульвар: 'бул', площа: 'пл',
  шосе: 'шос', мікрорайон: 'мкр', набережна: 'наб',
  алея: 'ал', узвіз: 'узв', тупик: 'туп',
};

// Tokens that should be removed from address before comparison
const ADDR_STOP = new Set([
  'вул', 'пр', 'пров', 'бул', 'пл', 'шос', 'мкр', 'наб', 'ал', 'узв', 'туп',
  'буд', 'будинок', 'б', 'д', 'корп', 'корпус', 'літ', 'ліст',
  'ім', 'імені', 'імени', 'с', 'м', 'смт',
]);

/**
 * Normalise a Ukrainian postal address for fuzzy comparison:
 *   1. Lowercase + Unicode NFC
 *   2. Lookalike and phonetic substitution
 *   3. Strip apartment / corpus / litera suffixes
 *   4. Expand full street-type words to canonical abbreviations
 *   5. Strip trailing dots from abbreviations (вул. → вул)
 *   6. Strip "імені" and similar prepositions
 *   7. Collapse punctuation to spaces
 */
export function normalizeAddress(raw: string): string {
  if (!raw) return '';

  let s = raw.toLowerCase().normalize('NFC')
    .replace(/[''ʼ`´ʻ]/g, "'")
    .replace(/[–—−]/g, '-');

  s = applyCharMaps(s);

  // Strip apartment numbers: "кв. 3", "кв 3а"
  s = s.replace(/\b(кв|кімн?|квартира)\b[\s.,]*\d+\s*[а-яa-z]?/g, '');
  // Strip corpus / litera: "корп. 2", "літ. А"
  s = s.replace(/\b(корп|корпус|літ|ліст)\b[\s.,]*[\dа-яa-z]*/g, '');

  // Expand full street-type words → canonical abbr
  for (const [full, abbr] of Object.entries(STREET_TYPE_MAP)) {
    s = s.replace(new RegExp(`\\b${full}\\b`, 'g'), abbr);
  }

  // Strip dots after abbreviations (вул. → вул, пр. → пр)
  s = s.replace(/\b(вул|пр|пров|бул|пл|шос|мкр|наб|ал|узв|туп)\./g, '$1');

  // Strip "буд." / "б." / "д." that immediately precede a number
  s = s.replace(/\b(буд|б|д)\.\s*(?=\d)/g, '');
  s = s.replace(/\bбудинок\s+(?=\d)/g, '');

  // Strip "імені" etc.
  s = s.replace(/\bімен[іи]\b/g, '');

  // Punctuation → spaces, then collapse
  s = s.replace(/[.,;:!?()\[\]{}'"-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

/**
 * Extract the building number from a normalised address string.
 * Returns empty string if not found.
 *
 * Patterns detected:
 *   "вул франка 5"       → "5"
 *   "вул перемоги 24а"   → "24а"
 *   "вул шевченка 10 3"  → "10"   (first standalone number)
 *   "вул шевченка 5/7"   → "5/7"
 */
function extractBuildingNum(normalized: string): string {
  // After a comma (most common: "вул. Франка, 5")
  const afterComma = normalized.match(/,\s*(\d+\s*[а-яa-z]?\s*(?:\/\s*\d+)?)\s*(?:[,\s]|$)/);
  if (afterComma) return afterComma[1].replace(/\s+/g, '').toLowerCase();

  // Last standalone number-like token at end of string
  const atEnd = normalized.match(/\s(\d+\s*[а-яa-z]?(?:\/\d+)?)\s*$/);
  if (atEnd) return atEnd[1].replace(/\s+/g, '').toLowerCase();

  return '';
}

/**
 * Extract the meaningful street name tokens (no type abbr, no building number, no stop words).
 * These are the tokens used for street-level similarity.
 */
function streetTokens(normalized: string): string[] {
  const buildingNum = extractBuildingNum(normalized);
  const numRe = /^\d+[а-яa-z]?(?:\/\d+)?$/;

  return normalized
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .filter((t) => !ADDR_STOP.has(t))
    .filter((t) => !numRe.test(t))
    .filter((t) => !buildingNum || t !== buildingNum);
}

/**
 * Similarity score [0.0, 1.0] between two Ukrainian addresses.
 *
 * Strategy:
 *   - If building numbers are both present and differ → 0.05 (almost certainly different property)
 *   - Otherwise: tokenSetSimilarity on street name tokens (+0.15 bonus for matching building number)
 *
 * A score ≥ ADDRESS_THRESHOLD (0.72) is considered a match.
 */
export function addressSimilarity(a: string, b: string): number {
  if (!a || !b) return 0.0;

  const normA = normalizeAddress(a);
  const normB = normalizeAddress(b);

  if (!normA || !normB) return 0.0;
  if (normA === normB) return 1.0;

  const buildA = extractBuildingNum(normA);
  const buildB = extractBuildingNum(normB);

  // Conflicting building numbers → not the same property
  if (buildA && buildB && buildA !== buildB) return 0.05;

  const toksA = streetTokens(normA);
  const toksB = streetTokens(normB);

  if (toksA.length === 0 || toksB.length === 0) {
    // Fall back to bigram similarity on the full normalised string
    return bigramSimilarity(normA, normB) * 0.7;
  }

  const streetSim = tokenSetSimilarity(toksA, toksB);
  const buildBonus = buildA && buildB && buildA === buildB ? 0.15 : 0;
  return Math.min(1.0, streetSim + buildBonus);
}

export const ADDRESS_THRESHOLD = 0.72;

// ── Levenshtein distance ──────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  if (la > lb) return levenshtein(b, a);

  const dp = new Array<number>(la + 1);
  for (let i = 0; i <= la; i++) dp[i] = i;
  for (let j = 1; j <= lb; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= la; i++) {
      const temp = dp[i];
      dp[i] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i], dp[i - 1]);
      prev = temp;
    }
  }
  return dp[la];
}

// ── Bigram similarity (Dice coefficient) ─────────────────────────────────────

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
    intersection += Math.min(countA, bigramsB.get(bg) ?? 0);
  }
  return (2.0 * intersection) / (a.length - 1 + (b.length - 1));
}

// ── Token-level matching ──────────────────────────────────────────────────────

function initialsMatchScore(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;
  const [long, short] =
    tokensA.join('').length >= tokensB.join('').length
      ? [tokensA, tokensB] : [tokensB, tokensA];

  let fullMatches = 0, initialMatches = 0;
  const usedLong = new Set<number>();

  for (const st of short) {
    let matched = false;
    for (let li = 0; li < long.length; li++) {
      if (usedLong.has(li)) continue;
      if (st === long[li]) {
        fullMatches++; usedLong.add(li); matched = true; break;
      }
      if (st.length <= 2 && long[li].startsWith(st)) {
        initialMatches++; usedLong.add(li); matched = true; break;
      }
    }
    if (!matched) return 0.0;
  }
  if (fullMatches === 0) return 0.0;
  return Math.min(1.0, (fullMatches * 1.0 + initialMatches * 0.7) / Math.max(long.length, short.length));
}

function tokenSetSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;
  const [shorter, longer] =
    tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];

  let totalScore = 0;
  const usedIndices = new Set<number>();
  for (const tokenS of shorter) {
    let bestScore = 0, bestIdx = -1;
    for (let i = 0; i < longer.length; i++) {
      if (usedIndices.has(i)) continue;
      const maxLen = Math.max(tokenS.length, longer[i].length);
      if (maxLen === 0) continue;
      const sim = 1 - levenshtein(tokenS, longer[i]) / maxLen;
      if (sim > bestScore) { bestScore = sim; bestIdx = i; }
    }
    if (bestIdx >= 0) { usedIndices.add(bestIdx); totalScore += bestScore; }
  }
  return totalScore / Math.max(shorter.length, longer.length);
}

// ── Fuzzy name similarity ─────────────────────────────────────────────────────

export function fuzzyNameSimilarity(a: string, b: string): number {
  const emptyA = !a || a.trim().length === 0;
  const emptyB = !b || b.trim().length === 0;
  if (emptyA && emptyB) return 1.0;
  if (emptyA || emptyB) return 0.0;

  const normA = normalizeForFuzzy(a);
  const normB = normalizeForFuzzy(b);
  if (normA === normB) return 1.0;

  const lenRatio = Math.min(normA.length, normB.length) / Math.max(normA.length, normB.length);
  if (lenRatio < 0.3) return lenRatio * 0.5;

  const sortedA = tokenSortName(normA);
  const sortedB = tokenSortName(normB);
  const dist = levenshtein(sortedA, sortedB);
  const levSim = Math.max(sortedA.length, sortedB.length) > 0
    ? 1 - dist / Math.max(sortedA.length, sortedB.length) : 0;

  if (levSim >= 0.95) return levSim;

  const bigramSim = bigramSimilarity(sortedA, sortedB);
  let best = Math.max(levSim, bigramSim);

  if (best < 0.82) {
    const tokensA = normA.split(' ').filter((t) => t.length > 0);
    const tokensB = normB.split(' ').filter((t) => t.length > 0);
    best = Math.max(best, tokenSetSimilarity(tokensA, tokensB));
    if (best < 0.82) best = Math.max(best, initialsMatchScore(tokensA, tokensB));
  }
  return best;
}

function _scorePrenormalized(
  normA: string, sortedA: string, tokensA: string[],
  normB: string, sortedB: string,
): number {
  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const lenRatio = Math.min(normA.length, normB.length) / Math.max(normA.length, normB.length);
  if (lenRatio < 0.3) return lenRatio * 0.5;

  const dist = levenshtein(sortedA, sortedB);
  const levSim = Math.max(sortedA.length, sortedB.length) > 0
    ? 1 - dist / Math.max(sortedA.length, sortedB.length) : 0;
  if (levSim >= 0.95) return levSim;

  const bigramSim = bigramSimilarity(sortedA, sortedB);
  let best = Math.max(levSim, bigramSim);

  if (best < 0.82) {
    const tokensB = normB.split(' ').filter((t) => t.length > 0);
    best = Math.max(best, tokenSetSimilarity(tokensA, tokensB));
    if (best < 0.82) best = Math.max(best, initialsMatchScore(tokensA, tokensB));
  }
  return best;
}

// ── Owner key resolution ──────────────────────────────────────────────────────

export interface OwnerKeyResult {
  matchedByIpn: boolean;
  key: string;
  similarity: number;
}

export function resolveOwnerKey(
  landTaxId: string, landName: string,
  reTaxId: string, reName: string,
): OwnerKeyResult {
  const bothHaveIpn = landTaxId.length > 0 && reTaxId.length > 0;
  if (bothHaveIpn) {
    if (landTaxId === reTaxId) return { matchedByIpn: true, key: landTaxId, similarity: 1.0 };
    return { matchedByIpn: false, key: '', similarity: 0.0 };
  }
  const sim = fuzzyNameSimilarity(landName, reName);
  const key = sim >= 0.82 ? tokenSortName(normalizeForFuzzy(landName)) : '';
  return { matchedByIpn: false, key, similarity: sim };
}

// ── Pre-indexed matching ──────────────────────────────────────────────────────

interface OwnerEntry {
  taxId: string;
  nameRaw: string;
  nameNorm: string;
  nameSorted: string;
  prefixes: string[];
  /** Normalised address for tier-3 matching. Empty string when not available. */
  addressNorm: string;
  /** First significant street token (for address bucket indexing). */
  addressBucketKey: string;
}

export interface OwnerIndex {
  byTaxId: Map<string, OwnerEntry[]>;
  byPrefix: Map<string, OwnerEntry[]>;
  /** Indexed by first significant street name token (≥3 chars). */
  byAddressToken: Map<string, OwnerEntry[]>;
  all: OwnerEntry[];
}

/**
 * Build an owner index for efficient cascading lookups.
 * Each record may optionally provide an `address` field — when present it enables
 * tier-3 (address-based) matching as a last resort.
 */
export function buildOwnerIndex(
  records: Array<{ taxId: string; ownerNameRaw: string; ownerNameNorm: string; address?: string }>,
): OwnerIndex {
  const byTaxId = new Map<string, OwnerEntry[]>();
  const byPrefix = new Map<string, OwnerEntry[]>();
  const byAddressToken = new Map<string, OwnerEntry[]>();
  const all: OwnerEntry[] = [];

  for (const rec of records) {
    const nameNorm = normalizeForFuzzy(rec.ownerNameNorm || rec.ownerNameRaw);
    const nameSorted = tokenSortName(nameNorm);
    const tokens = nameNorm.split(' ').filter((t) => t.length > 0);
    const prefixes = tokens.map((t) => t.substring(0, 3)).filter((p) => p.length >= 2);

    const addressNorm = rec.address ? normalizeAddress(rec.address) : '';
    const addrTokens = addressNorm ? streetTokens(addressNorm) : [];
    // Use the longest significant address token as bucket key (usually the street name itself)
    const addressBucketKey = addrTokens.sort((a, b) => b.length - a.length)[0] ?? '';

    const entry: OwnerEntry = { taxId: rec.taxId, nameRaw: rec.ownerNameRaw, nameNorm, nameSorted, prefixes, addressNorm, addressBucketKey };

    all.push(entry);

    if (rec.taxId) {
      if (!byTaxId.has(rec.taxId)) byTaxId.set(rec.taxId, []);
      byTaxId.get(rec.taxId)!.push(entry);
    }

    for (const prefix of prefixes) {
      if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
      byPrefix.get(prefix)!.push(entry);
    }

    if (addressBucketKey.length >= 3) {
      const addrPrefix = addressBucketKey.substring(0, 4);
      if (!byAddressToken.has(addrPrefix)) byAddressToken.set(addrPrefix, []);
      byAddressToken.get(addrPrefix)!.push(entry);
    }
  }

  return { byTaxId, byPrefix, byAddressToken, all };
}

/**
 * Find all matches for an owner in the index using the three-tier cascade:
 *   Tier 1 — Exact IPN match
 *   Tier 2 — Fuzzy name match (prefix-bucketed)
 *   Tier 3 — Normalised address match (street token-bucketed) — only when address provided
 *
 * Returns entries sorted by descending similarity.
 */
export function findMatches(
  taxId: string,
  nameRaw: string,
  nameNorm: string,
  index: OwnerIndex,
  threshold: number = 0.82,
  address?: string,
): Array<{ entry: OwnerEntry; similarity: number; matchedByIpn: boolean; matchedByAddress: boolean }> {

  // ── Tier 1: IPN exact ──────────────────────────────────────────────────────
  if (taxId) {
    const ipnMatches = index.byTaxId.get(taxId);
    if (ipnMatches) {
      return ipnMatches.map((entry) => ({ entry, similarity: 1.0, matchedByIpn: true, matchedByAddress: false }));
    }
  }

  // ── Tier 2: Fuzzy name ────────────────────────────────────────────────────
  const queryNorm = normalizeForFuzzy(nameNorm || nameRaw);
  const queryTokens = queryNorm.split(' ').filter((t) => t.length > 0);
  const queryPrefixes = queryTokens.map((t) => t.substring(0, 3)).filter((p) => p.length >= 2);

  const candidateHits = new Map<OwnerEntry, number>();
  for (const prefix of queryPrefixes) {
    for (const entry of index.byPrefix.get(prefix) ?? []) {
      if (taxId && entry.taxId && taxId !== entry.taxId) continue;
      candidateHits.set(entry, (candidateHits.get(entry) ?? 0) + 1);
    }
  }

  if (candidateHits.size === 0) {
    // Broader 2-char prefix fallback
    for (const prefix of queryTokens.map((t) => t.substring(0, 2)).filter((p) => p.length === 2)) {
      for (const entry of index.byPrefix.get(prefix) ?? []) {
        if (taxId && entry.taxId && taxId !== entry.taxId) continue;
        candidateHits.set(entry, (candidateHits.get(entry) ?? 0) + 1);
      }
    }
  }

  const querySorted = tokenSortName(queryNorm);
  const nameResults: Array<{ entry: OwnerEntry; similarity: number; matchedByIpn: boolean; matchedByAddress: boolean }> = [];

  for (const entry of candidateHits.keys()) {
    if (taxId && entry.taxId && taxId !== entry.taxId) continue;
    const sim = _scorePrenormalized(queryNorm, querySorted, queryTokens, entry.nameNorm, entry.nameSorted);
    if (sim >= threshold) nameResults.push({ entry, similarity: sim, matchedByIpn: false, matchedByAddress: false });
  }

  if (nameResults.length > 0) return nameResults.sort((a, b) => b.similarity - a.similarity);

  // ── Tier 3: Address fuzzy ─────────────────────────────────────────────────
  if (!address) return [];

  const queryAddrNorm = normalizeAddress(address);
  const queryAddrTokens = streetTokens(queryAddrNorm);
  const queryAddrPrefixes = [...new Set(
    queryAddrTokens
      .filter((t) => t.length >= 3)
      .map((t) => t.substring(0, 4))
  )];

  const addrCandidates = new Set<OwnerEntry>();
  for (const prefix of queryAddrPrefixes) {
    for (const entry of index.byAddressToken.get(prefix) ?? []) {
      addrCandidates.add(entry);
    }
  }

  const addrResults: Array<{ entry: OwnerEntry; similarity: number; matchedByIpn: boolean; matchedByAddress: boolean }> = [];
  for (const entry of addrCandidates) {
    if (!entry.addressNorm) continue;
    const sim = addressSimilarity(queryAddrNorm, entry.addressNorm);
    if (sim >= ADDRESS_THRESHOLD) {
      addrResults.push({ entry, similarity: sim * 0.9, matchedByIpn: false, matchedByAddress: true });
    }
  }

  return addrResults.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Boolean shortcut: does ANY match exist for this owner in the index?
 *
 * Applies all three tiers. Provide `address` to enable tier-3 fallback.
 */
export function hasMatch(
  taxId: string,
  nameRaw: string,
  nameNorm: string,
  index: OwnerIndex,
  threshold: number = 0.82,
  address?: string,
): boolean {
  // Tier 1
  if (taxId && index.byTaxId.has(taxId)) return true;
  // Tier 2 + 3 (findMatches already cascades)
  return findMatches(taxId, nameRaw, nameNorm, index, threshold, address).length > 0;
}

// ── Spatial context filtering ─────────────────────────────────────────────────

/**
 * Returns false when an address is explicitly located in an excluded settlement,
 * suppressing false-positive anomalies for out-of-scope properties.
 *
 * Logic (in priority order):
 *   1. Address contains TARGET_SETTLEMENT → always in scope → true.
 *   2. Address contains any EXCLUDE_SETTLEMENT → out of scope → false.
 *   3. Ambiguous / no match → assumed in scope → true (avoids false negatives).
 *
 * Pass an empty target / empty array to disable the respective rule.
 */
export function isTargetAddress(
  address: string,
  targetSettlement: string,
  excludeSettlements: string[],
): boolean {
  if (!address) return true;
  const norm = address.toLowerCase().normalize('NFC');

  // Rule 1: explicit target keyword → always keep
  if (targetSettlement) {
    const tgt = targetSettlement.toLowerCase().normalize('NFC');
    if (norm.includes(tgt)) return true;
  }

  // Rule 2: explicit exclusion keyword → drop
  for (const excl of excludeSettlements) {
    if (excl && norm.includes(excl.toLowerCase().normalize('NFC'))) return false;
  }

  // Rule 3: ambiguous → keep
  return true;
}

// ── Area unit detection ───────────────────────────────────────────────────────

export function detectAreaUnit(sampleValues: number[]): 'ha' | 'm2' {
  const vals = sampleValues.filter((v) => v > 0);
  if (vals.length === 0) return 'm2';
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return median < 50 ? 'ha' : 'm2';
}
