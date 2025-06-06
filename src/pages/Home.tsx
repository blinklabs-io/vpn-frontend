import { Link } from 'react-router'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            blinklabs vpn
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            blinklabs vpn
          </p>
          <div className="space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200">
              blinklabs vpn
            </button>
            <Link
              to="/how-it-works"
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border border-blue-600 transition duration-200 inline-block"
            >
              blinklabs vpn
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">🔒 blinklabs vpn</h3>
            <p className="text-gray-600">blinklabs vpn</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">⚡ blinklabs vpn</h3>
            <p className="text-gray-600">blinklabs vpn</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">🌍 blinklabs vpn</h3>
            <p className="text-gray-600">blinklabs vpn</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home