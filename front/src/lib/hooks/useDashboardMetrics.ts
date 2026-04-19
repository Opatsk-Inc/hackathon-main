import { useQuery } from '@tanstack/react-query'
import { AdminService } from '../api/admin.service'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => AdminService.getDashboardMetrics(),
    staleTime: 5000,
    refetchInterval: 30000,
  })
}
