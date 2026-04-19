# Land Registry Audit System

Automated platform for Ukrainian local governments to detect property tax discrepancies by cross-referencing land cadastre and real estate registries.

## Overview

The system identifies tax violations by matching two datasets:
- **Land Cadastre**: Land plots with ownership details
- **Real Estate Registry**: Buildings and structures

It detects owners with land but no buildings, buildings without land, expired ownership rights, and area mismatches.

## Architecture

### Backend
- **Stack**: NestJS, TypeScript, PostgreSQL, Prisma ORM
- **Algorithm**: Three-tier cascade matching (Tax ID → Fuzzy Name → Address)
- **Performance**: O(n) complexity via indexed lookups, handles 10K+ rows efficiently

### Frontend
- **Stack**: React 19, TypeScript, Vite, Tailwind CSS v4
- **UI**: Shadcn UI, Radix UI components
- **State**: TanStack Query (async), Zustand (global state)
- **Users**: Desktop dashboard for analysts, mobile PWA for field inspectors

## Key Features

### Matching Algorithm

**Tier 1: Tax ID Match**
- Exact match on normalized IPN/ЄДРПОУ
- Highest confidence, O(1) lookup

**Tier 2: Fuzzy Name Match**
- Composite scoring: Levenshtein + bigram + token-set + initials
- Handles Cyrillic variants, apostrophes, abbreviated patronymics
- Threshold: 0.82 (configurable)
- Prefix-bucketed indexing for performance

**Tier 3: Address Match**
- Normalizes Ukrainian addresses (street types, building numbers)
- Token-based similarity with building number validation
- Threshold: 0.72

### Anomaly Types

1. **MISSING_IN_REAL_ESTATE**: Landowner has no registered buildings
2. **MISSING_IN_LAND**: Property owner has no registered land
3. **NO_ACTIVE_REAL_RIGHTS**: Ownership rights expired
4. **AREA_MISMATCH**: Area discrepancies between registries

Each includes severity (HIGH/MEDIUM/LOW), potential fine calculation, and GPS coordinates.

### Spatial Filtering

Configurable settlement filters prevent false positives from out-of-scope properties:
```typescript
const TARGET_SETTLEMENT = 'бендюга';
const EXCLUDE_SETTLEMENTS = ['сокаль', 'львів', 'червоноград'];
```

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configure DATABASE_URL, JWT_SECRET
npm run migrate:dev
npm run start:dev
```

### Frontend
```bash
cd front
npm install
npm run dev
```

## Configuration

### Spatial Context
Edit `backend/src/import/import.service.ts`:
```typescript
const TARGET_SETTLEMENT = 'бендюга';
const EXCLUDE_SETTLEMENTS = ['сокаль', 'львів'];
const IGNORE_OBJECT_TYPES = ['квартира'];
const IGNORE_EDRPOU = new Set(['1748150820']);
```

### Matching Thresholds
Edit `backend/src/import/matching.ts`:
```typescript
const MATCH_THRESHOLD = 0.82;        // Name matching
export const ADDRESS_THRESHOLD = 0.72; // Address matching
```

## API Endpoints

### Authentication
- `POST /auth/login` - Authenticate hromada user

### Import
- `POST /import/real-estate` - Upload and process real estate registry

### Dashboard
- `GET /admin/dashboard` - Metrics and statistics
- `GET /admin/anomalies` - List anomalies with filtering
- `POST /admin/assign-task` - Assign to inspector

### Mobile
- `GET /mobile/tasks/:token` - Get assigned tasks (magic link)
- `POST /mobile/resolve/:id` - Submit inspection result

### AI
- `GET /recommendations/:anomalyId` - Get AI recommendation (Groq)

## File Formats

### Land Cadastre (CSV/XLSX)
Required columns: `ІПН/ЄДРПОУ`, `Власник`, `Адреса`, `Площа`, `Кадастровий номер`

### Real Estate (CSV/XLSX)
Required columns: `ІПН/ЄДРПОУ`, `Власник`, `Адреса`, `Площа`, `Тип об'єкта`

## Performance

- Handles 10,000+ row datasets in 15-30 seconds
- O(n) matching complexity via prefix-bucketed indexes
- Batch processing: 500 rows per transaction
- Automatic geocoding with coordinate jittering

## Tech Stack

**Backend**: NestJS 11, TypeScript 5, PostgreSQL 14, Prisma 7, Passport JWT, Helmet, Papa Parse, XLSX

**Frontend**: React 19, Vite 7, TypeScript 5.9, Tailwind CSS v4, TanStack Query v5, Zustand v5, Shadcn UI, Radix UI, Recharts, MapLibre GL

## License

Proprietary - Developed for Ukrainian local government use

## Team

Built by Team Programatyvna Shlaypa during hackathon
