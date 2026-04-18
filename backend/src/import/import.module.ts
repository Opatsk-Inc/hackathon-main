import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [GeoModule],
  controllers: [ImportController],
  providers: [ImportService, PrismaService],
})
export class ImportModule {}
