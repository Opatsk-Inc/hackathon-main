import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HromadaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.hromada.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { landRecords: true } } },
    });
  }

  async findOne(id: string) {
    const hromada = await this.prisma.hromada.findUnique({
      where: { id },
      include: { _count: { select: { landRecords: true } } },
    });

    if (!hromada) throw new NotFoundException(`Громада ${id} не знайдена`);
    return hromada;
  }

  async findLandRecords(id: string, page = 1, limit = 50) {
    await this.findOne(id);

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.landRecord.findMany({
        where: { hromadaId: id },
        skip,
        take: limit,
        orderBy: { ownerNameRaw: 'asc' },
      }),
      this.prisma.landRecord.count({ where: { hromadaId: id } }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findAnomalies(id: string, page = 1, limit = 50) {
    await this.findOne(id);

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.anomaly.findMany({
        where: { hromadaId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.anomaly.count({ where: { hromadaId: id } }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
