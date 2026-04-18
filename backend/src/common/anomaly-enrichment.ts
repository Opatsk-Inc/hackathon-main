import { AnomalyType } from '@prisma/client';

export interface AnomalyEnrichment {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  criminalArticle: string;
  legalBasis: string;
  inspectorAction: string;
  shouldVisit: boolean;
  urgencyDays: number;
}

type BaseEnrichment = Omit<AnomalyEnrichment, 'riskLevel' | 'shouldVisit' | 'urgencyDays'>;

/* eslint-disable prettier/prettier */
const ENRICHMENT_MAP: Record<AnomalyType, BaseEnrichment> = {
  [AnomalyType.MISSING_IN_REAL_ESTATE]: {
    criminalArticle: `ст. 212 КК України / ст. 375 КК України`,
    legalBasis: `Власник земельної ділянки не задекларував нерухомість у реєстрі. Може свідчити про незареєстроване будівництво або умисне приховування об'єктів оподаткування з метою ухилення від сплати податків.`,
    inspectorAction: `Виїхати на адресу земельної ділянки. Задокументувати фактичний стан (фото/відео). Перевірити наявність незареєстрованих будівель. У разі виявлення — скласти акт і направити матеріали до ДПС та прокуратури.`,
  },
  [AnomalyType.MISSING_IN_LAND]: {
    criminalArticle: `ст. 197-1 КК України`,
    legalBasis: `Особа має зареєстровану нерухомість, але відповідної земельної ділянки в кадастрі немає. Самовільне зайняття земельної ділянки або самовільне будівництво.`,
    inspectorAction: `Перевірити право власності або оренди на земельну ділянку під об'єктом нерухомості. Запросити у власника документи на землю. За відсутності — скласти акт та направити до органу земельного контролю.`,
  },
  [AnomalyType.NO_ACTIVE_REAL_RIGHTS]: {
    criminalArticle: `ст. 190 КК України`,
    legalBasis: `Право власності на нерухомість вже припинено, але об'єкт може фактично використовуватись. Може свідчити про шахрайські операції або незаконне використання чужого майна.`,
    inspectorAction: `Зв'язатись з власником та уточнити статус об'єкта. Перевірити актуальність права власності в нотаріуса або через реєстр. За необхідності передати матеріали до поліції.`,
  },
  [AnomalyType.AREA_MISMATCH]: {
    criminalArticle: `ст. 358 КК України`,
    legalBasis: `Площа об'єкта у реєстрі нерухомості суттєво відрізняється від площі земельної ділянки. Може свідчити про підроблення технічної документації або незаконне розширення об'єкта.`,
    inspectorAction: `Запросити технічний паспорт об'єкта та кадастровий план. Порівняти фактичні виміри з задекларованими. За значного розходження — залучити сертифікованого інженера та скласти акт.`,
  },
};
/* eslint-enable prettier/prettier */

export function enrichAnomaly(
  type: AnomalyType,
  severity: string,
  potentialFine: number | null,
): AnomalyEnrichment {
  const base = ENRICHMENT_MAP[type];
  const fine = potentialFine ?? 0;

  let riskLevel: AnomalyEnrichment['riskLevel'];
  if (severity === 'HIGH' && fine > 10_000) {
    riskLevel = 'CRITICAL';
  } else if (severity === 'HIGH' || fine > 5_000) {
    riskLevel = 'HIGH';
  } else if (severity === 'MEDIUM' || fine > 1_000) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  const shouldVisit =
    (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') &&
    type !== AnomalyType.AREA_MISMATCH;

  const urgencyDays =
    riskLevel === 'CRITICAL' ? 3 :
    riskLevel === 'HIGH'     ? 7 :
    riskLevel === 'MEDIUM'   ? 14 : 30;

  return { ...base, riskLevel, shouldVisit, urgencyDays };
}
