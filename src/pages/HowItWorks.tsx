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

        <div className="bg-[#00000033] rounded-lg p-8 backdrop-blur-sm border border-[#ffffff1a] mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">How It Works</h2>
          <div className="text-gray-300 text-center">

          <p className="mb-6">
          Our VPN system consists of multiple components, including smart contracts, a custom chain
          indexer and API, a web frontend, and OpenVPN. These pieces work together to facilitate signup
          and management of your VPN subscription and access to the VPN tunnel in a manner that focuses
          on privacy.
          </p>

          <p className="mb-6">
          The signup process typically starts on our website. While it's not strictly necessary to use
          our website to subscribe to our services, it does make things easier. Once you connect your
          wallet, we will query our API for any existing subscriptions, as well as for current region and
          plan information. Once you choose a plan and selection the option to purchase, the site will
          call our API with your wallet address and chosen plan information. This will build a transaction
          based on your wallet, which is then returned to the user to be signed by their wallet and
          submitted.
          </p>

          <p className="mb-6">
          The signup transaction will be validated by a smart contract, checking that it conforms to
          available regions and plans, the datum matches the expected shape, all funds are the correct amounts
          and going to the correct places, and other various sanity checks.
          </p>

          <p className="mb-6">
          Once the signup TX makes it into a block and on-chain, it will get picked up by our <a href="https://github.com/blinklabs-io/vpn-indexer">custom indexer</a>.
          The client datum will be extracted and its information written to a SQLite database. A new client TLS
          certificate is generated and signed by our CA certificate, and a new VPN client config built and
          uploaded to a private S3 bucket.
          </p>

          <p className="mb-6">
          Once a profile has been uploaded to S3, our API will allow fetching it by validating ownership of the
          wallet used to do the signup. This is done by generating a challenge string (the hex-encoded client
          ID and the current UNIX epoch time), signing this message with your wallet, and passing it to our API.
          We validate the signature of the challenge message against the wallet PKH provided at signup, and
          respond with a pre-signed S3 URL to fetch the client config.
          </p>

          <p className="mb-6">
          The downloaded VPN client config can be loaded into the OpenVPN client of your choice. The user's client
          TLS certificate will be validated against our CA certificate when authenticating to the VPN
          server.
          </p>

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
