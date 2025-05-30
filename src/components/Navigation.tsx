import { Link, useLocation } from 'react-router'

const Navigation = () => {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">
            blinklabs vpn
          </Link>

          <div className="flex space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive('/')
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            <Link
              to="/how-it-works"
              className={`font-medium transition-colors ${
                isActive('/how-it-works')
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              How It Works
            </Link>
            <Link
              to="/privacy-policy"
              className={`font-medium transition-colors ${
                isActive('/privacy-policy')
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation