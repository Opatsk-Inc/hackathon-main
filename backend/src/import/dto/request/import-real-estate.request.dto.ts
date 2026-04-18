import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';
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
}
