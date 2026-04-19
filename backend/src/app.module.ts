import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';


// LionsShare modules
import { GeoModule } from './geo/geo.module';
import { ImportModule } from './import/import.module';
import { AdminModule } from './admin/admin.module';
import { DocumentModule } from './document/document.module';
import { MobileModule } from './mobile/mobile.module';
import { HromadaModule } from './hromada/hromada.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    UserModule,
    AuthModule,
    // LionsShare
    GeoModule,
    ImportModule,
    AdminModule,
    DocumentModule,
    MobileModule,
    HromadaModule,
    RecommendationsModule,
  ],
  providers: [PrismaService],
  controllers: [AppController],
})
export class AppModule {}
