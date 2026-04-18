import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';
import { AnomalyType, AnomalyStatus } from '@prisma/client';

interface RealEstateRow {
  taxId: string;
  ownerNameRaw: string;
  objectType: string;
  address: string;
  area: number;
  ownershipEnd: Date | null;
}

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

    return raw.map((row) => ({
      taxId: String(row['ЄДРПОУ'] ?? row['tax_id'] ?? row['ІПН'] ?? '').trim(),
      ownerNameRaw: String(row['Власник'] ?? row['owner_name'] ?? row['ПІБ'] ?? '').trim(),
      objectType: String(row['Тип об\'єкта'] ?? row['object_type'] ?? row['Тип'] ?? '').trim(),
      address: String(row['Адреса'] ?? row['address'] ?? '').trim(),
      area: Number(row['Площа'] ?? row['area'] ?? row['Площа, кв.м'] ?? 0) || 0,
      ownershipEnd: row['Дата закінчення'] ? new Date(String(row['Дата закінчення'])) : null,
    }));
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

    return data.map((row) => ({
      taxId: (row['tax_id'] ?? '').trim(),
      ownerNameRaw: (row['owner_name'] ?? '').trim(),
      objectType: (row['object_type'] ?? '').trim(),
      address: (row['address'] ?? '').trim(),
      area: parseFloat(row['area'] ?? '0') || 0,
      ownershipEnd: row['ownership_end'] ? new Date(row['ownership_end']) : null,
    }));
  }

  async importRealEstate(
    userId: number,
    file: Express.Multer.File,
    baseTaxRate: number,
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
      data: { userId, fileName: file.originalname, rowsCount: rows.length },
    });

    let anomaliesFound = 0;

    for (const row of rows) {
      if (!row.taxId && !row.ownerNameRaw) continue;

      const ownerNameNorm = row.ownerNameRaw.toLowerCase().trim().replace(/\s+/g, ' ');

      await this.prisma.realEstateRecord.create({
        data: {
          batchId: batch.id,
          taxId: row.taxId,
          ownerNameRaw: row.ownerNameRaw,
          ownerNameNorm,
          objectType: row.objectType,
          address: row.address,
          area: row.area,
          ownershipEnd: row.ownershipEnd,
        },
      });

      const landMatch = await this.prisma.landRecord.findFirst({
        where: {
          OR: [
            ...(row.taxId ? [{ taxId: row.taxId }] : []),
            ...(ownerNameNorm ? [{ ownerNameNorm }] : []),
          ],
        },
      });

      if (!landMatch) {
        const potentialFine = row.area > 120 ? (row.area - 120) * baseTaxRate : 0;
        const coords = await this.geo.geocodeAddress(row.address);

        await this.prisma.anomaly.create({
          data: {
            batchId: batch.id,
            type: AnomalyType.MISSING_IN_LAND,
            severity: potentialFine > 5000 ? 'HIGH' : potentialFine > 1000 ? 'MEDIUM' : 'LOW',
            description: `Нерухомість знайдена для ${row.ownerNameRaw} (ЄДРПОУ: ${row.taxId}), але відповідного земельного запису не існує.`,
            status: AnomalyStatus.NEW,
            taxId: row.taxId,
            suspectName: row.ownerNameRaw,
            address: row.address,
            lat: coords?.lat ?? null,
            lng: coords?.lng ?? null,
            potentialFine,
          },
        });

        anomaliesFound++;
      }
    }

    return { ...batch, anomaliesFound };
  }
}
