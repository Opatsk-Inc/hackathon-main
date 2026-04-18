import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ImportService } from './import.service';
import { ImportBatchResponseDto } from './dto/response/import-batch.response.dto';
import { ImportRealEstateRequestDto } from './dto/request/import-real-estate.request.dto';
import { Usr } from '../user/user.decorator';
import type { AuthUser } from '../auth/auth-user';

@ApiTags('Import')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('real-estate')
  @ApiOperation({ summary: 'Upload Real Estate file (CSV or XLSX) and run anomaly detection' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'baseTaxRate'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Real estate CSV or XLSX file' },
        baseTaxRate: { type: 'number', description: 'Tax rate per m² (UAH)' },
      },
    },
  })
  @ApiResponse({ status: 201, type: ImportBatchResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadRealEstate(
    @Usr() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportRealEstateRequestDto,
  ): Promise<ImportBatchResponseDto> {
    return this.importService.importRealEstate(user.id, file, dto.baseTaxRate);
  }
}
