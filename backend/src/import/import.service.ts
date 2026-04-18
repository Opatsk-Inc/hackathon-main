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
  taxId: string;       // normalized
  ownerNameRaw: string;
  ownerNameNorm: string; // normalized
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
        if (!row.taxId && !row.ownerNameNorm) return false; // nothing to identify the owner
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
    userId: number,
    file: Express.Multer.File,
    baseTaxRate: number,
    hromadaId?: string,
  ) {
    if (!file?.buffer) throw new BadRequestException('File is required');

    const isXlsx =
      file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('excel') ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls');

    const rows = isXlsx ? this.parseXlsx(file.buffer) : this.parseCsv(file.buffer);

    if (!rows.length) throw new BadRequestException('File contains no valid rows');

    const batch = await this.prisma.importBatch.create({
      data: { userId, fileName: file.originalname, rowsCount: rows.length, hromadaId: hromadaId ?? null },
    });

    // Load land record identifiers for the target hromada into memory — avoids N+1 queries
    const landRecords = await this.prisma.landRecord.findMany({
      where: hromadaId ? { hromadaId } : {},
      select: { taxId: true, ownerNameNorm: true },
    });

    const landTaxIds = new Set(landRecords.map((r) => r.taxId).filter(Boolean));
    const landNames = new Set(landRecords.map((r) => r.ownerNameNorm).filter(Boolean));

    this.logger.log(`Loaded ${landRecords.length} land records for matching (hromadaId=${hromadaId ?? 'all'})`);

    // Bulk insert real estate records
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

    // Detect anomalies using in-memory Sets — O(1) lookup per row
    const anomalyData: {
      batchId: string; hromadaId: string | null; type: AnomalyType; severity: string;
      description: string; status: AnomalyStatus; taxId: string; suspectName: string;
      address: string; lat: number | null; lng: number | null; potentialFine: number;
    }[] = [];

    for (const row of rows) {
      const matched =
        (row.taxId && landTaxIds.has(row.taxId)) ||
        (row.ownerNameNorm && landNames.has(row.ownerNameNorm));

      if (!matched) {
        const potentialFine = row.area > 120 ? (row.area - 120) * baseTaxRate : 0;

        anomalyData.push({
          batchId: batch.id,
          hromadaId: hromadaId ?? null,
          type: AnomalyType.MISSING_IN_LAND,
          severity: potentialFine > 5000 ? 'HIGH' : potentialFine > 1000 ? 'MEDIUM' : 'LOW',
          description: `Нерухомість знайдена для ${row.ownerNameRaw} (ЄДРПОУ: ${row.taxId}), але відповідного земельного запису не існує.`,
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

    if (anomalyData.length) {
      await this.prisma.anomaly.createMany({ data: anomalyData });
    }

    return { ...batch, anomaliesFound: anomalyData.length };
  }
}
