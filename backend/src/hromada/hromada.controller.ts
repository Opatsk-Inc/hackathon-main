import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HromadaService } from './hromada.service';
import { Usr } from '../user/user.decorator';
import type { AuthUser } from '../auth/auth-user';

@ApiTags('Hromada')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/hromadas')
export class HromadaController {
  constructor(private readonly hromadaService: HromadaService) {}

  @Get()
  @ApiOperation({ summary: 'List all hromadas from the dataset' })
  findAll() {
    return this.hromadaService.findAll();
  }

  @Get('land-records')
  @ApiOperation({ summary: 'Get paginated land records for the current hromada' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findMyLandRecords(
    @Usr() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.hromadaService.findLandRecords(user.id, page, limit);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get paginated anomalies for the current hromada' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findMyAnomalies(
    @Usr() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.hromadaService.findAnomalies(user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hromada by UUID' })
  @ApiParam({ name: 'id', description: 'Hromada UUID' })
  findOne(@Param('id') id: string) {
    return this.hromadaService.findOne(id);
  }
}
