import { Controller, Get, Patch, Param, Body, Headers, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { MobileService } from './mobile.service';
import { ResolveTaskRequestDto } from './dto/request/resolve-task.request.dto';
import { MobileTaskResponseDto } from './dto/response/mobile-task.response.dto';

@ApiTags('Mobile (Inspector)')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant identifier', required: true })
@Controller('api/mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('tasks')
  @ApiOperation({
    summary: "Get inspector's assigned tasks — potentialFine is NEVER included",
  })
  @ApiQuery({ name: 'inspectorId', required: true, description: 'Inspector user ID' })
  @ApiResponse({ status: 200, type: [MobileTaskResponseDto] })
  getTasks(
    @Headers('x-tenant-id') tenantId: string,
    @Query('inspectorId') inspectorId: string,
  ): Promise<MobileTaskResponseDto[]> {
    return this.mobileService.getAssignedTasks(tenantId, inspectorId);
  }

  @Patch('tasks/:id/resolve')
  @ApiOperation({ summary: 'Update task status after field inspection' })
  @ApiParam({ name: 'id', description: 'Anomaly/task ID' })
  @ApiResponse({
    status: 200,
    schema: { example: { id: 'uuid', status: 'RESOLVED', comment: '...', updatedAt: '...' } },
  })
  resolveTask(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') anomalyId: string,
    @Body() dto: ResolveTaskRequestDto,
  ) {
    return this.mobileService.resolveTask(tenantId, anomalyId, dto);
  }
}
