import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';
import { AnomalyType, AnomalyStatus } from '@prisma/client';
import {
  buildOwnerIndex,
  hasMatch,
  isTargetAddress,
} from './matching';

// ── Spatial context configuration ────────────────────────────────────────────
//
// TARGET_SETTLEMENT — settlement being audited (lowercase Ukrainian).
//   An address that explicitly mentions this name is always kept, even if it
//   also contains an excluded keyword.
//
// EXCLUDE_SETTLEMENTS — urban centres outside the target community whose
//   addresses should be silently dropped from the RE dataset before matching.
//   Owners who have land in this hromada but also own property elsewhere
//   (e.g. an apartment in Сокаль) would otherwise generate false-positive
//   MISSING_IN_LAND and AREA_MISMATCH anomalies.
//
// ⚙ Adjust all lists for each hromada you audit.
const TARGET_SETTLEMENT = 'бендюга';
const EXCLUDE_SETTLEMENTS: string[] = [
  'сокаль', 'львів', 'червоноград', 'нестеров', 'жовква',
  'дрогобич', 'стрий', 'борислав', 'трускавець',
];

// IGNORE_OBJECT_TYPES — RE object types excluded from all land-mismatch analysis.
// Apartments never have a land plot under them, so they are noise for land-registry checks.
const IGNORE_OBJECT_TYPES: string[] = ['квартира'];

// IGNORE_EDRPOU — ЄДРПОУ codes of state/municipal bodies that own land or buildings
// in their administrative capacity and must never appear as audit violators.
const IGNORE_EDRPOU: Set<string> = new Set([
  '1748150820', // Червоноградська міська рада
]);

// ── Shared normalization (must match seed.ts) ────────────────────────────────

/** Strip non-digits and leading zeros: "01 254 925 171" → "1254925171" */
export function normalizeTaxId(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .replace(/^0+/, '');
}

/**
 * Canonical name form used for cross-registry matching.
 * Handles Cyrillic Unicode variants, apostrophe variants, and extra whitespace.
 */
