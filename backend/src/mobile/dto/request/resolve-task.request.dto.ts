import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AnomalyStatus } from '@prisma/client';

export class ResolveTaskRequestDto {
  @ApiProperty({
    enum: [AnomalyStatus.IN_PROGRESS, AnomalyStatus.RESOLVED],
    description: 'New status for the task',
    example: AnomalyStatus.RESOLVED,
  })
  @IsEnum([AnomalyStatus.IN_PROGRESS, AnomalyStatus.RESOLVED])
  status: AnomalyStatus;

  @ApiProperty({
    required: false,
    example: 'Власник підтвердив реєстрацію земельної ділянки.',
    description: "Inspector's field comment",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
