import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnomalyStatus } from '@prisma/client';
import { DashboardMetricsResponseDto } from './dto/response/dashboard-metrics.response.dto';
import { AnomalyListResponseDto } from './dto/response/anomaly-list.response.dto';
import { AssignTaskRequestDto } from './dto/request/assign-task.request.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(userId: number): Promise<DashboardMetricsResponseDto> {
    const userBatchFilter = { batch: { userId } };

    const [anomalies, fineAgg, statusCounts] = await Promise.all([
      this.prisma.anomaly.findMany({
        where: userBatchFilter,
        select: { type: true },
      }),
      this.prisma.anomaly.aggregate({
        where: userBatchFilter,
        _sum: { potentialFine: true },
        _count: true,
      }),
      this.prisma.anomaly.groupBy({
        by: ['status'],
        where: userBatchFilter,
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

  async getDiscrepancies(userId: number, batchId?: string): Promise<AnomalyListResponseDto> {
    const where = {
      batch: { userId },
      ...(batchId ? { batchId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.anomaly.findMany({ where, orderBy: { createdAt: 'desc' } }),
      this.prisma.anomaly.count({ where }),
    ]);

    return { items, total };
  }

  async getBatches(userId: number) {
    const batches = await this.prisma.importBatch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { anomalies: true } } },
    });
    return batches.map((b) => ({ ...b, anomalyCount: b._count.anomalies }));
  }

  async assignTask(userId: number, dto: AssignTaskRequestDto) {
    const updated = await this.prisma.anomaly.updateMany({
      where: {
        batch: { userId },
        id: { in: dto.anomalyIds },
      },
      data: { inspectorId: dto.inspectorId, status: AnomalyStatus.IN_PROGRESS },
    });
    return { assigned: updated.count };
  }
}
