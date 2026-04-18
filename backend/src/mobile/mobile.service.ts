import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnomalyStatus } from '@prisma/client';
import { MobileTaskResponseDto } from './dto/response/mobile-task.response.dto';
import { ResolveTaskRequestDto } from './dto/request/resolve-task.request.dto';

@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssignedTasks(tenantId: string, inspectorId: string): Promise<MobileTaskResponseDto[]> {
    const anomalies = await this.prisma.anomaly.findMany({
      where: { tenantId, inspectorId, status: { not: AnomalyStatus.RESOLVED } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        address: true,
        description: true,
        lat: true,
        lng: true,
        severity: true,
        createdAt: true,
        // potentialFine intentionally excluded
      },
    });
    return anomalies;
  }

  async resolveTask(tenantId: string, anomalyId: string, dto: ResolveTaskRequestDto) {
    const existing = await this.prisma.anomaly.findFirst({
      where: { id: anomalyId, tenantId },
    });
    if (!existing) throw new NotFoundException(`Task ${anomalyId} not found`);

    const updated = await this.prisma.anomaly.update({
      where: { id: anomalyId },
      data: { status: dto.status, comment: dto.comment ?? null },
      select: {
        id: true,
        status: true,
        comment: true,
        updatedAt: true,
      },
    });
    return updated;
  }
}
