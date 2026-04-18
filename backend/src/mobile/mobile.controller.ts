import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { MobileService } from './mobile.service';
import { ResolveTaskRequestDto } from './dto/request/resolve-task.request.dto';
import { MobileTaskResponseDto } from './dto/response/mobile-task.response.dto';
import { Usr } from '../user/user.decorator';
import type { AuthUser } from '../auth/auth-user';

@ApiTags('Mobile (Inspector)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('tasks')
  @ApiOperation({ summary: "Get inspector's assigned tasks (uses JWT identity)" })
  @ApiResponse({ status: 200, type: [MobileTaskResponseDto] })
  getTasks(@Usr() user: AuthUser): Promise<MobileTaskResponseDto[]> {
    return this.mobileService.getAssignedTasks(user.id);
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
