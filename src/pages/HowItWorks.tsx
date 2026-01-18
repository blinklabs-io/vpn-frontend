import { Link } from "react-router";
import { useState } from "react";
import {
  shouldShowWireGuardUI,
  isOpenVpnAvailable,
} from "../components/ProtocolToggle";

const HowItWorks = () => {
  const [showOpenVpnDetails, setShowOpenVpnDetails] = useState(false);
  const [showWireGuardDetails, setShowWireGuardDetails] = useState(false);

  const wireGuardEnabled = shouldShowWireGuardUI();
  const openVpnEnabled = isOpenVpnAvailable();

  // Determine the primary protocol name for the overview
  const protocolName = wireGuardEnabled ? "WireGuard" : "OpenVPN";

  return (
    <div className="flex flex-col relative pt-16 min-h-screen overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-[#00000066] to-[#1a1a2e66] rounded-2xl p-10 backdrop-blur-xl border border-[#ffffff2a] shadow-2xl">
            <div className="space-y-12">
              <section id="overview" aria-labelledby="overview-title">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <h1 id="overview-title" className="text-3xl font-semibold text-white mb-6">
                    How It Works
                  </h1>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Our VPN system consists of multiple components, including
                    smart contracts, a custom chain indexer and API, a web
                    frontend, and {protocolName}. These pieces work together to
                    facilitate signup and management of your VPN subscription
                    and access to the VPN tunnel in a manner that focuses on
                    privacy.
                  </p>
                </div>
              </section>

              <section id="signup" aria-labelledby="signup-title">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      1
                    </div>
                    <h2 id="signup-title" className="text-2xl font-semibold text-white">
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

              <section id="validation" aria-labelledby="validation-title">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      2
                    </div>
                    <h2 id="validation-title" className="text-2xl font-semibold text-white">
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

              <section id="indexer" aria-labelledby="indexer-title">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      3
                    </div>
                    <h2 id="indexer-title" className="text-2xl font-semibold text-white">
                      Indexer and API
                    </h2>
                  </div>
                  {wireGuardEnabled ? (
                    <>
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
                        written to a SQLite database. For WireGuard subscriptions,
                        device registration and configuration generation happen
                        on-demand when you add devices through the web interface.
                      </p>

                      <p className="text-gray-300 leading-relaxed">
                        The on-chain data processed by our indexer is made available
                        for querying via our API. We also provide endpoints for
                        building transactions (for operations such as signup and
                        renewal), registering WireGuard devices, and generating
                        configurations. We explicitly do not log client IP addresses
                        in our API.
                      </p>
                    </>
                  ) : (
                    <>
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
                        written to a SQLite database. Your OpenVPN profile is then
                        generated and securely stored in S3.
                      </p>

                      <p className="text-gray-300 leading-relaxed">
                        The on-chain data processed by our indexer is made available
                        for querying via our API. We also provide endpoints for
                        building transactions (for operations such as signup and
                        renewal) and authenticated profile downloads. We explicitly
                        do not log client IP addresses in our API.
                      </p>
                    </>
                  )}
                </div>
              </section>

              <section id="authentication" aria-labelledby="authentication-title">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      4
                    </div>
                    <h2 id="authentication-title" className="text-2xl font-semibold text-white">
                      {wireGuardEnabled ? "Device Authentication" : "Profile Authentication"}
                    </h2>
                  </div>
                  {wireGuardEnabled ? (
                    <p className="text-gray-300 leading-relaxed">
                      For WireGuard, your device generates a cryptographic keypair
                      locally in your browser using the X25519 algorithm. The
                      private key never leaves your device—only the public key is
                      sent to our API. This is done by generating a challenge
                      string (the hex-encoded client ID and the current UNIX epoch
                      time), signing this message with your wallet using the CIP-8
                      message signing format, and passing it to our API along with
                      your WireGuard public key. We validate the signature against
                      the wallet PKH provided at signup, register your device, and
                      return the server configuration. A signed challenge is valid
                      for a limited period of time to help prevent replay attacks.
                    </p>
                  ) : (
                    <p className="text-gray-300 leading-relaxed">
                      Profile downloads are authenticated by signing a challenge
                      with your wallet. The challenge consists of the hex-encoded
                      client ID and the current UNIX epoch time, signed using the
                      CIP-8 message signing format. We validate the signature
                      against the wallet PKH provided at signup and respond with
                      a pre-signed S3 URL to download your profile. A signed
                      challenge is valid for a limited period of time to help
                      prevent replay attacks.
                    </p>
                  )}
                </div>
              </section>

              <section id="setup" aria-labelledby="setup-title">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      5
                    </div>
                    <h2 id="setup-title" className="text-2xl font-semibold text-white">
                      {wireGuardEnabled ? "WireGuard Server" : "OpenVPN Server"}
                    </h2>
                  </div>
                  {wireGuardEnabled ? (
                    <>
                      <p className="text-gray-300 leading-relaxed">
                        We run our WireGuard server instances in Kubernetes. WireGuard
                        is a modern VPN protocol that uses state-of-the-art cryptography
                        and has a minimal attack surface due to its small codebase.
                        We explicitly disable any logging, which means that we cannot
                        see the IP address that you connect with.
                      </p>

                      <p className="text-gray-300 leading-relaxed">
                        When connecting to the VPN server, your device's public key
                        is validated against registered devices for your subscription.
                        Each subscription supports up to 3 devices, allowing you to
                        connect from your phone, laptop, and desktop simultaneously.
                        By default, you will be provided with our hosted DNS servers
                        and a default route through the VPN, which prevents your ISP
                        from being able to see what you are doing on the VPN.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-300 leading-relaxed">
                        We run OpenVPN server instances from a{" "}
                        <a
                          href="https://github.com/blinklabs-io/docker-openvpn"
                          className="text-blue-400 hover:text-blue-300 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          custom docker image
                        </a>{" "}
                        in Kubernetes with logging explicitly disabled, which means
                        that we cannot see the IP address that you connect with.
                      </p>

                      <p className="text-gray-300 leading-relaxed">
                        When connecting to the VPN server, your client certificate
                        is validated against our CA and checked against a CRL
                        (certificate revocation list) to enforce expiration. By
                        default, you will be provided with our hosted DNS servers
                        and a default route through the VPN, which prevents your ISP
                        from being able to see what you are doing on the VPN.
                      </p>
                    </>
                  )}
                </div>
              </section>

              <section id="infrastructure" aria-labelledby="infrastructure-title">
                <div className="bg-white/10 rounded-xl p-8 border border-white/20 backdrop-blur-xl">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      6
                    </div>
                    <h2 id="infrastructure-title" className="text-2xl font-semibold text-white">
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

            {/* Show "Looking for OpenVPN?" when WireGuard is primary and OpenVPN is available */}
            {wireGuardEnabled && openVpnEnabled && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setShowOpenVpnDetails(!showOpenVpnDetails)}
                  className="text-sm text-[#E1B8FF] hover:text-white transition-colors cursor-pointer underline underline-offset-2"
                >
                  Looking for OpenVPN?
                </button>

                {showOpenVpnDetails && (
                  <div className="mt-6 bg-white/5 rounded-xl p-6 border border-white/10 text-left">
                    <h3 className="text-lg font-semibold text-white mb-3">OpenVPN (Compatibility)</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      OpenVPN is available for devices that don't support WireGuard. The main
                      differences in how OpenVPN works:
                    </p>
                    <ul className="text-gray-300 text-sm space-y-2 list-disc list-inside">
                      <li>
                        A client TLS certificate is generated server-side and signed by our CA
                        certificate, then bundled into an .ovpn config file uploaded to S3.
                      </li>
                      <li>
                        Profile downloads are authenticated by signing a challenge with your wallet,
                        and we respond with a pre-signed S3 URL.
                      </li>
                      <li>
                        We run OpenVPN server instances from a{" "}
                        <a
                          href="https://github.com/blinklabs-io/docker-openvpn"
                          className="text-blue-400 hover:text-blue-300 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          custom docker image
                        </a>{" "}
                        with logging explicitly disabled.
                      </li>
                      <li>
                        Your client certificate is validated against our CA and checked against a
                        CRL (certificate revocation list) to enforce expiration.
                      </li>
                      <li>
                        OpenVPN subscriptions support one device per subscription (no multi-device).
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Show "Looking for WireGuard?" when OpenVPN is primary (WireGuard coming soon) */}
            {!wireGuardEnabled && openVpnEnabled && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setShowWireGuardDetails(!showWireGuardDetails)}
                  className="text-sm text-[#E1B8FF] hover:text-white transition-colors cursor-pointer underline underline-offset-2"
                >
                  Looking for WireGuard?
                </button>

                {showWireGuardDetails && (
                  <div className="mt-6 bg-white/5 rounded-xl p-6 border border-white/10 text-left">
                    <h3 className="text-lg font-semibold text-white mb-3">WireGuard (Coming Soon)</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      WireGuard is a modern VPN protocol that offers faster speeds, better
                      performance, and multi-device support (up to 3 devices per subscription).
                      WireGuard support is coming soon to NABU VPN.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="text-center mt-8">
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
                  aria-hidden="true"
                  focusable="false"
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
  );
};

export default HowItWorks;
