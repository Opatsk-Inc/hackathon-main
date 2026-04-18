import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';
import { AnomalyType, AnomalyStatus } from '@prisma/client';

interface RealEstateRow {
  tax_id?: string;
  owner_name?: string;
  object_type?: string;
  address?: string;
  area?: string;
  ownership_end?: string;
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geo: GeoService,
  ) {}

  async importRealEstate(
    tenantId: string,
    file: Express.Multer.File,
    baseTaxRate: number,
  ) {
    if (!file?.buffer) throw new BadRequestException('CSV file is required');

    const csvText = file.buffer.toString('utf-8');
    const { data, errors } = Papa.parse<RealEstateRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (errors.length) {
      this.logger.warn(`CSV parse warnings: ${errors.map((e) => e.message).join(', ')}`);
    }

    const batch = await this.prisma.importBatch.create({
      data: { tenantId, fileName: file.originalname, rowsCount: data.length },
    });

    let anomaliesFound = 0;

    for (const row of data) {
      const taxId = row.tax_id?.trim() ?? '';
      const ownerNameRaw = row.owner_name?.trim() ?? '';
      const ownerNameNorm = ownerNameRaw.toLowerCase();
      const objectType = row.object_type?.trim() ?? '';
      const address = row.address?.trim() ?? '';
      const area = parseFloat(row.area ?? '0') || 0;
      const ownershipEnd = row.ownership_end ? new Date(row.ownership_end) : null;

      await this.prisma.realEstateRecord.create({
        data: {
          tenantId,
          batchId: batch.id,
          taxId,
          ownerNameRaw,
          ownerNameNorm,
          objectType,
          address,
          area,
          ownershipEnd,
        },
      });

      const landMatch = await this.prisma.landRecord.findFirst({
        where: {
          tenantId,
          OR: [{ taxId }, { ownerNameNorm }],
        },
      });

      if (!landMatch) {
        const potentialFine = area > 120 ? (area - 120) * baseTaxRate : 0;
        const coords = await this.geo.geocodeAddress(address);

        await this.prisma.anomaly.create({
          data: {
            tenantId,
            batchId: batch.id,
            type: AnomalyType.MISSING_IN_LAND,
            severity: potentialFine > 5000 ? 'HIGH' : potentialFine > 1000 ? 'MEDIUM' : 'LOW',
            description: `Real estate record found for ${ownerNameRaw} (taxId: ${taxId}), but no matching land record exists.`,
            status: AnomalyStatus.NEW,
            taxId,
            suspectName: ownerNameRaw,
            address,
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
