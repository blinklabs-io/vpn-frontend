import { Link } from "react-router";

const HowItWorks = () => {
  return (
    <div className="relative pt-16 min-h-screen overflow-hidden bg-black/30">
      <div className="absolute -top-40 -left-32 w-[420px] h-[420px] bg-blue-500/20 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-24 w-[420px] h-[420px] bg-purple-500/20 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-white/10 rounded-2xl p-10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="space-y-12">
              <section id="overview">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <h1 className="text-3xl font-semibold text-white mb-6">
                    How It Works
                  </h1>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Our VPN system consists of multiple components, including
                    smart contracts, a custom chain indexer and API, a web
                    frontend, and OpenVPN. These pieces work together to
                    facilitate signup and management of your VPN subscription
                    and access to the VPN tunnel in a manner that focuses on
                    privacy.
                  </p>
                </div>
              </section>

              <section id="signup">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      1
                    </div>
                    <h2 className="text-2xl font-semibold text-white">
                      Web Frontend
                    </h2>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Our{" "}
                    <a
                      href="https://github.com/blinklabs-io/vpn-frontend"
                      className="text-blue-400 hover:text-blue-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      web frontend
                    </a>{" "}
                    provides a convenient interface over our API for managing
                    your VPN subscriptions. It allows connecting a CIP-30
                    compatible wallet, which is used to determine the wallet
                    address to query our backend API for subscriptions, as well
                    as for authentication and transaction signing. While we take
                    special care to not log your IP address, it will be visible
                    to Cloudflare where the web frontend is hosted.
                  </p>
                </div>
              </section>

              <section id="validation">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      2
                    </div>
                    <h2 className="text-2xl font-semibold text-white">
                      Smart Contract
                    </h2>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Our{" "}
                    <a
                      href="https://github.com/blinklabs-io/vpn-contracts"
                      className="text-blue-400 hover:text-blue-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      smart contract
                    </a>{" "}
                    facilitates all on-chain operations, such as signups and
                    renewals. It validates that all subscriptions conform to
                    available regions and plans, the datum matches the expected
                    shape, all funds are the correct amounts and going to the
                    correct places, and other various sanity checks. All
                    subscription information is stored on-chain in the smart
                    contract's address. Because all interactions with smart
                    contracts are public, the wallet address that you signed up
                    with, as well as your chosen plan and region, are visible to
                    anybody.
                  </p>

                  <p className="text-gray-300 leading-relaxed">
                    The current regions and plans are provided by a reference
                    input containing an asset with an attached datum (refdata) in
                    the TX output. Signups consist of a mint operation for a
                    client asset with an associated datum containing the owner's
                    payment PKH, the chosen region, and the subscription
                    expiration in UNIX epoch time. This asset stays within the
                    contract and further operations on it are validated by
                    signing the TX with the owner's payment PKH. A subscription
                    renewal involves spending the current client asset from the
                    contract and sending it back to the contract with an updated
                    datum. Any updates to the expiration in the client datum are
                    validated against any current expiration and the plans
                    defined in the refdata.
                  </p>
                </div>
              </section>

              <section id="indexer">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      3
                    </div>
                    <h2 className="text-2xl font-semibold text-white">
                      Indexer and API
                    </h2>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Once the signup TX makes it into a block and on-chain, it
                    will get picked up by our{" "}
                    <a
                      href="https://github.com/blinklabs-io/vpn-indexer"
                      className="text-blue-400 hover:text-blue-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      custom indexer
                    </a>
                    . The client datum will be extracted and its information
                    written to a SQLite database. A new client TLS certificate is
                    generated and signed by our CA certificate, and a new VPN
                    client config built and uploaded to a private S3 bucket.
                  </p>

                  <p className="text-gray-300 leading-relaxed">
                    The on-chain data processed by our indexer is made available
                    for querying via our API. We also provide endpoints for
                    building transactions (for operations such as signup and
                    renewal) and fetching generated client profiles. We
                    explicitly do not log client IP addresses in our API.
                  </p>
                </div>
              </section>

              <section id="authentication">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      4
                    </div>
                    <h2 className="text-2xl font-semibold text-white">
                      Profile Download Authentication
                    </h2>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Once a client profile has been generated and uploaded to S3
                    by our indexer, our API will allow fetching it by validating
                    ownership of the wallet used to do the signup. This is done
                    by generating a challenge string (the hex-encoded client ID
                    and the current UNIX epoch time), signing this message with
                    your wallet using the CIP-8 message signing format, and
                    passing it to our API. We validate the signature of the
                    challenge message against the wallet PKH provided at signup,
                    and respond with a pre-signed S3 URL to fetch the client
                    config. A particular signed challenge string is valid for a
                    limited period of time to help prevent replay attacks.
                  </p>
                </div>
              </section>

              <section id="setup">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      5
                    </div>
                    <h2 className="text-2xl font-semibold text-white">
                      OpenVPN Server
                    </h2>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    We run our OpenVPN server instances from a{" "}
                    <a
                      href="https://github.com/blinklabs-io/docker-openvpn"
                      className="text-blue-400 hover:text-blue-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      custom docker image
                    </a>{" "}
                    running in Kubernetes. Our image explicitly disables any
                    logging from OpenVPN, which means that we cannot see the IP
                    address that you connect with.
                  </p>

                  <p className="text-gray-300 leading-relaxed">
                    When connecting to the VPN server, the user's client TLS
                    certificate from their downloaded profile will be validated
                    against our CA certificate when authenticating to the VPN
                    server. The client certificate will also be checked against a
                    CRL (certificate revocation list) maintained by our custom
                    indexer to enforce expiration. By default, you will be
                    provided with our hosted DNS servers a default route through
                    the VPN, which prevents your ISP from being able to see what
                    you are doing on the VPN.
                  </p>
                </div>
              </section>

              <section id="infrastructure">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      6
                    </div>
                    <h2 className="text-2xl font-semibold text-white">
                      Infrastructure
                    </h2>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Our infrastructure is based in AWS and is managed via a{" "}
                    <a
                      href="https://github.com/blinklabs-io/vpn-infrastructure"
                      className="text-blue-400 hover:text-blue-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      custom Terraform and helmfile setup
                    </a>
                    . Secrets are encrypted at rest using SOPS and stored within
                    the git repo. We utilize EKS for running containers, with the
                    AWS load balancer controller for managing ingress. We use S3
                    for storage of generated client configs. We purposely do not
                    configure access logging on any load balancer or S3 bucket to
                    prevent storing information about people accessing our
                    services.
                  </p>
                </div>
              </section>
            </div>

            <div className="text-center mt-12">
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
    </div>
  );
};

export default HowItWorks;
