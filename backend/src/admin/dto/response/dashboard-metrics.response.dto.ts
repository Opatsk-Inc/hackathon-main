import { ApiProperty } from '@nestjs/swagger';

export class AnomalyTypeCountDto {
  @ApiProperty({ example: 'MISSING_IN_LAND' })
  type: string;

  @ApiProperty({ example: 12 })
  count: number;
}

export class TrendDto {
  @ApiProperty({ example: 5.1, description: 'Percentage change vs last month' })
  value: number;

  @ApiProperty({ example: 'up', enum: ['up', 'down'] })
  direction: 'up' | 'down';
}

export class DashboardMetricsResponseDto {
  @ApiProperty({ example: 47 })
  totalAnomalies: number;

  @ApiProperty({ example: 284500.75, description: 'Sum of all potential fines (UAH)' })
  totalPotentialFine: number;

  @ApiProperty({ example: 8, description: 'Anomalies with NEW status' })
  newCount: number;

  @ApiProperty({ example: 23, description: 'Anomalies with IN_PROGRESS status' })
  inProgressCount: number;

  @ApiProperty({ example: 16, description: 'Anomalies with RESOLVED status' })
  resolvedCount: number;

  @ApiProperty({ type: [AnomalyTypeCountDto] })
  byType: AnomalyTypeCountDto[];

  @ApiProperty({ type: TrendDto })
  budgetLossTrend: TrendDto;

  @ApiProperty({ type: TrendDto })
  anomaliesTrend: TrendDto;

  @ApiProperty({ type: TrendDto })
  inProgressTrend: TrendDto;

  @ApiProperty({ type: TrendDto })
  resolvedTrend: TrendDto;
}
