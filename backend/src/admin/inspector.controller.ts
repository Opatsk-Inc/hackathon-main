import { Controller, Get, Param, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Inspector')
@Controller('api/inspector')
export class InspectorController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('task/:id')
  @ApiOperation({ summary: 'Get task details via magic link (no JWT required)' })
  @ApiQuery({ name: 'token', required: true, description: 'Inspector magic token' })
  @ApiResponse({ status: 200, description: 'Task details' })
  async getTaskByMagicLink(
    @Param('id') anomalyId: string,
    @Query('token') token: string,
  ) {
    // Verify magic token
    const inspector = await this.prisma.inspector.findUnique({
      where: { magicToken: token },
    });
    if (!inspector) {
      throw new UnauthorizedException('Невірне або прострочене посилання');
    }

    // Get all tasks for this inspector
    const tasks = await this.adminService.getMyTasks(inspector.id);

    // Find the specific task
    const task = tasks.find((t) => t.id === anomalyId);
    if (!task) {
      throw new UnauthorizedException('Завдання не знайдено або не призначено вам');
    }

    return task;
  }
}
