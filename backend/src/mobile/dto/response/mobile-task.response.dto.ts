import { ApiProperty } from '@nestjs/swagger';
import { AnomalyStatus, AnomalyType } from '@prisma/client';

export class MobileTaskEnrichmentDto {
  @ApiProperty({ example: 'CRITICAL', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] })
  riskLevel: string;

  @ApiProperty({ example: 'ст. 212 КК України' })
  criminalArticle: string;

  @ApiProperty({ example: 'Власник ділянки не задекларував нерухомість...' })
  legalBasis: string;

  @ApiProperty({ example: "Виїхати на об'єкт, задокументувати стан." })
  inspectorAction: string;

  @ApiProperty({ example: true })
  shouldVisit: boolean;

  @ApiProperty({ example: 7 })
  urgencyDays: number;
}

export class MobileTaskResponseDto {
  @ApiProperty({ example: 'uuid-anomaly-id' })
  id: string;

  @ApiProperty({ enum: AnomalyType, example: AnomalyType.MISSING_IN_REAL_ESTATE })
  type: AnomalyType;

  @ApiProperty({ enum: AnomalyStatus, example: AnomalyStatus.NEW })
  status: AnomalyStatus;

  @ApiProperty({ example: 'м. Київ, вул. Хрещатик, 1' })
  address: string;

  @ApiProperty({ example: 'Землекористувач не має зареєстрованої нерухомості.' })
  description: string;

  @ApiProperty({ example: 50.4501, nullable: true })
  lat: number | null;

  @ApiProperty({ example: 30.5234, nullable: true })
  lng: number | null;

  @ApiProperty({ example: 'HIGH' })
  severity: string;

  @ApiProperty({ example: '2024-06-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 4250.0, nullable: true })
  potentialFine: number | null;

  @ApiProperty({ example: 'Іваненко Іван Іванович' })
  suspectName: string;

  @ApiProperty({ example: '1234567890' })
  taxId: string;

  @ApiProperty({ type: MobileTaskEnrichmentDto })
  enrichment: MobileTaskEnrichmentDto;
}
