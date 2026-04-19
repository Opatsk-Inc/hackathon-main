import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnomalyStatus } from '@prisma/client';
import { MobileTaskResponseDto } from './dto/response/mobile-task.response.dto';
import { ResolveTaskRequestDto } from './dto/request/resolve-task.request.dto';
import { enrichAnomaly } from '../common/anomaly-enrichment';

@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssignedTasks(inspectorId: string): Promise<MobileTaskResponseDto[]> {
    // For the hackathon demo: return ALL anomalies so the map is always full of data for the inspector
    const raw = await this.prisma.anomaly.findMany({
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
        potentialFine: true,
        suspectName: true,
        taxId: true,
      },
    });

    return raw.map((a) => ({
      ...a,
      enrichment: enrichAnomaly(a.type, a.severity, a.potentialFine),
    }));
  }

  async resolveTask(anomalyId: string, dto: ResolveTaskRequestDto) {
    const existing = await this.prisma.anomaly.findUnique({ where: { id: anomalyId } });
    if (!existing) throw new NotFoundException(`Task ${anomalyId} not found`);

    return this.prisma.anomaly.update({
      where: { id: anomalyId },
      data: { status: dto.status, comment: dto.comment ?? null },
      select: { id: true, status: true, comment: true, updatedAt: true },
    });
  }
}
