# Roadmap: Land vs Real Estate Matching Algorithm

## Overview

A focused brownfield fix to `import.service.ts`. Phase 1 replaces the broken exact-match algorithm with fuzzy matching, token-sort comparison, IPN priority, and correct area aggregation — making discrepancy detection reliable. Phase 2 adds confidence scores so inspectors know how certain each match is.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Reliable Matching** - Replace exact string lookup with fuzzy matching, token-sort, IPN priority, area aggregation, and community scope fix
- [ ] **Phase 2: Confidence Scoring** - Attach match confidence scores to every detected pair so inspectors can evaluate result quality

## Phase Details

### Phase 1: Reliable Matching
**Goal**: The algorithm correctly identifies the same person across both registries even when names or IPN values are written inconsistently
**Depends on**: Nothing (first phase)
**Requirements**: MATCH-01, MATCH-02, MATCH-03, AREA-01, AREA-02, SCOPE-01
**Success Criteria** (what must be TRUE):
  1. Two records with the same IPN but slightly different name spellings are matched as one person
  2. Two records with no IPN but names in different word order ("Іваненко Олег Михайлович" vs "Олег Михайлович Іваненко") are matched as one person
  3. Two records with names that differ only in е/є, и/і, or latin/cyrillic lookalikes are matched with ≥ 85% similarity threshold
  4. Area comparison aggregates all parcels for a single owner before comparing, not record-by-record
  5. Community scoping (matchedSet) uses the same fuzzy logic, so no community member is silently dropped before anomaly detection
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Core matching utilities (normalizeForFuzzy, tokenSortName, fuzzyNameSimilarity, resolveOwnerKey, detectAreaUnit)
- [ ] 01-02-PLAN.md — Fix importRealEstate (matchedSet fuzzy scoping, IPN-priority MISSING checks, aggregated AREA_MISMATCH)

### Phase 2: Confidence Scoring
**Goal**: Every matched person pair carries a numeric confidence score inspectors can use to judge result reliability
**Depends on**: Phase 1
**Requirements**: QUAL-01
**Success Criteria** (what must be TRUE):
  1. Each anomaly result includes a `matchConfidence` field with a value between 0.0 and 1.0
  2. IPN-matched pairs always have `matchConfidence` of 1.0
  3. Fuzzy name-matched pairs have `matchConfidence` reflecting the actual similarity score (e.g. 0.91 for a near-exact name match)
  4. Existing API response shape is preserved — `matchConfidence` is additive, nothing breaks
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Reliable Matching | 0/2 | Not started | - |
| 2. Confidence Scoring | 0/TBD | Not started | - |
