import Navigation from './components/Navigation'
import AppRoutes from './routes'

const VpnApp = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)]">
      <Navigation />
      <AppRoutes />
    </div>
  )
}

export default VpnApp
