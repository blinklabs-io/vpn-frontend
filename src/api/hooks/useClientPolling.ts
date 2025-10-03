import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { checkClientAvailableWithGraceful404 } from '../client'
import { 
  updateTransactionStatus, 
  updateTransactionAttempts,
  getActivePendingTransactions 
} from '../../utils/pendingTransactions'
  
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

  const startPolling = useCallback((clientId: string, initialAttempts: number = 0) => {
    setPollingState({
      isPolling: true,
      clientId,
      attempts: initialAttempts,
      maxAttempts: 20
    })
  }, [])

  const stopPolling = useCallback((markComplete: boolean = false) => {
    setPollingState(prev => {
      const currentClientId = prev.clientId
      
      if (markComplete && currentClientId) {
        updateTransactionStatus(currentClientId, 'complete')
      }
      
      return {
        ...prev,
        isPolling: false,
        clientId: null,
        attempts: 0
      }
    })
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    const pendingTransactions = getActivePendingTransactions()
    
    if (pendingTransactions.length > 0) {
      const firstPending = pendingTransactions[0]
      startPolling(firstPending.id, firstPending.attempts)
    }
  }, [startPolling])

  useEffect(() => {
    if (!pollingState.isPolling || !pollingState.clientId) {
      return
    }

    const pollClient = async () => {
      try {
        const response = await checkClientAvailableWithGraceful404({ id: pollingState.clientId! })
        
        
        if (response !== null) {
          stopPolling(true)
          
          await queryClient.invalidateQueries({ queryKey: ['clientList'] })
          
          await queryClient.refetchQueries({ queryKey: ['clientList'] })
          
          return
        }
        
        
        const newAttempts = pollingState.attempts + 1
        setPollingState(prev => ({
          ...prev,
          attempts: newAttempts
        }))
        
        if (pollingState.clientId) {
          updateTransactionAttempts(pollingState.clientId, newAttempts)
        }
        
        if (newAttempts >= pollingState.maxAttempts) {
          stopPolling(false)
        }
        
      } catch (error) {
        console.error('Error polling client availability:', error)
        
        const newAttempts = pollingState.attempts + 1
        setPollingState(prev => ({
          ...prev,
          attempts: newAttempts
        }))
        
        if (pollingState.clientId) {
          updateTransactionAttempts(pollingState.clientId, newAttempts)
        }
              
        if (newAttempts >= pollingState.maxAttempts) {
          stopPolling(false)
        }
      }
    }

    const initialTimeout = setTimeout(() => {
      pollClient()
      intervalRef.current = setInterval(pollClient, 40000)
    }, 20000)

    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [pollingState.isPolling, pollingState.clientId, pollingState.attempts, pollingState.maxAttempts, queryClient, stopPolling])

  return {
    isPolling: pollingState.isPolling,
    clientId: pollingState.clientId,
    attempts: pollingState.attempts,
    maxAttempts: pollingState.maxAttempts,
    startPolling,
    stopPolling
  }
}
