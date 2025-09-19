import { Link } from 'react-router'

const HowItWorks = () => {
  return (
    <div className="flex flex-col relative pt-16 min-h-screen overflow-hidden">
      <div className="max-6xl mx-auto px-6 py-16 relative z-10">
        <div className="rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-semibold text-white mb-12 text-center">How It Works</h2>
          
          <div className="relative">
            <div className="bg-[#00000020] rounded-lg p-4 border border-[#ffffff10] mb-10 max-w-4xl mx-auto">
              <p className="text-gray-300 text-md leading-relaxed text-center">
                Our VPN system consists of multiple components, including smart contracts, a custom chain
                indexer and API, a web frontend, and OpenVPN. These pieces work together to facilitate signup
                and management of your VPN subscription and access to the VPN tunnel in a manner that focuses
                on privacy.
              </p>
            </div>

            <div className="relative max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="relative">
                  <div className="bg-[#00000020] rounded-lg p-6 border border-[#ffffff10] h-100 flex flex-col">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg">
                        1
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4 text-center">Website Signup Process</h3>
                    <p className="text-gray-300 leading-relaxed text-sm flex-grow">
                      The signup process typically starts on our website. While it's not strictly necessary to use
                      our website to subscribe to our services, it does make things easier. Once you connect your
                      wallet, we will query our API for any existing subscriptions, as well as for current region and
                      plan information. Once you choose a plan and selection the option to purchase, the site will
                      call our API with your wallet address and chosen plan information. This will build a transaction
                      based on your wallet, which is then returned to the user to be signed by their wallet and
                      submitted.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-[#00000020] rounded-lg p-6 border border-[#ffffff10] h-100 flex flex-col">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg">
                        2
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4 text-center">Smart Contract Validation</h3>
                    <p className="text-gray-300 leading-relaxed text-sm flex-grow">
                      The signup transaction will be validated by a smart contract, checking that it conforms to
                      available regions and plans, the datum matches the expected shape, all funds are the correct amounts
                      and going to the correct places, and other various sanity checks.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-[#00000020] rounded-lg p-6 border border-[#ffffff10] h-100 flex flex-col">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg">
                        3
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4 text-center">Indexer Processing</h3>
                    <p className="text-gray-300 leading-relaxed text-sm flex-grow">
                      Once the signup TX makes it into a block and on-chain, it will get picked up by our <a href="https://github.com/blinklabs-io/vpn-indexer" className="text-blue-400 hover:text-blue-300 underline">custom indexer</a>.
                      The client datum will be extracted and its information written to a SQLite database. A new client TLS
                      certificate is generated and signed by our CA certificate, and a new VPN client config built and
                      uploaded to a private S3 bucket.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="relative">
                  <div className="bg-[#00000020] rounded-lg p-6 border border-[#ffffff10] h-100 flex flex-col">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg">
                        4
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4 text-center">Profile Download Authentication</h3>
                    <p className="text-gray-300 leading-relaxed text-sm flex-grow">
                      Once a profile has been uploaded to S3, our API will allow fetching it by validating ownership of the
                      wallet used to do the signup. This is done by generating a challenge string (the hex-encoded client
                      ID and the current UNIX epoch time), signing this message with your wallet, and passing it to our API.
                      We validate the signature of the challenge message against the wallet PKH provided at signup, and
                      respond with a pre-signed S3 URL to fetch the client config.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-[#00000020] rounded-lg p-6 border border-[#ffffff10] h-100 flex flex-col">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg">
                        5
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4 text-center">VPN Client Setup</h3>
                    <p className="text-gray-300 leading-relaxed text-sm flex-grow">
                      The downloaded VPN client config can be loaded into the OpenVPN client of your choice. The user's client
                      TLS certificate will be validated against our CA certificate when authenticating to the VPN
                      server.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
  )
}

export default HowItWorks
