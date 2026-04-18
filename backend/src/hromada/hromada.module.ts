import { Module } from '@nestjs/common';
import { HromadaController } from './hromada.controller';
import { HromadaService } from './hromada.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HromadaController],
  providers: [HromadaService, PrismaService],
})
export class HromadaModule {}
