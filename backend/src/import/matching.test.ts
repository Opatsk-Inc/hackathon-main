/**
 * matching.test.ts — Manual test suite for the fuzzy matching algorithm.
 *
 * Run: npx tsx backend/src/import/matching.test.ts
 */

import {
  normalizeForFuzzy,
  tokenSortName,
  fuzzyNameSimilarity,
  resolveOwnerKey,
  detectAreaUnit,
  buildOwnerIndex,
  hasMatch,
  findMatches,
} from './matching';

// ── Test runner ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.error(`  ❌ ${label}${details ? ` — ${details}` : ''}`);
  }
}

function describe(label: string, fn: () => void) {
  console.log(`\n${label}`);
  fn();
}

// ── normalizeForFuzzy tests ──────────────────────────────────────────────────

describe('normalizeForFuzzy', () => {
  assert(
    normalizeForFuzzy('Іваненко Олег') === normalizeForFuzzy('Iваненко Олег'),
    'Latin I → Cyrillic І (OCR lookalike)',
    `"${normalizeForFuzzy('Іваненко Олег')}" vs "${normalizeForFuzzy('Iваненко Олег')}"`,
  );

  assert(
    normalizeForFuzzy("Д'яченко") === normalizeForFuzzy('Дяченко'),
    'Apostrophe is stripped',
    `"${normalizeForFuzzy("Д'яченко")}" vs "${normalizeForFuzzy('Дяченко')}"`,
  );

  assert(
    normalizeForFuzzy('Євгенія') === normalizeForFuzzy('Евгенія'),
    'є → е equivalence',
    `"${normalizeForFuzzy('Євгенія')}" vs "${normalizeForFuzzy('Евгенія')}"`,
  );

  assert(
    normalizeForFuzzy('Олексій') === normalizeForFuzzy('Олексий'),
    'і → и equivalence',
    `"${normalizeForFuzzy('Олексій')}" vs "${normalizeForFuzzy('Олексий')}"`,
  );

  assert(
    normalizeForFuzzy('Коваленко-Петренко') === normalizeForFuzzy('Коваленко Петренко'),
    'Hyphen stripped, treated as space separation',
    `"${normalizeForFuzzy('Коваленко-Петренко')}" vs "${normalizeForFuzzy('Коваленко Петренко')}"`,
  );

  assert(
    normalizeForFuzzy('') === '',
    'Empty string → empty string',
  );

  assert(
    normalizeForFuzzy('  Тест  ') === normalizeForFuzzy('Тест'),
    'Whitespace trimmed',
  );
});

// ── tokenSortName tests ──────────────────────────────────────────────────────

describe('tokenSortName', () => {
  assert(
    tokenSortName('олег михайлович іваненко') === tokenSortName('іваненко олег михайлович'),
    'Token order independence',
    `"${tokenSortName('олег михайлович іваненко')}" vs "${tokenSortName('іваненко олег михайлович')}"`,
  );

  assert(tokenSortName('') === '', 'Empty string');
  assert(tokenSortName('одне') === 'одне', 'Single token');
});

// ── fuzzyNameSimilarity tests ────────────────────────────────────────────────

describe('fuzzyNameSimilarity — identical names', () => {
  const sim = fuzzyNameSimilarity('Іваненко Олег Михайлович', 'Іваненко Олег Михайлович');
  assert(sim === 1.0, `Exact match → 1.0 (got ${sim})`);
});

describe('fuzzyNameSimilarity — word order', () => {
  const sim = fuzzyNameSimilarity('Іваненко Олег Михайлович', 'Олег Михайлович Іваненко');
  assert(sim >= 0.95, `Word order swap → ≥0.95 (got ${sim.toFixed(3)})`);
});

describe('fuzzyNameSimilarity — OCR lookalike (Latin I)', () => {
  const sim = fuzzyNameSimilarity('Іваненко Олег', 'Iваненко Олег');
  assert(sim >= 0.98, `Latin I → ≥0.98 (got ${sim.toFixed(3)})`);
});

describe('fuzzyNameSimilarity — є/е variation', () => {
  const sim = fuzzyNameSimilarity('Євгенія Петрівна', 'Евгенія Петрівна');
  assert(sim >= 0.95, `є/е → ≥0.95 (got ${sim.toFixed(3)})`);
});

describe('fuzzyNameSimilarity — minor typo (1 char difference)', () => {
  const sim = fuzzyNameSimilarity('Іваненко Олег Михайлович', 'Іваненко Олег Михаулович');
  assert(sim >= 0.90, `1-char typo → ≥0.90 (got ${sim.toFixed(3)})`);
});

describe('fuzzyNameSimilarity — abbreviated patronymic', () => {
  const sim = fuzzyNameSimilarity('Іваненко Олег Михайлович', 'Іваненко О. М.');
  assert(sim >= 0.5, `Abbreviated → ≥0.50 (got ${sim.toFixed(3)}) [initials matching]`);
});

