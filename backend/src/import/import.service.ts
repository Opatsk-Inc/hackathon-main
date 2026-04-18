import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';
import { AnomalyType, AnomalyStatus } from '@prisma/client';

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

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geo: GeoService,
  ) {}

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

    const allRows = isXlsx ? this.parseXlsx(file.buffer) : this.parseCsv(file.buffer);

    if (!allRows.length) throw new BadRequestException('File contains no valid rows');

    // ── 1. Fetch hromada ───────────────────────────────────────────────────────
    const hromada = await this.prisma.hromada.findUnique({ where: { id: hromadaId } });
    if (!hromada) throw new BadRequestException('Громаду не знайдено');

    // ── 2. Load land records for this hromada (they define who "belongs" here) ─
    const landRecords = await this.prisma.landRecord.findMany({
      where: { hromadaId },
      select: { taxId: true, ownerNameNorm: true, ownerNameRaw: true, address: true, area: true },
    });

    if (!landRecords.length) {
      throw new BadRequestException(`Для громади "${hromada.name}" відсутні земельні записи. Спочатку завантажте дані земельного кадастру.`);
    }

    this.logger.log(`Loaded ${landRecords.length} land records for hromadaId=${hromadaId}`);

    // ── 3. Build lookup from real estate file (no address filter — real estate
    //       records contain only street addresses, not community names) ─────────
    const reByTaxId = new Map<string, RealEstateRow[]>();
    const reByName  = new Map<string, RealEstateRow[]>();

    for (const row of allRows) {
      if (row.taxId) {
        if (!reByTaxId.has(row.taxId)) reByTaxId.set(row.taxId, []);
        reByTaxId.get(row.taxId)!.push(row);
      }
      if (row.ownerNameNorm) {
        if (!reByName.has(row.ownerNameNorm)) reByName.set(row.ownerNameNorm, []);
        reByName.get(row.ownerNameNorm)!.push(row);
      }
    }

    // ── 4. Scope real estate rows to THIS hromada:
    //       keep only rows whose owner also appears in the land registry here ───
    const matchedSet = new Set<RealEstateRow>();
    for (const land of landRecords) {
      const byTaxId: RealEstateRow[] = (land.taxId ? reByTaxId.get(land.taxId) : undefined) ?? [];
      const byName: RealEstateRow[]  = (land.ownerNameNorm ? reByName.get(land.ownerNameNorm) : undefined) ?? [];
      for (const row of [...byTaxId, ...byName]) matchedSet.add(row);
    }
    const rows = [...matchedSet];

    this.logger.log(`Matched ${rows.length} real estate rows for hromadaId=${hromadaId} (file had ${allRows.length} total rows)`);

    // ── 5. Clear old data for this hromada ────────────────────────────────────
    await this.prisma.anomaly.deleteMany({ where: { hromadaId } });
    await this.prisma.realEstateRecord.deleteMany({ where: { batch: { hromadaId } } });
    await this.prisma.importBatch.deleteMany({ where: { hromadaId } });

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

    // ── 7. Build sets of real estate owners for fast reverse lookup ───────────
    const reTaxIds = new Set(rows.map((r) => r.taxId).filter(Boolean));
    const reNames  = new Set(rows.map((r) => r.ownerNameNorm).filter(Boolean));

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

      const hasRE =
        (land.taxId && reTaxIds.has(land.taxId)) ||
        (land.ownerNameNorm && reNames.has(land.ownerNameNorm));

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
          lat: null,
          lng: null,
          potentialFine,
        });
      }
    }

    // ── 9. NO_ACTIVE_REAL_RIGHTS: ownership already ended ─────────────────────
    const now = new Date();
    for (const row of rows) {
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
          lat: null,
          lng: null,
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

      const hasLand = landRecords.some(
        (land) =>
          (row.taxId && land.taxId === row.taxId) ||
          (row.ownerNameNorm && land.ownerNameNorm === row.ownerNameNorm),
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
          lat: null,
          lng: null,
          potentialFine,
        });
      }
    }

    // ── 11. AREA_MISMATCH: area difference > 10% ──────────────────────────────
    for (const row of rows) {
      const matchingLand = landRecords.find(
        (land) =>
          (row.taxId && land.taxId === row.taxId) ||
          (row.ownerNameNorm && land.ownerNameNorm === row.ownerNameNorm),
      );

      if (matchingLand && matchingLand.area > 0 && row.area > 0) {
        const landAreaM2 = matchingLand.area * 10000;
        const diff = Math.abs(landAreaM2 - row.area);
        const diffPercent = (diff / landAreaM2) * 100;

        if (diffPercent > 5) {
          const potentialFine = diff * baseTaxRate * 0.3;
          anomalyData.push({
            batchId: batch.id,
            hromadaId,
            type: AnomalyType.AREA_MISMATCH,
            severity: diffPercent > 50 ? 'HIGH' : diffPercent > 25 ? 'MEDIUM' : 'LOW',
            description: `Розбіжність площ для ${row.ownerNameRaw} (ІПН: ${row.taxId}): земля ${landAreaM2.toFixed(1)} м², нерухомість ${row.area.toFixed(1)} м² (різниця ${diffPercent.toFixed(1)}%).`,
            status: AnomalyStatus.NEW,
            taxId: row.taxId,
            suspectName: row.ownerNameRaw,
            address: row.address,
            lat: null,
            lng: null,
            potentialFine,
          });
        }
      }
    }

    if (anomalyData.length) {
      await this.prisma.anomaly.createMany({ data: anomalyData });
    }

    return { ...batch, anomaliesFound: anomalyData.length };
  }
}
