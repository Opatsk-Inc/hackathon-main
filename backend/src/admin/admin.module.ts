import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { InspectorController } from './inspector.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [GeoModule],
  controllers: [AdminController, InspectorController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
