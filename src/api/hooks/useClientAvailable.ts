import { useQuery } from '@tanstack/react-query'
import { checkClientAvailable } from '../client'
import type { ClientAvailableRequest } from '../types'

export function useClientAvailable(request: ClientAvailableRequest, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['clientAvailable', request],
    queryFn: async () => {
      const response = await checkClientAvailable(request)
      return response
    },
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  })
}