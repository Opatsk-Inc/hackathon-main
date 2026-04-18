import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';
import { AnomalyStatus } from '@prisma/client';
import { DashboardMetricsResponseDto } from './dto/response/dashboard-metrics.response.dto';
import { AnomalyListResponseDto } from './dto/response/anomaly-list.response.dto';
import { AssignTaskRequestDto } from './dto/request/assign-task.request.dto';
import { enrichAnomaly } from '../common/anomaly-enrichment';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geo: GeoService,
  ) {}

  async getDashboardMetrics(hromadaId: string): Promise<DashboardMetricsResponseDto> {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [anomalies, fineAgg, statusCounts, lastMonthFineAgg, lastMonthStatusCounts] = await Promise.all([
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
      // Last month data
      this.prisma.anomaly.aggregate({
        where: {
          hromadaId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
        },
        _sum: { potentialFine: true },
        _count: true,
      }),
      this.prisma.anomaly.groupBy({
        by: ['status'],
        where: {
          hromadaId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
        },
        _count: { status: true },
      }),
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.status]),
    ) as Record<AnomalyStatus, number>;

    const lastMonthStatusMap = Object.fromEntries(
      lastMonthStatusCounts.map((s) => [s.status, s._count.status]),
    ) as Record<AnomalyStatus, number>;

    const typeMap = new Map<string, number>();
    for (const a of anomalies) {
      typeMap.set(a.type, (typeMap.get(a.type) ?? 0) + 1);
    }

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { value: 0, direction: 'up' as const };
      const change = ((current - previous) / previous) * 100;
      return {
        value: Math.abs(Math.round(change * 10) / 10),
        direction: change >= 0 ? ('up' as const) : ('down' as const),
      };
    };

    const currentFine = fineAgg._sum.potentialFine ?? 0;
    const lastMonthFine = lastMonthFineAgg._sum.potentialFine ?? 0;
    const currentAnomalies = fineAgg._count;
    const lastMonthAnomalies = lastMonthFineAgg._count;
    const currentInProgress = statusMap[AnomalyStatus.IN_PROGRESS] ?? 0;
    const lastMonthInProgress = lastMonthStatusMap[AnomalyStatus.IN_PROGRESS] ?? 0;
    const currentResolved = statusMap[AnomalyStatus.RESOLVED] ?? 0;
    const lastMonthResolved = lastMonthStatusMap[AnomalyStatus.RESOLVED] ?? 0;

    return {
      totalAnomalies: currentAnomalies,
      totalPotentialFine: currentFine,
      newCount: statusMap[AnomalyStatus.NEW] ?? 0,
      inProgressCount: currentInProgress,
      resolvedCount: currentResolved,
      byType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
      budgetLossTrend: calculateTrend(currentFine, lastMonthFine),
      anomaliesTrend: calculateTrend(currentAnomalies, lastMonthAnomalies),
      inProgressTrend: calculateTrend(currentInProgress, lastMonthInProgress),
      resolvedTrend: calculateTrend(currentResolved, lastMonthResolved),
    };
  }

  async getDiscrepancies(hromadaId: string, batchId?: string): Promise<AnomalyListResponseDto> {
    const where = {
      hromadaId,
      ...(batchId ? { batchId } : {}),
    };

    const [raw, total] = await Promise.all([
      this.prisma.anomaly.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit to 1000 records for performance
      }),
      this.prisma.anomaly.count({ where }),
    ]);

    const items = raw.map((a) => ({
      ...a,
      enrichment: enrichAnomaly(a.type, a.severity, a.potentialFine),
    }));

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
