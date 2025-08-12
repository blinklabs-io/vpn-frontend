import { useQuery } from '@tanstack/react-query'
import { getClientList } from '../client'
import type { ClientListRequest } from '../types'

export function useClientList(request: ClientListRequest, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['clientList', request],
    queryFn: () => getClientList(request),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000, // 30 seconds
  })
}