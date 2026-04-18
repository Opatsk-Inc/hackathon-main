import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';
import { AnomalyStatus } from '@prisma/client';
import { DashboardMetricsResponseDto } from './dto/response/dashboard-metrics.response.dto';
import { AnomalyListResponseDto } from './dto/response/anomaly-list.response.dto';
import { AssignTaskRequestDto } from './dto/request/assign-task.request.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geo: GeoService,
  ) {}

  async getDashboardMetrics(hromadaId: string): Promise<DashboardMetricsResponseDto> {
    const [anomalies, fineAgg, statusCounts] = await Promise.all([
      this.prisma.anomaly.findMany({
        where: { hromadaId },
        select: { type: true },
      }),
      this.prisma.anomaly.aggregate({
        where: { hromadaId },
        _sum: { potentialFine: true },
        _count: true,
      }),
      this.prisma.anomaly.groupBy({
        by: ['status'],
        where: { hromadaId },
        _count: { status: true },
      }),
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.status]),
    ) as Record<AnomalyStatus, number>;

    const typeMap = new Map<string, number>();
    for (const a of anomalies) {
      typeMap.set(a.type, (typeMap.get(a.type) ?? 0) + 1);
    }

    return {
      totalAnomalies: fineAgg._count,
      totalPotentialFine: fineAgg._sum.potentialFine ?? 0,
      newCount: statusMap[AnomalyStatus.NEW] ?? 0,
      inProgressCount: statusMap[AnomalyStatus.IN_PROGRESS] ?? 0,
      resolvedCount: statusMap[AnomalyStatus.RESOLVED] ?? 0,
      byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
    };
  }

  async getDiscrepancies(hromadaId: string, batchId?: string): Promise<AnomalyListResponseDto> {
    const where = {
      hromadaId,
      ...(batchId ? { batchId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.anomaly.findMany({ where, orderBy: { createdAt: 'desc' } }),
      this.prisma.anomaly.count({ where }),
    ]);

    return { items, total };
  }

  async getBatches(hromadaId: string) {
    const batches = await this.prisma.importBatch.findMany({
      where: { hromadaId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { anomalies: true } } },
    });
    return batches.map((b) => ({ ...b, anomalyCount: b._count.anomalies }));
  }

  async assignTask(hromadaId: string, dto: AssignTaskRequestDto) {
    const updated = await this.prisma.anomaly.updateMany({
      where: {
        hromadaId,
        id: { in: dto.anomalyIds },
      },
      data: { inspectorId: dto.inspectorId, status: AnomalyStatus.IN_PROGRESS },
    });

    this.geocodeAssignedAnomalies(dto.anomalyIds).catch((e) =>
      this.logger.error(`Background geocoding failed: ${e.message}`),
    );

    return { assigned: updated.count };
  }

  private async geocodeAssignedAnomalies(anomalyIds: string[]) {
    const anomalies = await this.prisma.anomaly.findMany({
      where: { id: { in: anomalyIds }, lat: null },
      select: { id: true, address: true, hromada: { select: { name: true, region: true } } },
    });

    for (const anomaly of anomalies) {
      await new Promise((r) => setTimeout(r, 1100));

      const fullAddress = [anomaly.address, anomaly.hromada?.name, anomaly.hromada?.region]
        .filter(Boolean)
        .join(', ');

      const coords = await this.geo.geocodeAddress(fullAddress);
      if (!coords) {
        this.logger.warn(`Geocoding returned no result for: "${fullAddress}"`);
        continue;
      }

      await this.prisma.anomaly.update({
        where: { id: anomaly.id },
        data: { lat: coords.lat, lng: coords.lng },
      });

      this.logger.log(`Geocoded anomaly ${anomaly.id}: ${coords.lat}, ${coords.lng}`);
    }
  }
}
