import { ApiProperty } from '@nestjs/swagger';

export class ImportBatchResponseDto {
  @ApiProperty({ example: 'uuid-batch-id' })
  id: string;

  @ApiProperty({ example: 'real_estate_kyiv_2024.csv' })
  fileName: string;

  @ApiProperty({ example: 342 })
  rowsCount: number;

  @ApiProperty({ example: 17 })
  anomaliesFound: number;

  @ApiProperty({ example: '2024-06-01T10:00:00.000Z' })
  createdAt: Date;
}
