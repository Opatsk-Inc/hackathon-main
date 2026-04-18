import { Controller, Get, Param, Headers } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { DocumentService, InspectionDirectionDocument } from './document.service';

@ApiTags('Document')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant identifier', required: true })
@Controller('api/admin/tasks')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get(':id/document')
  @ApiOperation({
    summary: 'Generate "Направлення на перевірку" (Inspection Direction) document',
    description:
      'Returns a structured document with anomaly details and a base64-encoded PDF stub compliant with Ukrainian administrative law (ПКУ ст. 288).',
  })
  @ApiParam({ name: 'id', description: 'Anomaly ID' })
  @ApiResponse({
    status: 200,
    description: 'Inspection direction document',
    schema: {
      example: {
        documentTitle: 'Направлення на перевірку',
        documentNumber: 'LS-1717000000000-ABC123',
        issuedAt: '2024-06-01T10:00:00.000Z',
        legalBasis: 'ПКУ ст. 288',
        taxId: '1234567890',
        suspectName: 'Іваненко Іван Іванович',
        potentialFine: 4250,
        pdfBase64Stub: 'base64encodedstring...',
      },
    },
  })
  generateDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') anomalyId: string,
  ): Promise<InspectionDirectionDocument> {
    return this.documentService.generateInspectionDirection(tenantId, anomalyId);
  }
}
