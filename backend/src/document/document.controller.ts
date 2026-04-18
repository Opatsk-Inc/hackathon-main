import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { DocumentService, InspectionDirectionDocument } from './document.service';
import { Usr } from '../user/user.decorator';
import type { AuthUser } from '../auth/auth-user';

@ApiTags('Document')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/admin/tasks')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get(':id/document')
  @ApiOperation({ summary: 'Generate "Направлення на перевірку" (Inspection Direction) document' })
  @ApiParam({ name: 'id', description: 'Anomaly ID' })
  @ApiResponse({ status: 200, description: 'Inspection direction document' })
  generateDocument(
    @Usr() user: AuthUser,
    @Param('id') anomalyId: string,
  ): Promise<InspectionDirectionDocument> {
    return this.documentService.generateInspectionDirection(user.id, anomalyId);
  }
}