describe('fuzzyNameSimilarity — completely different people', () => {
  const sim = fuzzyNameSimilarity('Іваненко Олег Михайлович', 'Петренко Ганна Василівна');
  assert(sim < 0.6, `Different people → <0.60 (got ${sim.toFixed(3)})`);
});

describe('fuzzyNameSimilarity — empty strings', () => {
  assert(fuzzyNameSimilarity('', '') === 1.0, 'Both empty → 1.0');
  assert(fuzzyNameSimilarity('Тест', '') === 0.0, 'One empty → 0.0');
  assert(fuzzyNameSimilarity('', 'Тест') === 0.0, 'Other empty → 0.0');
});

describe('fuzzyNameSimilarity — short names', () => {
  const sim = fuzzyNameSimilarity('Коваль Іван', 'Коваль Іван');
  assert(sim === 1.0, `Short exact → 1.0 (got ${sim.toFixed(3)})`);

  const sim2 = fuzzyNameSimilarity('Коваль Іван', 'Ковалъ Іван');
  assert(sim2 >= 0.85, `Short with ь/ъ → ≥0.85 (got ${sim2.toFixed(3)})`);
});

// ── resolveOwnerKey tests ────────────────────────────────────────────────────

describe('resolveOwnerKey — IPN match', () => {
  const res = resolveOwnerKey('1234567890', 'Тест А', '1234567890', 'Тест Б');
  assert(res.matchedByIpn === true, 'Matched by IPN');
  assert(res.similarity === 1.0, 'Similarity 1.0');
  assert(res.key === '1234567890', `Key is IPN (got ${res.key})`);
});

describe('resolveOwnerKey — IPN mismatch (different people)', () => {
  const res = resolveOwnerKey('1234567890', 'Тест А', '9876543210', 'Тест А');
  assert(res.matchedByIpn === false, 'Not matched by IPN');
  assert(res.similarity === 0.0, 'Similarity 0.0 (different IPNs = different people)');
  assert(res.key === '', 'Empty key');
});

describe('resolveOwnerKey — no IPN, fuzzy name match', () => {
  const res = resolveOwnerKey('', 'Іваненко Олег Михайлович', '', 'Iваненко Олег Михайлович');
  assert(res.matchedByIpn === false, 'Not matched by IPN');
  assert(res.similarity >= 0.9, `Similarity ≥0.90 (got ${res.similarity.toFixed(3)})`);
  assert(res.key.length > 0, 'Non-empty key');
});

describe('resolveOwnerKey — one has IPN, fuzzy name fallback', () => {
  const res = resolveOwnerKey('1234567890', 'Іваненко Олег', '', 'Іваненко Олег Михайлович');
  assert(res.matchedByIpn === false, 'Not matched by IPN');
  assert(res.similarity >= 0.65, `Similarity ≥0.65 (got ${res.similarity.toFixed(3)}) — partial name match via tokens`);
});

// ── Indexed matching tests ───────────────────────────────────────────────────

describe('buildOwnerIndex + hasMatch — IPN lookup', () => {
  const index = buildOwnerIndex([
    { taxId: '111', ownerNameRaw: 'Тест А', ownerNameNorm: 'тест а' },
    { taxId: '222', ownerNameRaw: 'Тест Б', ownerNameNorm: 'тест б' },
    { taxId: '', ownerNameRaw: 'Ковальчук Ганна', ownerNameNorm: 'ковальчук ганна' },
  ]);

  assert(
    hasMatch('111', 'Тест А', 'тест а', index) === true,
    'IPN match found',
  );
  assert(
    hasMatch('999', 'Невідомий', 'невідомий', index) === false,
    'IPN not found, no name match',
  );
});

describe('buildOwnerIndex + hasMatch — fuzzy name lookup', () => {
  const index = buildOwnerIndex([
    { taxId: '', ownerNameRaw: 'Іваненко Олег Михайлович', ownerNameNorm: 'іваненко олег михайлович' },
  ]);

  assert(
    hasMatch('', 'Iваненко Олег Михайлович', 'iваненко олег михайлович', index) === true,
    'Fuzzy match: Latin I → found',
  );
  assert(
    hasMatch('', 'Петренко Ганна', 'петренко ганна', index) === false,
    'Different person → not found',
  );
});

describe('buildOwnerIndex + findMatches — returns similarity scores', () => {
  const index = buildOwnerIndex([
    { taxId: '', ownerNameRaw: 'Іваненко Олег Михайлович', ownerNameNorm: 'іваненко олег михайлович' },
    { taxId: '', ownerNameRaw: 'Іваненко Олег Іванович', ownerNameNorm: 'іваненко олег іванович' },
  ]);

  const matches = findMatches('', 'Іваненко Олег Михайлович', 'іваненко олег михайлович', index, 0.82);
  assert(matches.length >= 1, `At least 1 match found (got ${matches.length})`);

  const exact = matches.find((m) => m.similarity === 1.0);
  assert(exact !== undefined, 'Exact match has similarity 1.0');
});

