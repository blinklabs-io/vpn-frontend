import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { checkClientAvailable } from '../client'
  
interface PollingState {
  isPolling: boolean
  clientId: string | null
  attempts: number
  maxAttempts: number
}

export function useClientPolling() {
  const [pollingState, setPollingState] = useState<PollingState>({
    isPolling: false,
    clientId: null,
    attempts: 0,
    maxAttempts: 20 // 20 minutes max (20 * 60 seconds)
  })
  
  const queryClient = useQueryClient()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startPolling = (clientId: string) => {
    setPollingState({
      isPolling: true,
      clientId,
      attempts: 0,
      maxAttempts: 20
    })
  }

  const stopPolling = () => {
    setPollingState(prev => ({
      ...prev,
      isPolling: false,
      clientId: null,
      attempts: 0
    }))
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!pollingState.isPolling || !pollingState.clientId) {
      return
    }

    const pollClient = async () => {
      try {
        const response = await checkClientAvailable({ id: pollingState.clientId! })
        
        // Check if client is available (assuming success means available)
        if (response && !response.msg) {
          // Client is available, stop polling and refresh client list
          stopPolling()
          
          // Invalidate and refetch client list to get the new instance
          await queryClient.invalidateQueries({ queryKey: ['clientList'] })
          
          return
        }
        
        // Increment attempts
        setPollingState(prev => ({
          ...prev,
          attempts: prev.attempts + 1
        }))
        
        // Stop polling if max attempts reached
        if (pollingState.attempts >= pollingState.maxAttempts) {
          stopPolling()
        }
        
      } catch (error) {
        console.error('Error polling client availability:', error)
        
        // Increment attempts even on error
        setPollingState(prev => ({
          ...prev,
          attempts: prev.attempts + 1
        }))
        
        // Stop polling if max attempts reached
        if (pollingState.attempts >= pollingState.maxAttempts) {
          stopPolling()
        }
      }
    }

    // Poll immediately, then every 60 seconds
    pollClient()
    
    intervalRef.current = setInterval(pollClient, 60000) // 60 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [pollingState.isPolling, pollingState.clientId, pollingState.attempts, pollingState.maxAttempts, queryClient])

  return {
    isPolling: pollingState.isPolling,
    clientId: pollingState.clientId,
    attempts: pollingState.attempts,
    maxAttempts: pollingState.maxAttempts,
    startPolling,
    stopPolling
  }
}
