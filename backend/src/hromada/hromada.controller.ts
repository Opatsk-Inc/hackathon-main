import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HromadaService } from './hromada.service';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get hromada by UUID' })
  @ApiParam({ name: 'id', description: 'Hromada UUID' })
  findOne(@Param('id') id: string) {
    return this.hromadaService.findOne(id);
  }

  @Get(':id/land-records')
  @ApiOperation({ summary: 'Get paginated land records for a hromada' })
  @ApiParam({ name: 'id', description: 'Hromada UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findLandRecords(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.hromadaService.findLandRecords(id, page, limit);
  }

  @Get(':id/anomalies')
  @ApiOperation({ summary: 'Get paginated anomalies detected for a hromada' })
  @ApiParam({ name: 'id', description: 'Hromada UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAnomalies(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.hromadaService.findAnomalies(id, page, limit);
  }
}
