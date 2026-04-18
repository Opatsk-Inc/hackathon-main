import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { ImportService } from './import.service';
import { ImportRealEstateRequestDto } from './dto/request/import-real-estate.request.dto';
import { ImportBatchResponseDto } from './dto/response/import-batch.response.dto';

@ApiTags('Import')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant identifier', required: true })
@Controller('api/admin/import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('real-estate')
  @ApiOperation({ summary: 'Upload Real Estate CSV and run anomaly detection' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['estateCsv', 'baseTaxRate'],
      properties: {
        estateCsv: { type: 'string', format: 'binary', description: 'Real estate CSV file' },
        baseTaxRate: { type: 'number', description: 'Tax rate per m² (UAH)' },
      },
    },
  })
  @ApiResponse({ status: 201, type: ImportBatchResponseDto })
  @UseInterceptors(FileInterceptor('estateCsv'))
  async uploadRealEstate(
    @Headers('x-tenant-id') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportRealEstateRequestDto,
  ): Promise<ImportBatchResponseDto> {
    return this.importService.importRealEstate(tenantId, file, dto.baseTaxRate);
  }
}
