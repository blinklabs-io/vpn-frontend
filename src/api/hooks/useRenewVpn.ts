import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { buildRenewTransaction } from '../client'
import type { TxRenewRequest, TxRenewResponse } from '../types'

export function useRenewVpn(
  options?: UseMutationOptions<TxRenewResponse, Error, TxRenewRequest>
) {
  return useMutation({
    mutationFn: (renewData: TxRenewRequest) => 
      buildRenewTransaction(renewData),
    ...options,
  })
}