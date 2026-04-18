import { ApiProperty } from '@nestjs/swagger';
import { AnomalyStatus, AnomalyType } from '@prisma/client';

export class MobileTaskResponseDto {
  @ApiProperty({ example: 'uuid-anomaly-id' })
  id: string;

  @ApiProperty({ enum: AnomalyType, example: AnomalyType.MISSING_IN_LAND })
  type: AnomalyType;

  @ApiProperty({ enum: AnomalyStatus, example: AnomalyStatus.NEW })
  status: AnomalyStatus;

  @ApiProperty({ example: 'м. Київ, вул. Хрещатик, 1' })
  address: string;

  @ApiProperty({ example: 'Real estate found, no matching land record.' })
  description: string;

  @ApiProperty({ example: 50.4501, nullable: true })
  lat: number | null;

  @ApiProperty({ example: 30.5234, nullable: true })
  lng: number | null;

  @ApiProperty({ example: 'HIGH' })
  severity: string;

  @ApiProperty({ example: '2024-06-01T10:00:00.000Z' })
  createdAt: Date;
}
