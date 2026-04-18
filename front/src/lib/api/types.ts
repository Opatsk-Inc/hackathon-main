export interface AnomalyTypeCount {
  type: string
  count: number
}

export interface DashboardMetrics {
  totalAnomalies: number
  totalPotentialFine: number
  newCount: number
  inProgressCount: number
  resolvedCount: number
  byType: AnomalyTypeCount[]
}

export interface Anomaly {
  id: string
  type: string
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED'
  potentialFine: number
  createdAt: string
  batchId: string
  inspectorId?: number
}

export interface AnomalyListResponse {
  items: Anomaly[]
  total: number
}
