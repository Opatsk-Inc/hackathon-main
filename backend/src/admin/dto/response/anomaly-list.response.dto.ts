import { ApiProperty } from '@nestjs/swagger';
import { AnomalyType, AnomalyStatus } from '@prisma/client';

export class AnomalyEnrichmentDto {
  @ApiProperty({ example: 'CRITICAL', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] })
  riskLevel: string;

  @ApiProperty({ example: 'ст. 212 КК України' })
  criminalArticle: string;

  @ApiProperty({ example: 'Власник не задекларував нерухомість...' })
  legalBasis: string;

  @ApiProperty({ example: "Виїхати на об'єкт та задокументувати стан." })
  inspectorAction: string;

  @ApiProperty({ example: true })
  shouldVisit: boolean;

  @ApiProperty({ example: 7, description: 'Рекомендований термін виконання, днів' })
  urgencyDays: number;
}

export class AnomalyResponseDto {
  @ApiProperty({ example: 'uuid-anomaly-id' })
  id: string;

  @ApiProperty({ enum: AnomalyType })
  type: AnomalyType;

  @ApiProperty({ example: 'HIGH' })
  severity: string;

  @ApiProperty({ enum: AnomalyStatus })
  status: AnomalyStatus;

  @ApiProperty({ example: '1234567890' })
  taxId: string;

  @ApiProperty({ example: 'Іваненко Іван Іванович' })
  suspectName: string;

  @ApiProperty({ example: 'м. Київ, вул. Хрещатик, 1' })
  address: string;

  @ApiProperty({ example: 50.4501, nullable: true })
  lat: number | null;

  @ApiProperty({ example: 30.5234, nullable: true })
  lng: number | null;

  @ApiProperty({ example: 4250.0, nullable: true })
  potentialFine: number | null;

  @ApiProperty({ example: 'Нерухомість знайдена, але земельного запису немає.' })
  description: string;

  @ApiProperty({ example: 'batch-uuid' })
  batchId: string;

  @ApiProperty({ example: '2024-06-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: null, nullable: true })
  inspectorId: string | null;

  @ApiProperty({ example: null, nullable: true })
  comment: string | null;

  @ApiProperty({ type: AnomalyEnrichmentDto })
  enrichment: AnomalyEnrichmentDto;
}

export class AnomalyListResponseDto {
  @ApiProperty({ type: [AnomalyResponseDto] })
  items: AnomalyResponseDto[];

  @ApiProperty({ example: 47 })
  total: number;
}
