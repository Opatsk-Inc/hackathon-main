import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignTaskRequestDto {
  @ApiProperty({ example: 'inspector-uuid-123', description: 'Inspector user ID' })
  @IsString()
  inspectorId: string;

  @ApiProperty({
    type: [String],
    example: ['anomaly-uuid-1', 'anomaly-uuid-2'],
    description: 'List of anomaly IDs to assign',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  anomalyIds: string[];
}
