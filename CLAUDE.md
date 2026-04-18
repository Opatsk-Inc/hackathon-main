# Land vs Real Estate Matching Algorithm

## Project

Система виявлення аномалій між земельним кадастром і реєстром нерухомості громади (Україна).
Головний файл: `backend/src/import/import.service.ts`

See `.planning/PROJECT.md` for full context.

## GSD Workflow

This project uses GSD for structured execution.

- Roadmap: `.planning/ROADMAP.md`
- Requirements: `.planning/REQUIREMENTS.md`
- State: `.planning/STATE.md`

### Current Phase

Phase 1: Reliable Matching — Replace exact string lookup with fuzzy matching, token-sort, IPN priority, area aggregation.

### Next Step

```
/gsd-plan-phase 1
```

## Key Constraints

- NestJS + TypeScript — no stack changes
- No heavy ML deps — deterministic algorithm only (e.g. `fastest-levenshtein` is OK)
- Existing API endpoints must not break
- Files with tens of thousands of rows — O(n²) is unacceptable
