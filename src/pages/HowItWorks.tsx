import { Link } from 'react-router'

const HowItWorks = () => {
  return (
    <div className="flex flex-col bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)] relative pt-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Lorem Ipsum</h1>
          <p className="text-gray-300 text-lg">Dolor sit amet consectetur adipiscing elit</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-[#00000033] rounded-lg p-6 backdrop-blur-sm border border-[#ffffff1a] text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#1C246E] text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Lorem Ipsum</h3>
            <p className="text-gray-300 text-sm">
              Dolor sit amet consectetur adipiscing elit sed do eiusmod tempor
            </p>
          </div>

          <div className="bg-[#00000033] rounded-lg p-6 backdrop-blur-sm border border-[#ffffff1a] text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#1C246E] text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Dolor Sit</h3>
            <p className="text-gray-300 text-sm">
              Amet consectetur adipiscing elit sed do eiusmod tempor incididunt
            </p>
          </div>

          <div className="bg-[#00000033] rounded-lg p-6 backdrop-blur-sm border border-[#ffffff1a] text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#1C246E] text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Amet Consectetur</h3>
            <p className="text-gray-300 text-sm">
              Adipiscing elit sed do eiusmod tempor incididunt ut labore dolore
            </p>
          </div>
        </div>

        <div className="bg-[#00000033] rounded-lg p-8 backdrop-blur-sm border border-[#ffffff1a] mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Lorem Ipsum Dolor</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🔒 Lorem Ipsum</h3>
              <p className="text-sm">Dolor sit amet consectetur adipiscing elit sed do eiusmod tempor</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">⚡ Dolor Sit</h3>
              <p className="text-sm">Amet consectetur adipiscing elit sed do eiusmod tempor incididunt</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🌐 Amet Consectetur</h3>
              <p className="text-sm">Adipiscing elit sed do eiusmod tempor incididunt ut labore dolore</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">💎 Tempor Incididunt</h3>
              <p className="text-sm">Ut labore et dolore magna aliqua ut enim ad minim veniam</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 bg-white text-[#1C246E] font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Lorem Ipsum
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HowItWorks
