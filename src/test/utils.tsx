import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { vi } from 'vitest'

// Create a test query client
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: false,
      gcTime: Infinity,
    },
    mutations: { 
      retry: false,
    },
  },
})

// Custom render function with providers
interface CustomRenderOptions extends RenderOptions {
  queryClient?: QueryClient
  router?: boolean
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    router = true,
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const content = (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    return router ? <BrowserRouter>{content}</BrowserRouter> : content
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Mock API responses
export const createMockApiResponse = function<T>(data: T, delay = 0): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const createMockApiError = (message = 'API Error', status = 500, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message) as Error & { status: number }
      error.status = status
      reject(error)
    }, delay)
  })
}

// Wallet test utilities
export const mockWalletApi = {
  getRewardAddresses: vi.fn().mockResolvedValue(['stake1234567890']),
  signData: vi.fn().mockResolvedValue({ signature: 'mock-signature', key: 'mock-key' }),
  getBalance: vi.fn().mockResolvedValue('1000000'),
  getNetworkId: vi.fn().mockResolvedValue(1),
}

export const setupWalletMocks = () => {
  const mockEnable = vi.fn().mockResolvedValue(mockWalletApi)
  
  window.cardano = {
    nami: { 
      name: 'Nami',
      icon: 'nami-icon',
      version: '1.0.0',
      enable: mockEnable, 
      isEnabled: vi.fn().mockReturnValue(true) 
    },
    eternl: { 
      name: 'Eternl',
      icon: 'eternl-icon',
      version: '1.0.0',
      enable: mockEnable, 
      isEnabled: vi.fn().mockReturnValue(true) 
    },
    flint: { 
      name: 'Flint',
      icon: 'flint-icon',
      version: '1.0.0',
      enable: mockEnable, 
      isEnabled: vi.fn().mockReturnValue(true) 
    },
    yoroi: { 
      name: 'Yoroi',
      icon: 'yoroi-icon',
      version: '1.0.0',
      enable: mockEnable, 
      isEnabled: vi.fn().mockReturnValue(true) 
    },
    gerowallet: { 
      name: 'Gero',
      icon: 'gero-icon',
      version: '1.0.0',
      enable: mockEnable, 
      isEnabled: vi.fn().mockReturnValue(true) 
    },
  }
  
  return { mockEnable, mockWalletApi }
}

export { default as userEvent } from '@testing-library/user-event' 