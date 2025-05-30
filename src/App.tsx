import Navigation from './components/Navigation'
import FloatingWalletButton from './components/FloatingWalletButton'
import AppRoutes from './routes'

const VpnApp = () => {
  return (
    <>
      <Navigation />
      <AppRoutes />
      <FloatingWalletButton />
    </>
  )
}

export default VpnApp
