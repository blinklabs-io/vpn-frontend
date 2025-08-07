import Navigation from './components/Navigation'
import AppRoutes from './routes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api'
import WalletProvider from './components/WalletProvider'

const VpnApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <div className="flex flex-col min-h-screen bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)]">
          <Navigation />
          <AppRoutes />
        </div>
      </WalletProvider>
    </QueryClientProvider>
  )
}

export default VpnApp
