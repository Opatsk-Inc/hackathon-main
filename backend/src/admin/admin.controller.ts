import { Controller, Get, Patch, Body, UseGuards, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AssignTaskRequestDto } from './dto/request/assign-task.request.dto';
import { DashboardMetricsResponseDto } from './dto/response/dashboard-metrics.response.dto';
import { AnomalyListResponseDto } from './dto/response/anomaly-list.response.dto';
import { Usr } from '../user/user.decorator';
import type { AuthUser } from '../auth/auth-user';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/metrics')
  @ApiOperation({ summary: 'Get dashboard metrics for current user' })
  @ApiResponse({ status: 200, type: DashboardMetricsResponseDto })
  getMetrics(@Usr() user: AuthUser): Promise<DashboardMetricsResponseDto> {
    return this.adminService.getDashboardMetrics(user.id);
  }

  @Get('discrepancies')
  @ApiOperation({ summary: 'List anomalies for current user' })
  @ApiQuery({ name: 'batchId', required: false, description: 'Filter by specific batch' })
  @ApiResponse({ status: 200, type: AnomalyListResponseDto })
  getDiscrepancies(
    @Usr() user: AuthUser,
    @Query('batchId') batchId?: string,
  ): Promise<AnomalyListResponseDto> {
    return this.adminService.getDiscrepancies(user.id, batchId);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List import batches for current user' })
  getBatches(@Usr() user: AuthUser) {
    return this.adminService.getBatches(user.id);
  }

  @Patch('tasks/assign')
  @ApiOperation({ summary: 'Assign anomalies to an inspector' })
  @ApiResponse({ status: 200, schema: { example: { assigned: 3 } } })
  assignTask(@Usr() user: AuthUser, @Body() dto: AssignTaskRequestDto) {
    return this.adminService.assignTask(user.id, dto);
  }
}
