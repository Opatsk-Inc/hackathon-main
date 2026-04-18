import { Controller, Get, Patch, Body, Headers } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AssignTaskRequestDto } from './dto/request/assign-task.request.dto';
import { DashboardMetricsResponseDto } from './dto/response/dashboard-metrics.response.dto';
import { AnomalyListResponseDto } from './dto/response/anomaly-list.response.dto';

@ApiTags('Admin')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant identifier', required: true })
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/metrics')
  @ApiOperation({ summary: 'Get dashboard metrics: total anomalies, potential fines' })
  @ApiResponse({ status: 200, type: DashboardMetricsResponseDto })
  getMetrics(
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<DashboardMetricsResponseDto> {
    return this.adminService.getDashboardMetrics(tenantId);
  }

  @Get('discrepancies')
  @ApiOperation({ summary: 'List all detected anomalies/discrepancies' })
  @ApiResponse({ status: 200, type: AnomalyListResponseDto })
  getDiscrepancies(
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<AnomalyListResponseDto> {
    return this.adminService.getDiscrepancies(tenantId);
  }

  @Patch('tasks/assign')
  @ApiOperation({ summary: 'Assign anomalies to an inspector' })
  @ApiResponse({ status: 200, schema: { example: { assigned: 3 } } })
  assignTask(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: AssignTaskRequestDto,
  ) {
    return this.adminService.assignTask(tenantId, dto);
  }
}
