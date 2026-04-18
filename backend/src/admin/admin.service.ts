import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnomalyStatus, AnomalyType } from '@prisma/client';
import { DashboardMetricsResponseDto } from './dto/response/dashboard-metrics.response.dto';
import { AnomalyListResponseDto } from './dto/response/anomaly-list.response.dto';
import { AssignTaskRequestDto } from './dto/request/assign-task.request.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(tenantId: string): Promise<DashboardMetricsResponseDto> {
    const [anomalies, fineAgg, statusCounts] = await Promise.all([
      this.prisma.anomaly.findMany({ where: { tenantId }, select: { type: true } }),
      this.prisma.anomaly.aggregate({
        where: { tenantId },
        _sum: { potentialFine: true },
        _count: true,
      }),
      this.prisma.anomaly.groupBy({
        by: ['status'],
        where: { tenantId },
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

  async getDiscrepancies(tenantId: string): Promise<AnomalyListResponseDto> {
    const [items, total] = await Promise.all([
      this.prisma.anomaly.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.anomaly.count({ where: { tenantId } }),
    ]);
    return { items, total };
  }

  async assignTask(tenantId: string, dto: AssignTaskRequestDto) {
    const updated = await this.prisma.anomaly.updateMany({
      where: { tenantId, id: { in: dto.anomalyIds } },
      data: { inspectorId: dto.inspectorId, status: AnomalyStatus.IN_PROGRESS },
    });
    return { assigned: updated.count };
  }
}
