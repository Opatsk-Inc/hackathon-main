# Алгоритм пошуку розбіжностей (Land vs Real Estate)

## What This Is

Система для виявлення аномалій між земельним кадастром і реєстром нерухомості громади. Порівнює два Excel-файли (земельні ділянки і об'єкти нерухомості), знаходить людей із розбіжностями у площах, відсутніми записами та прострочиними правами власності. Використовується податковими інспекторами громад в Україні.

## Core Value

Точне розпізнавання однієї і тієї самої особи в двох реєстрах — без хибних збігів і пропусків — навіть якщо ім'я або ІПН записані по-різному.

## Requirements

### Validated

- ✓ Парсинг Excel (XLSX/XLS) та CSV файлів — existing
- ✓ Нормалізація ІПН (видалення пробілів, ведучих нулів) — existing
- ✓ 4 типи аномалій: MISSING_IN_REAL_ESTATE, MISSING_IN_LAND, NO_ACTIVE_REAL_RIGHTS, AREA_MISMATCH — existing
- ✓ Скоуп по громаді (тільки власники цієї громади) — existing (але з багами)
- ✓ Генерація документів "Направлення на перевірку" — existing

### Active

- [ ] **MATCH-01**: Fuzzy-matching імен — розпізнавати ту саму особу навіть при різниці в написанні (е/є, и/і, OCR-помилки, пробіли)
- [ ] **MATCH-02**: Token-based порівняння ПІБ — збіг незалежно від порядку складових імені
- [ ] **MATCH-03**: ІПН як пріоритетний ключ — коли ІПН є в обох файлах, лише він визначає збіг; ім'я — запасний варіант
- [ ] **AREA-01**: Агрегація площ — сумувати всі ділянки/об'єкти одного власника перед порівнянням, не порівнювати по одному запису
- [ ] **AREA-02**: Усунення захардкодженого множника `* 10000` — автодетект одиниць (га vs м²) або конфігурований параметр
- [ ] **SCOPE-01**: Застосування нового fuzzy-matching у скоупінгу по громаді (matchedSet)
- [ ] **QUAL-01**: Confidence score для кожного збігу — показувати наскільки впевнений алгоритм у знайденій парі

### Out of Scope

- ML/NLP моделі для matching — надмірна складність для даного обсягу даних; достатньо детермінованого алгоритму
- Зміна формату Excel-файлів — формати визначені зовнішніми реєстрами
- Matching по адресі — адреси записані дуже по-різному, ненадійний ключ

## Context

**Існуюча реалізація (`backend/src/import/import.service.ts`):**
- Нормалізація імені: `normalizeName()` — lowercase, уніфікація апострофів/тире, trim. Але порівняння суворо точне (Map lookup)
- Нормалізація ІПН: `normalizeTaxId()` — видаляє не-цифри та ведучі нулі. Працює добре
- Matching: двоступеневий — спочатку по `taxId`, потім по `ownerNameNorm`. Але обидва — точні збіги
- `AREA_MISMATCH`: множить `land.area * 10000` (припускає, що земля в га), бере перший `find()` — не агрегує

**Проблема**: точний string lookup в Map не прощає жодного символу. В українських реєстрах часті варіанти: `Іваненко Олег Михайлович` vs `Iваненко Олег Михайлович` (латинська I), або `є` vs `е`.

## Constraints

- **Tech stack**: NestJS + TypeScript — рішення тільки в рамках існуючого стеку
- **Performance**: файли можуть містити десятки тисяч рядків — O(n²) алгоритми неприйнятні
- **No external deps**: не додавати важкі ML-бібліотеки; бажано чисті TS-функції або легкий npm-пакет (напр. `fastest-levenshtein`)
- **Backward compat**: не ламати існуючі API endpoints і структуру БД

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| ІПН — пріоритетний ключ, ім'я — запасний | ІПН унікальний і точний, ім'я — ненадійне | — Pending |
| Token-sort + Levenshtein для імен | Простий детермінований підхід, без ML, швидкий | — Pending |
| Агрегація перед порівнянням площ | Власник може мати кілька ділянок/об'єктів | — Pending |
| Confidence score замість bool | Дозволяє налаштувати поріг і бачити сумнівні збіги | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-18 after initialization*
