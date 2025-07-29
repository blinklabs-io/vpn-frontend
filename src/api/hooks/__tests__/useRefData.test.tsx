import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRefData } from '../useRefData'
import { createTestQueryClient } from '../../../test/utils'
import * as client from '../../client'

vi.mock('../../client', () => ({
  get: vi.fn(),
}))

const mockedGet = vi.mocked(client.get)

describe('useRefData', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.resetAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should fetch refdata successfully', async () => {
    const mockData = {
      categories: ['category1', 'category2'],
      regions: ['us-east', 'eu-west'],
      services: ['service-a', 'service-b'],
    }

    mockedGet.mockResolvedValueOnce(mockData)

    const { result } = renderHook(() => useRefData(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockedGet).toHaveBeenCalledWith('/refdata')
  })

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch refdata'
    mockedGet.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useRefData(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(new Error(errorMessage))
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('should use custom query options', async () => {
    const mockData = { test: 'data' }
    mockedGet.mockResolvedValueOnce(mockData)

    const { result } = renderHook(
      () => useRefData({ queryKey: ['refdata'], enabled: false }),
      { wrapper }
    )

    // Should not make the API call when enabled is false
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('should refetch data when refetch is called', async () => {
    const mockData1 = { version: 1 }
    const mockData2 = { version: 2 }

    mockedGet
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2)

    const { result } = renderHook(() => useRefData(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockData1)

    await result.current.refetch()

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2)
    })

    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('should cache data correctly', async () => {
    const mockData = { cached: true }
    mockedGet.mockResolvedValue(mockData)

    const sharedQueryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          gcTime: Infinity,
          staleTime: Infinity,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
        mutations: { 
          retry: false,
        },
      },
    })
    
    const sharedWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={sharedQueryClient}>{children}</QueryClientProvider>
    )

    const { result: result1, unmount: unmount1 } = renderHook(
      () => useRefData(),
      { wrapper: sharedWrapper }
    )

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true)
    })

    expect(result1.current.data).toEqual(mockData)
    unmount1()

    const { result: result2 } = renderHook(() => useRefData(), { wrapper: sharedWrapper })

    expect(result2.current.data).toEqual(mockData)
    expect(result2.current.isLoading).toBe(false)
    expect(result2.current.isSuccess).toBe(true)
    
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('should handle different response structures', async () => {
    const mockData = {
      providers: ['provider1', 'provider2'],
      config: {
        timeout: 5000,
        retries: 3,
      },
      metadata: {
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00Z',
      },
    }

    mockedGet.mockResolvedValueOnce(mockData)

    const { result } = renderHook(() => useRefData(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.data?.providers).toEqual(['provider1', 'provider2'])
    expect((result.current.data as { config: { timeout: number } }).config.timeout).toBe(5000)
  })
}) 