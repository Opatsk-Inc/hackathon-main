import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface InspectionDirectionDocument {
  documentTitle: string;
  documentNumber: string;
  issuedAt: string;
  legalBasis: string;
  anomalyId: string;
  taxId: string;
  suspectName: string;
  address: string;
  anomalyType: string;
  severity: string;
  potentialFine: number | null;
  description: string;
  instructions: string;
  pdfBase64Stub: string;
}

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInspectionDirection(
    userId: number,
    anomalyId: string,
  ): Promise<InspectionDirectionDocument> {
    const anomaly = await this.prisma.anomaly.findFirst({
      where: { id: anomalyId, batch: { userId } },
      include: { batch: true },
    });

    if (!anomaly) throw new NotFoundException(`Anomaly ${anomalyId} not found`);

    const documentNumber = `LS-${Date.now()}-${anomalyId.slice(0, 6).toUpperCase()}`;
    const issuedAt = new Date().toISOString();

    const pdfStubContent = [
      `НАПРАВЛЕННЯ НА ПЕРЕВІРКУ`,
      `№ ${documentNumber}`,
      `від ${new Date().toLocaleDateString('uk-UA')}`,
      ``,
      `ПЛАТНИК: ${anomaly.suspectName}`,
      `РНОКПП: ${anomaly.taxId}`,
      `Адреса об'єкту: ${anomaly.address}`,
      ``,
      `Підстава: ${anomaly.description}`,
      `Тип порушення: ${anomaly.type}`,
      `Рівень ризику: ${anomaly.severity}`,
      `Розрахункова сума фінансових санкцій: ${anomaly.potentialFine ?? 0} грн`,
      ``,
      `Правова основа: ПКУ ст. 288, ЗУ "Про оцінку земель", ЗУ "Про державну реєстрацію речових прав"`,
      ``,
      `Підпис уповноваженої особи: _________________________`,
    ].join('\n');

    const pdfBase64Stub = Buffer.from(pdfStubContent).toString('base64');

    return {
      documentTitle: 'Направлення на перевірку',
      documentNumber,
      issuedAt,
      legalBasis: 'ПКУ ст. 288; ЗУ "Про оцінку земель"; ЗУ "Про державну реєстрацію речових прав"',
      anomalyId: anomaly.id,
      taxId: anomaly.taxId,
      suspectName: anomaly.suspectName,
      address: anomaly.address,
      anomalyType: anomaly.type,
      severity: anomaly.severity,
      potentialFine: anomaly.potentialFine,
      description: anomaly.description,
      instructions:
        'Провести документальну позапланову перевірку відповідно до виявлених ознак порушення.',
      pdfBase64Stub,
    };
  }
}
