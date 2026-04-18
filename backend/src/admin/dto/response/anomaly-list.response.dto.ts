import { ApiProperty } from '@nestjs/swagger';
import { AnomalyType, AnomalyStatus } from '@prisma/client';

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

  @ApiProperty({ example: 4250.0, description: 'Potential fine in UAH' })
  potentialFine: number | null;

  @ApiProperty({ example: 'Real estate found, no matching land record.' })
  description: string;

  @ApiProperty({ example: 'batch-uuid' })
  batchId: string;

  @ApiProperty({ example: '2024-06-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: null, nullable: true })
  inspectorId: string | null;
}

export class AnomalyListResponseDto {
  @ApiProperty({ type: [AnomalyResponseDto] })
  items: AnomalyResponseDto[];

  @ApiProperty({ example: 47 })
  total: number;
}