export function normalizeName(raw: unknown): string {
  if (!raw) return '';
  return String(raw)
    .normalize('NFC')
    .toLowerCase()
    // unify all apostrophe/quote variants → standard ASCII apostrophe
    .replace(/[''ʼ`´ʻ]/g, "'")
    // unify dash/hyphen variants
    .replace(/[–—−]/g, '-')
    // collapse any whitespace sequence
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse Excel serial date numbers AND real Date objects coming from cellDates:true */
function parseExcelDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const n = Number(val);
  if (!isNaN(n) && n > 1000) {
    // Excel epoch: 1 Jan 1900 = serial 1 (with Lotus 1-2-3 leap-year bug)
    const ms = (n - 25569) * 86400 * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d;
}

// ── Row interface ─────────────────────────────────────────────────────────────

interface RealEstateRow {
  taxId: string;
  ownerNameRaw: string;
  ownerNameNorm: string;
  objectType: string;
  address: string;
  area: number;
  ownershipEnd: Date | null;
}

// ── Matching threshold constant ───────────────────────────────────────────────

/**
 * Minimum fuzzy similarity for owner name matching.
 * 0.82 is lower than the original 0.85 to catch more legitimate matches
 * like abbreviated patronymics (Олег Мих. vs Олег Михайлович).
 * The composite scoring with bigram + token-set + initials detection
 * means this lower threshold doesn't increase false positives.
 */
const MATCH_THRESHOLD = 0.82;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geo: GeoService,
  ) { }

  private parseXlsx(buffer: Buffer): RealEstateRow[] {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    return raw
      .map((row): RealEstateRow => {
        const ownerNameRaw = String(
          row['Власник'] ?? row['owner_name'] ?? row['ПІБ'] ?? row['Назва платника'] ?? '',
        ).trim();

        const areaRaw = row['Площа'] ?? row['area'] ?? row['Площа, кв.м'] ?? row['Загальна площа'] ?? row['Розмір частки у праві спільної власності'];
        const area = parseFloat(String(areaRaw ?? '0').replace(',', '.')) || 0;

        return {
          taxId: normalizeTaxId(row['ЄДРПОУ'] ?? row['tax_id'] ?? row['ІПН'] ?? row['Податковий номер ПП']),
          ownerNameRaw,
          ownerNameNorm: normalizeName(ownerNameRaw),
          objectType: String(row["Тип об'єкта"] ?? row['object_type'] ?? row['Тип'] ?? '').trim(),
          address: String(row['Адреса'] ?? row['address'] ?? row["Адреса об'єкта"] ?? '').trim(),
          area,
          ownershipEnd:
            parseExcelDate(row['Дата закінчення']) ??
            parseExcelDate(row['Дата держ. реєстр. прип. права власн']),
        };
      })
      .filter((row) => {
        if (!row.taxId && !row.ownerNameNorm) return false;
        if (!row.address) {
          this.logger.warn(`Skipping row — no address: taxId=${row.taxId} name=${row.ownerNameRaw}`);
          return false;
        }
        if (row.area <= 0) {
          this.logger.warn(`Skipping row — zero/negative area: taxId=${row.taxId}`);
          return false;
        }
        return true;
      });
  }

  private parseCsv(buffer: Buffer): RealEstateRow[] {
    const csvText = buffer.toString('utf-8');
    const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (errors.length) {
      this.logger.warn(`CSV parse warnings: ${errors.map((e) => e.message).join(', ')}`);
    }

    return data
      .map((row): RealEstateRow => {
        const ownerNameRaw = (row['owner_name'] ?? '').trim();
        const area = parseFloat((row['area'] ?? '0').replace(',', '.')) || 0;

        return {
          taxId: normalizeTaxId(row['tax_id']),
          ownerNameRaw,
          ownerNameNorm: normalizeName(ownerNameRaw),
          objectType: (row['object_type'] ?? '').trim(),
          address: (row['address'] ?? '').trim(),
          area,
          ownershipEnd: parseExcelDate(row['ownership_end']),
        };
      })
      .filter((row) => {
        if (!row.taxId && !row.ownerNameNorm) return false;
        if (!row.address) return false;
        if (row.area <= 0) return false;
        return true;
      });
  }

  async importRealEstate(
    hromadaId: string,
    file: Express.Multer.File,
  ) {
    const baseTaxRate = 120;
    if (!file?.buffer) throw new BadRequestException('File is required');

    const isXlsx =
      file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('excel') ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls');

    const parsedRows = isXlsx ? this.parseXlsx(file.buffer) : this.parseCsv(file.buffer);

    // ── Spatial filter: drop RE records from outside the target community ──────
    // Removes properties located in excluded settlements (e.g. Сокаль apartments)
    // that would generate false-positive MISSING_IN_LAND / AREA_MISMATCH anomalies
    // for owners who happen to have land in the target hromada but live elsewhere.
    const allRows = parsedRows.filter((r) =>
      isTargetAddress(r.address, TARGET_SETTLEMENT, EXCLUDE_SETTLEMENTS),
    );

    if (parsedRows.length !== allRows.length) {
      this.logger.log(
        `Spatial filter: dropped ${parsedRows.length - allRows.length} out-of-scope RE rows ` +
        `(target="${TARGET_SETTLEMENT}", excluded=${EXCLUDE_SETTLEMENTS.join(', ')}); ` +
        `${allRows.length} rows remain`,
      );
    }

    // ── Object-type filter: drop apartments — they never have land under them ───
    const beforeTypeFilter = allRows.length;
    const analyzableRows = allRows.filter((r) => {
      const t = r.objectType.toLowerCase().normalize('NFC');
      return !IGNORE_OBJECT_TYPES.some((ignored) => t.includes(ignored.toLowerCase()));
    });

    if (analyzableRows.length !== beforeTypeFilter) {
      this.logger.log(
        `Object-type filter: dropped ${beforeTypeFilter - analyzableRows.length} apartment rows; ` +
        `${analyzableRows.length} rows remain for land analysis`,
      );
    }

    if (!analyzableRows.length) throw new BadRequestException('File contains no valid rows');

    // ── 1. Fetch hromada ───────────────────────────────────────────────────────
    const hromada = await this.prisma.hromada.findUnique({ where: { id: hromadaId } });
    if (!hromada) throw new BadRequestException('Громаду не знайдено');

    // Get a center point for the hromada once to allow jittering coordinates for the map
    const hromadaCenter = await this.geo.geocodeAddress(`${hromada.name}, ${hromada.region}, Україна`)
      || { lat: 50.39, lng: 24.23 }; // Fallback to Chervonohrad if geocoding fails

    // ── 2. Load land records for this hromada (they define who "belongs" here) ─
    const landRecords = await this.prisma.landRecord.findMany({
      where: { hromadaId },
      select: { taxId: true, ownerNameNorm: true, ownerNameRaw: true, address: true, area: true },
    });

    if (!landRecords.length) {
      throw new BadRequestException(`Для громади "${hromada.name}" відсутні земельні записи. Спочатку завантажте дані земельного кадастру.`);
    }

    this.logger.log(`Loaded ${landRecords.length} land records for hromadaId=${hromadaId}`);

    // ── 3. Build indexed lookups for BOTH sides ────────────────────────────────
    //    Instead of O(n*m) nested loops, we index by taxId + name prefixes
    //    for near-O(n) matching.

    // Pass address to every record so tier-3 (address-based) matching is available
    const landIndex = buildOwnerIndex(
      landRecords.map((r) => ({ taxId: r.taxId, ownerNameRaw: r.ownerNameRaw, ownerNameNorm: r.ownerNameNorm, address: r.address })),
    );
    const reIndex = buildOwnerIndex(
      analyzableRows.map((r) => ({ taxId: r.taxId, ownerNameRaw: r.ownerNameRaw, ownerNameNorm: r.ownerNameNorm, address: r.address })),
    );

    this.logger.log(
      `Built indexes: land=${landRecords.length} entries, ` +
      `RE=${analyzableRows.length} entries, ` +
      `land taxIds=${landIndex.byTaxId.size}, RE taxIds=${reIndex.byTaxId.size}`,
    );

    // ── 4. Scope real estate rows to THIS hromada ─────────────────────────────
    //    Keep only RE rows whose owner also appears in the land registry here.
    //    Uses indexed matching: IPN first, then fuzzy name with prefix-bucketing.

    const matchedSet = new Set<RealEstateRow>();

    for (const row of analyzableRows) {
      // Tier 1 IPN → Tier 2 name → Tier 3 address (all via hasMatch cascade)
      if (hasMatch(row.taxId, row.ownerNameRaw, row.ownerNameNorm, landIndex, MATCH_THRESHOLD, row.address)) {
        matchedSet.add(row);
      }
    }

    const rows = [...matchedSet];

    this.logger.log(`Matched ${rows.length} real estate rows for hromadaId=${hromadaId} (file had ${analyzableRows.length} analyzable rows)`);

    // ── 5. (Removed clearing of old data so we keep history) ──────────────────

    // ── 6. Create new batch ───────────────────────────────────────────────────
    const batch = await this.prisma.importBatch.create({
      data: { hromadaId, fileName: file.originalname, rowsCount: rows.length },
    });

    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      await this.prisma.realEstateRecord.createMany({
        data: rows.slice(i, i + BATCH).map((row) => ({
          batchId: batch.id,
          taxId: row.taxId,
          ownerNameRaw: row.ownerNameRaw,
          ownerNameNorm: row.ownerNameNorm,
          objectType: row.objectType,
          address: row.address,
          area: row.area,
          ownershipEnd: row.ownershipEnd,
        })),
      });
    }

    // ── 7. Build RE index from MATCHED rows for anomaly detection ─────────────
    const matchedReIndex = buildOwnerIndex(
      rows.map((r) => ({ taxId: r.taxId, ownerNameRaw: r.ownerNameRaw, ownerNameNorm: r.ownerNameNorm, address: r.address })),
    );

    const anomalyData: {
      batchId: string; hromadaId: string; type: AnomalyType; severity: string;
      description: string; status: AnomalyStatus; taxId: string; suspectName: string;
      address: string; lat: number | null; lng: number | null; potentialFine: number;
    }[] = [];

    // ── 8. MISSING_IN_REAL_ESTATE: land owner in this hromada has no real estate
    const seenLandOwners = new Set<string>();
    for (const land of landRecords) {
      const key = land.taxId || land.ownerNameNorm;
      if (!key || seenLandOwners.has(key)) continue;
      seenLandOwners.add(key);

      // Skip state/municipal bodies — they legitimately own land without buildings
      if (land.taxId && IGNORE_EDRPOU.has(land.taxId)) continue;

      // Cascade: IPN → name → address
      const hasRE = hasMatch(
        land.taxId,
        land.ownerNameRaw,
        land.ownerNameNorm,
        matchedReIndex,
        MATCH_THRESHOLD,
        land.address,
      );

      if (!hasRE) {
        const potentialFine = land.area > 0 ? land.area * 10000 * baseTaxRate : 0;
        anomalyData.push({
          batchId: batch.id,
          hromadaId,
          type: AnomalyType.MISSING_IN_REAL_ESTATE,
          severity: potentialFine > 5000 ? 'HIGH' : potentialFine > 1000 ? 'MEDIUM' : 'LOW',
          description: `Землекористувач ${land.ownerNameRaw} (ІПН: ${land.taxId}) має земельну ділянку в громаді, але відсутній у реєстрі нерухомості.`,
          status: AnomalyStatus.NEW,
          taxId: land.taxId,
          suspectName: land.ownerNameRaw,
          address: land.address,
          lat: hromadaCenter.lat + (Math.random() - 0.5) * 0.04,
          lng: hromadaCenter.lng + (Math.random() - 0.5) * 0.04,
          potentialFine,
        });
      }
    }

    // ── 9. NO_ACTIVE_REAL_RIGHTS: ownership already ended ─────────────────────
    const now = new Date();
    for (const row of rows) {
      if (row.taxId && IGNORE_EDRPOU.has(row.taxId)) continue;
      if (row.ownershipEnd && row.ownershipEnd < now) {
        anomalyData.push({
          batchId: batch.id,
          hromadaId,
          type: AnomalyType.NO_ACTIVE_REAL_RIGHTS,
          severity: 'MEDIUM',
          description: `Право власності ${row.ownerNameRaw} (ІПН: ${row.taxId}) на об'єкт "${row.objectType}" закінчилось ${row.ownershipEnd.toLocaleDateString('uk-UA')}.`,
          status: AnomalyStatus.NEW,
          taxId: row.taxId,
          suspectName: row.ownerNameRaw,
          address: row.address,
          lat: hromadaCenter.lat + (Math.random() - 0.5) * 0.04,
          lng: hromadaCenter.lng + (Math.random() - 0.5) * 0.04,
          potentialFine: 0,
        });
      }
    }

    // ── 10. MISSING_IN_LAND: real estate owner has no land record ─────────────
    const seenREOwners = new Set<string>();
    for (const row of rows) {
      const key = row.taxId || row.ownerNameNorm;
      if (!key || seenREOwners.has(key)) continue;
      seenREOwners.add(key);

      // Skip state/municipal bodies — their buildings don't require private land title
      if (row.taxId && IGNORE_EDRPOU.has(row.taxId)) continue;

      // Cascade: IPN → name → address
      const hasLand = hasMatch(
        row.taxId,
        row.ownerNameRaw,
        row.ownerNameNorm,
        landIndex,
        MATCH_THRESHOLD,
        row.address,
      );

      if (!hasLand) {
        const potentialFine = row.area > 0 ? row.area * baseTaxRate * 0.5 : 0;
        anomalyData.push({
          batchId: batch.id,
          hromadaId,
          type: AnomalyType.MISSING_IN_LAND,
          severity: potentialFine > 3000 ? 'HIGH' : potentialFine > 800 ? 'MEDIUM' : 'LOW',
          description: `Власник нерухомості ${row.ownerNameRaw} (ІПН: ${row.taxId}) відсутній у земельному кадастрі громади.`,
          status: AnomalyStatus.NEW,
          taxId: row.taxId,
          suspectName: row.ownerNameRaw,
          address: row.address,
          lat: hromadaCenter.lat + (Math.random() - 0.5) * 0.04,
          lng: hromadaCenter.lng + (Math.random() - 0.5) * 0.04,
          potentialFine,
        });
      }
    }

    if (anomalyData.length) {
      await this.prisma.anomaly.createMany({ data: anomalyData });
    }

    return { ...batch, anomaliesFound: anomalyData.length };
  }
}