// ── detectAreaUnit tests ─────────────────────────────────────────────────────

describe('detectAreaUnit', () => {
  assert(detectAreaUnit([0.5, 1.2, 3.0, 0.8]) === 'ha', 'Small values → hectares');
  assert(detectAreaUnit([500, 1200, 3000, 800]) === 'm2', 'Large values → m²');
  assert(detectAreaUnit([]) === 'm2', 'Empty → default m²');
  assert(detectAreaUnit([0, 0, 0]) === 'm2', 'All zeros → default m²');
});

// ── Real-world test cases ────────────────────────────────────────────────────

describe('Real-world Ukrainian name variations', () => {
  // Common OCR/encoding issues in Ukrainian registries
  const cases: Array<{ a: string; b: string; expectedMin: number; label: string }> = [
    {
      a: 'ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ "АГРОФІРМА"',
      b: 'ТОВ "АГРОФІРМА"',
      expectedMin: 0.4,
      label: 'Full legal form vs abbreviation (ТОВ = abbreviation — hard case)',
    },
    {
      a: 'Іванов Петро Степанович',
      b: 'Иванов Петро Степанович',
      expectedMin: 0.9,
      label: 'І/И confusion (Russian И in Ukrainian document)',
    },
    {
      a: "Кузьменко Олександр В'ячеславович",
      b: 'Кузьменко Олександр Вячеславович',
      expectedMin: 0.95,
      label: "Apostrophe in В'ячеславович",
    },
    {
      a: 'Ковальчук   Марія   Іванівна',
      b: 'Ковальчук Марія Іванівна',
      expectedMin: 0.99,
      label: 'Extra spaces',
    },
    {
      a: 'Шевченко Тарас Григорович',
      b: 'шевченко тарас григорович',
      expectedMin: 0.99,
      label: 'Case difference',
    },
  ];

  for (const { a, b, expectedMin, label } of cases) {
    const sim = fuzzyNameSimilarity(a, b);
    assert(sim >= expectedMin, `${label}: ≥${expectedMin} (got ${sim.toFixed(3)})`);
  }
});

describe('Real-world — names that should NOT match', () => {
  const cases: Array<{ a: string; b: string; expectedMax: number; label: string }> = [
    {
      a: 'Іваненко Олег Михайлович',
      b: 'Іваненко Тетяна Андріївна',
      expectedMax: 0.75,
      label: 'Same surname, different person',
    },
    {
      a: 'Коваленко Іван',
      b: 'Ковальчук Петро',
      expectedMax: 0.6,
      label: 'Similar surname prefix but different people',
    },
  ];

  for (const { a, b, expectedMax, label } of cases) {
    const sim = fuzzyNameSimilarity(a, b);
    assert(sim < expectedMax, `${label}: <${expectedMax} (got ${sim.toFixed(3)})`);
  }
});

// ── Performance test ─────────────────────────────────────────────────────────

describe('Performance — indexed matching on 10k records', () => {
  const generateRecords = (count: number) => {
    const surnames = ['Іваненко', 'Петренко', 'Коваленко', 'Шевченко', 'Бондаренко',
      'Ковальчук', 'Ткаченко', 'Кравченко', 'Олійник', 'Шевчук'];
    const names = ['Олег', 'Петро', 'Іван', 'Марія', 'Ганна',
      'Тетяна', 'Олександр', 'Андрій', 'Сергій', 'Наталія'];
    const patronymics = ['Михайлович', 'Петрович', 'Іванович', 'Олександрович', 'Андрійович'];

    return Array.from({ length: count }, (_, i) => {
      const s = surnames[i % surnames.length];
      const n = names[Math.floor(i / surnames.length) % names.length];
      const p = patronymics[Math.floor(i / (surnames.length * names.length)) % patronymics.length];
      const fullName = `${s} ${n} ${p}`;
      return {
        taxId: i < count / 2 ? `${1000000000 + i}` : '',
        ownerNameRaw: fullName,
        ownerNameNorm: fullName.toLowerCase(),
      };
    });
  };

  const records = generateRecords(10000);
  const start = Date.now();
  const index = buildOwnerIndex(records);
  const buildTime = Date.now() - start;
  assert(buildTime < 5000, `Index build < 5s (got ${buildTime}ms)`);

  const searchStart = Date.now();
  let matchCount = 0;
  // Test 1000 lookups
  for (let i = 0; i < 1000; i++) {
    const rec = records[i * 10];
    if (hasMatch(rec.taxId, rec.ownerNameRaw, rec.ownerNameNorm, index, 0.82)) {
      matchCount++;
    }
  }
  const searchTime = Date.now() - searchStart;
  assert(searchTime < 60000, `1000 lookups < 60s (got ${searchTime}ms) — worst-case: 10 unique surnames in 10k records`);
  assert(matchCount > 0, `Found matches: ${matchCount}`);
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('═'.repeat(60));

if (failed > 0) {
  process.exit(1);
}
