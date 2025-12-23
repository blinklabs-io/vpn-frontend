import { Link } from "react-router";

const PrivacyPolicy = () => {
  return (
    <div className="flex flex-col relative pt-16 min-h-screen overflow-hidden">
      <div className="absolute -top-40 -left-32 w-[420px] h-[420px] bg-blue-500/20 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-24 w-[420px] h-[420px] bg-purple-500/20 blur-[160px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
        </div>

        <div className="bg-gradient-to-br from-[#00000066] to-[#1a1a2e66] rounded-2xl p-10 backdrop-blur-xl border border-[#ffffff2a] shadow-2xl">
          <div className="space-y-10 text-gray-300">
            {/* Introduction */}
            <section className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
                1. Introduction
              </h2>
              <div className="space-y-4">
                <p className="leading-relaxed text-gray-300">
                  This Privacy Policy describes how NABU VPN ("we," "our," or
                  "us") collects, uses, and protects information when you use
                  our VPN service and website. By accessing or using our
                  services, you agree to the terms outlined in this Privacy
                  Policy.
                </p>
                <p className="leading-relaxed text-gray-300">
                  We are committed to protecting your privacy and maintaining
                  the confidentiality of your personal information. This policy
                  explains our data practices and your rights regarding your
                  information.
                </p>
              </div>
            </section>

            {/* Our Commitment */}
            <section className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-4">
                2. Our Commitment to Privacy
              </h2>
              <div className="space-y-4">
                <p className="leading-relaxed text-gray-300">
                  Privacy is a fundamental right. NABU VPN operates on the
                  principle of minimal data collection and maximum user privacy
                  protection. We have designed our service to collect as little
                  information as possible while maintaining operational
                  functionality.
                </p>
                <p className="leading-relaxed text-gray-300">
                  NABU VPN does not collect, log, store, or track any data
                  related to VPN usage other than machine aggregate network
                  bandwidth usage. No VPN data is persisted beyond what is
                  necessary for service operation. All VPN traffic is encrypted
                  end-to-end.
                </p>
                <p className="leading-relaxed text-gray-300">
                  We make every reasonable effort to ensure your privacy and
                  maintain our ability to comply with legal requirements. This
                  is best accomplished by not collecting unnecessary data on our
                  users' activities.
                </p>
              </div>
            </section>

            {/* Account Information */}
            <section className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent mb-4">
                3. Account Information
              </h2>
              <div className="space-y-4">
                <p className="leading-relaxed text-gray-300">
                  NABU VPN accounts are created using the public key address of
                  a Cardano mainnet wallet. This approach provides a
                  pseudoanonymous unique identifier for account ownership
                  without requiring traditional personal information such as
                  email addresses or social media accounts.
                </p>
                <p className="leading-relaxed text-gray-300">
                  All account information is derived from publicly available
                  data published to the Cardano blockchain. As such, there is no
                  expectation of privacy regarding account existence or
                  expiration dates, as this information is publicly verifiable
                  on the blockchain.
                </p>
                <p className="leading-relaxed text-gray-300">
                  We do not collect, store, or process any personal data about
                  our users beyond what is necessary for account identification
                  and service provision.
                </p>
              </div>
            </section>

            {/* Data Collection */}
            <section className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
                4. Data Collection Practices
              </h2>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-3">
                  4.1 Minimal Data Collection
                </h3>
                <p className="leading-relaxed text-gray-300">
                  We collect only the minimal amount of data required to
                  maintain operational services. Our VPN service operates as a
                  "no-log" service, meaning we commit to not tracking or storing
                  persistent data on user activity or traffic.
                </p>

                <h3 className="text-lg font-medium text-white mb-3">
                  4.2 What We Do Not Collect
                </h3>
                <ul className="list-disc list-inside text-gray-300 leading-relaxed space-y-2 ml-4">
                  <li>VPN traffic logs or content</li>
                  <li>VPC flow logs</li>
                  <li>Load balancer logs</li>
                  <li>User browsing history or destinations</li>
                  <li>Personal identification information</li>
                  <li>Email addresses or contact information</li>
                </ul>

                <p className="leading-relaxed text-gray-300">
                  Any operational session data is ephemeral and used solely to
                  maintain active services. No persistent log files are stored
                  on our servers.
                </p>

                <h3 className="text-lg font-medium text-white mb-3">
                  4.3 Legal Compliance
                </h3>
                <p className="leading-relaxed text-gray-300">
                  While we operate within the United States and will comply with
                  applicable law enforcement or legal requirements, we can only
                  provide information that we actually possess. Our no-log
                  policy means we have minimal data to share with authorities.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
                5. Third-Party Services and Intermediaries
              </h2>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-3">
                  5.1 Service Providers
                </h3>
                <p className="leading-relaxed text-gray-300">
                  Our services rely on third-party infrastructure providers,
                  including AWS for VPN services and Cloudflare for website
                  hosting. These providers may have access to certain technical
                  information such as IP addresses and connection metadata.
                </p>

                <h3 className="text-lg font-medium text-white mb-3">
                  5.2 Website Analytics
                </h3>
                <p className="leading-relaxed text-gray-300">
                  Cloudflare provides basic website analytics including
                  aggregate traffic data and country of origin (derived from IP
                  addresses) for this website only. This data is retained for 30
                  days and does not include VPN service usage.
                </p>

                <h3 className="text-lg font-medium text-white mb-3">
                  5.3 ISP and Network Monitoring
                </h3>
                <p className="leading-relaxed text-gray-300">
                  Your Internet Service Provider (ISP) and other network
                  intermediaries may be able to detect your connection to our
                  VPN service through traffic analysis. However, they cannot see
                  the content of your encrypted traffic or your browsing
                  activities.
                </p>

                <h3 className="text-lg font-medium text-white mb-3">
                  5.4 User Responsibility
                </h3>
                <p className="leading-relaxed text-gray-300">
                  Users should be aware that logging into online accounts while
                  using the VPN may expose additional information. To maintain
                  maximum privacy, consider using different accounts for VPN and
                  non-VPN activities to prevent correlation of your real and VPN
                  IP addresses.
                </p>
              </div>
            </section>

            {/* Limitations and Disclaimers */}
            <section className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent mb-4">
                6. Limitations and Disclaimers
              </h2>
              <div className="space-y-4">
                <p className="leading-relaxed text-gray-300">
                  While NABU VPN operates a secure and private service, we
                  cannot guarantee complete security or absolute privacy. Users
                  are responsible for ensuring compliance with applicable laws
                  and regulations in their jurisdiction.
                </p>
                <p className="leading-relaxed text-gray-300">
                  Users have the ultimate responsibility for their own data and
                  privacy practices. We recommend that users educate themselves
                  about privacy best practices and use our service in accordance
                  with their local laws.
                </p>
                <p className="leading-relaxed text-gray-300">
                  This service is provided "as is" without warranties of any
                  kind, either express or implied, including but not limited to
                  warranties of merchantability, fitness for a particular
                  purpose, or non-infringement.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent mb-4">
                7. Contact Information
              </h2>
              <div className="space-y-4">
                <p className="leading-relaxed text-gray-300">
                  If you have questions about this Privacy Policy or our data
                  practices, please contact us through our website or support
                  channels.
                </p>
                <p className="leading-relaxed text-gray-300">
                  We reserve the right to update this Privacy Policy at any
                  time. Changes will be posted on this page with an updated
                  "Last Modified" date. Continued use of our services after
                  changes constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>
          </div>
        </div>

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
  );
};

export default PrivacyPolicy;
