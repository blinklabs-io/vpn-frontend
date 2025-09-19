import { Link } from 'react-router'
import { useState, useEffect, useRef } from 'react'

const HowItWorks = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [isMobile, setIsMobile] = useState(false)
  const isScrollingRef = useRef(false)

  const sections = [
    { id: 'overview', title: 'Overview', number: null },
    { id: 'signup', title: 'Website Signup Process', number: 1 },
    { id: 'validation', title: 'Smart Contract Validation', number: 2 },
    { id: 'indexer', title: 'Indexer Processing', number: 3 },
    { id: 'authentication', title: 'Profile Download Authentication', number: 4 },
    { id: 'setup', title: 'VPN Client Setup', number: 5 }
  ]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const scrollToSection = (sectionId: string) => {
    isScrollingRef.current = true
    setActiveSection(sectionId)
    
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      
      setTimeout(() => {
        isScrollingRef.current = false
      }, 1000)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current) return
      
      const scrollPosition = window.scrollY + 200
      
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex relative pt-16 min-h-screen overflow-hidden">
      {!isMobile && (
        <div className="w-80 fixed left-0 top-32 h-[calc(100vh-4rem)] overflow-y-auto z-20">
          <div className="p-6">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center">
                    {section.number && (
                      <div className="w-8 h-8 bg-transparent border border-white/30 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                        {section.number}
                      </div>
                    )}
                    <span className="text-sm font-medium">{section.title}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className={`flex-1 ${isMobile ? 'ml-0' : 'ml-70'}`}>
        <div className="max-w-4xl mx-auto px-8 py-16">
          <section id="overview" className="mb-16">
            <div className="bg-[#00000020] rounded-lg p-8 border border-[#ffffff10]">
              <h1 className="text-3xl font-semibold text-white mb-6">How It Works</h1>
              <p className="text-gray-300 text-lg leading-relaxed">
                Our VPN system consists of multiple components, including smart contracts, a custom chain
                indexer and API, a web frontend, and OpenVPN. These pieces work together to facilitate signup
                and management of your VPN subscription and access to the VPN tunnel in a manner that focuses
                on privacy.
              </p>
            </div>
          </section>

          <section id="signup" className="mb-16">
            <div className="bg-[#00000020] rounded-lg p-8 border border-[#ffffff10]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  1
                </div>
                <h2 className="text-2xl font-semibold text-white">Website Signup Process</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                The signup process typically starts on our website. While it's not strictly necessary to use
                our website to subscribe to our services, it does make things easier. Once you connect your
                wallet, we will query our API for any existing subscriptions, as well as for current region and
                plan information. Once you choose a plan and selection the option to purchase, the site will
                call our API with your wallet address and chosen plan information. This will build a transaction
                based on your wallet, which is then returned to the user to be signed by their wallet and
                submitted.
              </p>
            </div>
          </section>

          <section id="validation" className="mb-16">
            <div className="bg-[#00000020] rounded-lg p-8 border border-[#ffffff10]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  2
                </div>
                <h2 className="text-2xl font-semibold text-white">Smart Contract Validation</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                The signup transaction will be validated by a smart contract, checking that it conforms to
                available regions and plans, the datum matches the expected shape, all funds are the correct amounts
                and going to the correct places, and other various sanity checks.
              </p>
            </div>
          </section>

          <section id="indexer" className="mb-16">
            <div className="bg-[#00000020] rounded-lg p-8 border border-[#ffffff10]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  3
                </div>
                <h2 className="text-2xl font-semibold text-white">Indexer Processing</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Once the signup TX makes it into a block and on-chain, it will get picked up by our{' '}
                <a 
                  href="https://github.com/blinklabs-io/vpn-indexer" 
                  className="text-blue-400 hover:text-blue-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  custom indexer
                </a>.
                The client datum will be extracted and its information written to a SQLite database. A new client TLS
                certificate is generated and signed by our CA certificate, and a new VPN client config built and
                uploaded to a private S3 bucket.
              </p>
            </div>
          </section>

          <section id="authentication" className="mb-16">
            <div className="bg-[#00000020] rounded-lg p-8 border border-[#ffffff10]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  4
                </div>
                <h2 className="text-2xl font-semibold text-white">Profile Download Authentication</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Once a profile has been uploaded to S3, our API will allow fetching it by validating ownership of the
                wallet used to do the signup. This is done by generating a challenge string (the hex-encoded client
                ID and the current UNIX epoch time), signing this message with your wallet, and passing it to our API.
                We validate the signature of the challenge message against the wallet PKH provided at signup, and
                respond with a pre-signed S3 URL to fetch the client config.
              </p>
            </div>
          </section>

          <section id="setup" className="mb-16">
            <div className="bg-[#00000020] rounded-lg p-8 border border-[#ffffff10]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  5
                </div>
                <h2 className="text-2xl font-semibold text-white">VPN Client Setup</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">
                The downloaded VPN client config can be loaded into the OpenVPN client of your choice. The user's client
                TLS certificate will be validated against our CA certificate when authenticating to the VPN
                server.
              </p>
            </div>
          </section>

          <div className="text-center mt-16">
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 text-white border border-white/20 backdrop-blur-sm font-semibold rounded-xl shadow-lg hover:bg-gray-800 transition-colors"
            >
              <span className="mr-2">Back Home</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowItWorks
