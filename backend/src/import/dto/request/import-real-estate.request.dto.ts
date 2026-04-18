import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportRealEstateRequestDto {
  @ApiProperty({
    description: 'Base tax rate per square meter (UAH) for fine calculation',
    example: 12.5,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  baseTaxRate: number;

  @ApiPropertyOptional({
    description: 'Hromada UUID — links this import batch and its anomalies to a specific hromada',
    example: '2d11b394-90de-4fd6-847f-0d36eb53d244',
  })
  @IsOptional()
  @IsUUID()
  hromadaId?: string;
}
