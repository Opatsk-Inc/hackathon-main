import { ApiClient } from './client'
import type { DashboardMetrics, AnomalyListResponse, Inspector, ImportBatch } from './types'

export class AdminService {
  static getDashboardMetrics(): Promise<DashboardMetrics> {
    return ApiClient.get<DashboardMetrics>('/api/admin/dashboard/metrics')
  }

  static getDiscrepancies(batchId?: string): Promise<AnomalyListResponse> {
    const query = batchId ? `?batchId=${batchId}` : ''
    return ApiClient.get<AnomalyListResponse>(`/api/admin/discrepancies${query}`)
  }

  static getBatches(): Promise<ImportBatch[]> {
    return ApiClient.get<ImportBatch[]>('/api/admin/batches')
  }

  static getInspectors(): Promise<Inspector[]> {
    return ApiClient.get<Inspector[]>('/api/admin/inspectors')
  }

  static assignTask(anomalyIds: string[], inspectorId: string) {
    return ApiClient.patch('/api/admin/tasks/assign', { anomalyIds, inspectorId })
  }

  static getMyTasks(): Promise<any[]> {
    return ApiClient.get<any[]>('/api/mobile/tasks')
  }

  static importRealEstate(file: File): Promise<{ message: string; batchId: string }> {
    const formData = new FormData()
    formData.append('file', file)

    return ApiClient.postFormData<{ message: string; batchId: string }>('/api/import/real-estate', formData)
  }
}
