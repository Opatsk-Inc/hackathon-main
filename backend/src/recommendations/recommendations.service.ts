import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  private _groq: Groq | null = null;

  constructor(private prisma: PrismaService) {}

  private get groq(): Groq {
    if (!this._groq) {
      this._groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return this._groq;
  }

  async generateRecommendation(anomalyId: string): Promise<string> {
    const cached = await this.prisma.aiRecommendation.findUnique({
      where: { anomalyId },
    });

    if (cached) {
      return cached.content;
    }

    const anomaly = await this.prisma.anomaly.findUnique({
      where: { id: anomalyId },
    });

    if (!anomaly) {
      throw new Error('Anomaly not found');
    }

    const prompt = this.buildPrompt(anomaly);

    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Ти — експерт з українського земельного законодавства. Давай КОРОТКІ, КОНКРЕТНІ інструкції для інспектора громади. Максимум 3-4 речення. Фокус на діях, а не на теорії.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 300,
    });

    const recommendation = completion.choices[0]?.message?.content || 'Не вдалося згенерувати рекомендацію';

    await this.prisma.aiRecommendation.create({
      data: {
        anomalyId,
        content: recommendation,
      },
    });

    return recommendation;
  }

  private buildPrompt(anomaly: any): string {
    const { type, severity, description, taxId, suspectName, address, potentialFine } = anomaly;
    const typeContext = this.getTypeSpecificContext(type);

    return `
Ти — експерт з українського земельного законодавства. Дай КОРОТКІ, КОНКРЕТНІ рекомендації інспектору громади.

**ТИП АНОМАЛІЇ:** ${type}
${typeContext}

**ДАНІ:**
- ПІБ: ${suspectName}
- Адреса: ${address}
- ІПН: ${taxId}
- Потенційний штраф: ${potentialFine ? `${potentialFine} грн` : 'не визначено'}

**ЗАВДАННЯ:**
Напиши короткі рекомендації (3-4 речення) що КОНКРЕТНО має зробити інспектор:
1. Куди виїхати / що перевірити
2. Які документи запросити
3. Куди направити матеріали

Формат:
📋 [Короткий опис дій]

🔴 ПОТРІБЕН ВИЇЗД НА ОБ'ЄКТ / 📄 ДОКУМЕНТАЛЬНА ПЕРЕВІРКА
Термін: X дн.
`;
  }

  private getTypeSpecificContext(type: string): string {
    const contexts: Record<string, string> = {
      MISSING_IN_REAL_ESTATE: `
**КОНТЕКСТ:** Земельна ділянка є в кадастрі, але відсутня в реєстрі нерухомості.
**ЗАКОНОДАВСТВО:** ст. 125, 126 ЗК України, Закон "Про державну реєстрацію речових прав на нерухоме майно"
**ТИПОВІ ПРИЧИНИ:** Незареєстроване право власності, самозахоплення, давність володіння`,
      MISSING_IN_LAND: `
**КОНТЕКСТ:** Нерухомість є в реєстрі, але земельна ділянка відсутня в кадастрі.
**ЗАКОНОДАВСТВО:** ст. 79-1, 186-1 ЗК України
**ТИПОВІ ПРИЧИНИ:** Відсутність кадастрового номера, помилки в документах`,
      NO_ACTIVE_REAL_RIGHTS: `
**КОНТЕКСТ:** Право власності на нерухомість закінчилось (оренда, емфітевзис).
**ЗАКОНОДАВСТВО:** ст. 102-104 ЗК України, ст. 377 ЦК України
**ТИПОВІ ПРИЧИНИ:** Закінчення терміну оренди, невиконання умов договору`,
      AREA_MISMATCH: `
**КОНТЕКСТ:** Розбіжність площ між кадастром і реєстром нерухомості.
**ЗАКОНОДАВСТВО:** ст. 79-1 ЗК України, технічна інвентаризація
**ТИПОВІ ПРИЧИНИ:** Самовільна забудова, помилки вимірювань, застаріла документація`,
    };
    return contexts[type] || '';
  }
}
