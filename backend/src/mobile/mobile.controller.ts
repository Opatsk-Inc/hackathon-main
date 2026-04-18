import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { MobileService } from './mobile.service';
import { ResolveTaskRequestDto } from './dto/request/resolve-task.request.dto';
import { MobileTaskResponseDto } from './dto/response/mobile-task.response.dto';

@ApiTags('Mobile (Inspector)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('tasks')
  @ApiOperation({ summary: "Get inspector's assigned tasks" })
  @ApiQuery({ name: 'inspectorId', required: true, description: 'Inspector user ID' })
  @ApiResponse({ status: 200, type: [MobileTaskResponseDto] })
  getTasks(@Query('inspectorId') inspectorId: string): Promise<MobileTaskResponseDto[]> {
    return this.mobileService.getAssignedTasks(inspectorId);
  }

  @Patch('tasks/:id/resolve')
  @ApiOperation({ summary: 'Update task status after field inspection' })
  @ApiParam({ name: 'id', description: 'Anomaly/task ID' })
  @ApiResponse({
    status: 200,
    schema: { example: { id: 'uuid', status: 'RESOLVED', comment: '...', updatedAt: '...' } },
  })
  resolveTask(@Param('id') anomalyId: string, @Body() dto: ResolveTaskRequestDto) {
    return this.mobileService.resolveTask(anomalyId, dto);
  }
}
