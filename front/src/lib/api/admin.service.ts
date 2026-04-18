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

  static importRealEstate(file: File, baseTaxRate: number): Promise<{ message: string; batchId: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('baseTaxRate', baseTaxRate.toString())

    return ApiClient.postFormData<{ message: string; batchId: string }>('/api/import/real-estate', formData)
  }
}
