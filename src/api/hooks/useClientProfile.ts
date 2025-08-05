import { useMutation } from '@tanstack/react-query'
import { getClientProfile } from '../client'
import { useWalletStore } from '../../stores/walletStore'

interface SignDataResponse {
  key: string
  signature: string
}

export function useClientProfile() {
  const { signMessage } = useWalletStore()

  return useMutation({
    mutationFn: async (clientId: string) => {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      console.log('Timestamp:', timestamp)
      const challenge = `${clientId}${timestamp}`
      
      const signResult = await signMessage(challenge) as SignDataResponse
      console.log('Sign result:', signResult)
      
      const profileRequest = {
        id: clientId,
        key: signResult.key,
        signature: signResult.signature
      }
      
      return await getClientProfile(profileRequest)
    },
    mutationKey: ['clientProfile'],
  })
}