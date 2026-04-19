import { useQuery } from '@tanstack/react-query'
import { AdminService } from '../api/admin.service'

export function useDiscrepancies(batchId?: string) {
  return useQuery({
    queryKey: ['discrepancies', batchId],
    queryFn: () => AdminService.getDiscrepancies(batchId),
    staleTime: 5000,
  })
}
