import { ApiClient } from './client'
import type { DashboardMetrics, AnomalyListResponse } from './types'

export class AdminService {
  static getDashboardMetrics(): Promise<DashboardMetrics> {
    return ApiClient.get<DashboardMetrics>('/api/admin/dashboard/metrics')
  }

  static getDiscrepancies(batchId?: string): Promise<AnomalyListResponse> {
    const query = batchId ? `?batchId=${batchId}` : ''
    return ApiClient.get<AnomalyListResponse>(`/api/admin/discrepancies${query}`)
  }

  static getBatches() {
    return ApiClient.get('/api/admin/batches')
  }

  static assignTask(anomalyIds: string[], inspectorId: number) {
    return ApiClient.patch('/api/admin/tasks/assign', { anomalyIds, inspectorId })
  }
}
