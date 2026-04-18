export interface AnomalyTypeCount {
  type: string
  count: number
}

export interface Trend {
  value: number
  direction: 'up' | 'down'
}

export interface DashboardMetrics {
  totalAnomalies: number
  totalPotentialFine: number
  newCount: number
  inProgressCount: number
  resolvedCount: number
  byType: AnomalyTypeCount[]
  budgetLossTrend: Trend
  anomaliesTrend: Trend
  inProgressTrend: Trend
  resolvedTrend: Trend
}

export interface AnomalyEnrichment {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  criminalArticle: string
  legalBasis: string
  inspectorAction: string
  shouldVisit: boolean
  urgencyDays: number
}

export interface Anomaly {
  id: string
  type: string
  severity: string
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED'
  taxId: string
  suspectName: string
  address: string
  lat: number | null
  lng: number | null
  potentialFine: number | null
  description: string
  batchId: string
  createdAt: string
  inspectorId?: string | null
  comment?: string | null
  enrichment: AnomalyEnrichment
}

export interface AnomalyListResponse {
  items: Anomaly[]
  total: number
}
