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

  // Derive effective status: if inspectorId is set but status is still NEW, treat as IN_PROGRESS
  private effectiveStatus(status: AnomalyStatus, inspectorId: string | null): AnomalyStatus {
    if (inspectorId && status === AnomalyStatus.NEW) return AnomalyStatus.IN_PROGRESS;
    return status;
  }

  async getDashboardMetrics(hromadaId: string): Promise<DashboardMetricsResponseDto> {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [allAnomalies, fineAgg, lastMonthFineAgg, lastMonthAnomalies] = await Promise.all([
      this.prisma.anomaly.findMany({
        where: { hromadaId },
        select: { type: true, status: true, inspectorId: true },
      }),
      this.prisma.anomaly.aggregate({
        where: { hromadaId },
        _sum: { potentialFine: true },
        _count: true,
      }),
      this.prisma.anomaly.aggregate({
        where: {
          hromadaId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
        },
        _sum: { potentialFine: true },
        _count: true,
      }),
      this.prisma.anomaly.findMany({
        where: {
          hromadaId,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
        },
        select: { status: true, inspectorId: true },
      }),
    ]);

    // Count statuses using effective status (accounts for inspectorId)
    const statusMap: Record<string, number> = {};
    const typeMap = new Map<string, number>();
    for (const a of allAnomalies) {
      const eff = this.effectiveStatus(a.status, a.inspectorId);
      statusMap[eff] = (statusMap[eff] ?? 0) + 1;
      typeMap.set(a.type, (typeMap.get(a.type) ?? 0) + 1);
    }

    const lastMonthStatusMap: Record<string, number> = {};
    for (const a of lastMonthAnomalies) {
      const eff = this.effectiveStatus(a.status, a.inspectorId);
      lastMonthStatusMap[eff] = (lastMonthStatusMap[eff] ?? 0) + 1;
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
    const lastMonthAnomaliesCount = lastMonthFineAgg._count;
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
      anomaliesTrend: calculateTrend(currentAnomalies, lastMonthAnomaliesCount),
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
        orderBy: [
          { status: 'asc' },     // IN_PROGRESS first, then NEW, then RESOLVED
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.anomaly.count({ where }),
    ]);

    const items = raw.map((a) => ({
      ...a,
      status: this.effectiveStatus(a.status, a.inspectorId),
      enrichment: enrichAnomaly(a.type, a.severity, a.potentialFine),
    }));

    return { items, total };
  }

  async getInspectors(baseUrl: string) {
    const inspectors = await this.prisma.inspector.findMany({ orderBy: { name: 'asc' } });
    return inspectors.map((i) => ({
      id: i.id,
      name: i.name,
      phone: i.phone,
      magicToken: i.magicToken,
      magicLink: `${baseUrl}/inspector/auth?token=${i.magicToken}`,
    }));
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
    this.logger.log(`Assigning ${dto.anomalyIds.length} anomalies to inspector ${dto.inspectorId} (hromadaId=${hromadaId})`);

    const updated = await this.prisma.anomaly.updateMany({
      where: {
        hromadaId,
        id: { in: dto.anomalyIds },
      },
      data: { inspectorId: dto.inspectorId, status: AnomalyStatus.IN_PROGRESS },
    });

    this.logger.log(`Updated ${updated.count} anomalies to IN_PROGRESS`);

    if (updated.count === 0) {
      this.logger.warn(
        `No anomalies updated! Requested IDs: ${dto.anomalyIds.join(', ')}. ` +
        `Possible hromadaId mismatch (expected: ${hromadaId})`,
      );
    }

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
