import { Link } from "react-router";

const PrivacyPolicy = () => {
  return (
    <div className="flex flex-col bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)] relative pt-16 min-h-screen overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-300 text-lg font-mono">
            Know your assumptions
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#00000066] to-[#1a1a2e66] rounded-2xl p-8 backdrop-blur-xl border border-[#ffffff2a] shadow-2xl">
          <div className="space-y-8 text-gray-300">
            <section className="p-4 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                  Our Commitment to Privacy
                </h2>
              </div>
              <p className="leading-relaxed font-mono text-sm">
                Privacy is a right. This policy describes the terms for use of
                this website and the NABU VPN service. By accessing or using
                this website and the NABU VPN service, you agree to be bound by
                the terms of this Privacy Policy and any applicable law,
                regulation, legal process, or enforceable governmental request
                of the United States.
              </p>
              <br />
              <p className="leading-relaxed font-mono text-sm">
                NABU VPN does not collect, log, store, or track any data related
                to VPN usage other than machine aggregate network bandwidth
                usage. No VPN data is persisted. All VPN traffic is encrypted.
                We make a best effort to ensure your privacy and ensure our
                ability to comply with legal requirements. This is best
                accomplished by not spying on our users or collecting data on
                their activity.
              </p>
            </section>

            <section className="p-4 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                  Account Information
                </h2>
              </div>
              <p className="leading-relaxed font-mono text-sm">
                NABU VPN accounts use the public key address of a Cardano
                mainnet wallet. This provides a pseudoanonymous unique
                identifier for the ownership of an account without collecting
                information such as social media login IDs or email addresses.
                All account information is sourced from public data published to
                the Cardano blockchain, so there is no expectation of privacy on
                account existence or expiration. No personal data is collected
                about users or accounts.
              </p>
            </section>

            <section className="p-4 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Data Collection
                </h2>
              </div>
              <p className="leading-relaxed font-mono text-sm">
                We collect the minimal amount of data required to keep our
                services operational. Our services are "no log" services, which
                means we commit to not tracking and storing any persistent data
                on user activity. Data we do not collect and store cannot be
                leaked or stolen. We cannot share what we do not have. While we
                operate within the United States and will comply with any law
                enforcement or other legal requirements, we can only confirm
                that we have no data.
              </p>
              <br />
              <p className="leading-relaxed font-mono text-sm">
                We do not collect VPN traffic logs. We do not collect VPC flow
                logs. We do not collect load balancer logs. Any operational
                session data is ephemeral and only used to keep services active.
                There are no persistent log files stored on any of our servers.
              </p>
            </section>

            <section className="p-4 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Intermediary Services
                </h2>
              </div>
              <p className="leading-relaxed font-mono text-sm">
                Services along the way may be able to track certain details from
                you. Actors such as your Internet service provider (ISP) and
                ours (AWS for the VPN, Cloudflare for this website) can track
                information such as your IP address or your connection to us.
                Coarse HTTP traffic analytics such as aggregate traffic and
                country of origin derived from your IP address is tracked by
                Cloudflare for 30 days for this website, but not the NABU VPN
                service. Deep packet inspection or other techniques will detect
                your use of our VPN. However, they will be unable to see what
                you are doing. Your traffic is encrypted at your client.
              </p>
              <br />
              <p className="leading-relaxed font-mono text-sm">
                Logging into online accounts while using the VPN could expose
                additional information. Avoid using services with the same
                accounts both on and off the VPN to avoid leaking data allowing
                the service to correlate your real and VPN addresses.
              </p>
              <br />
              <p className="leading-relaxed font-mono text-sm">
                While NABU VPN operates a secure and private service, it makes
                no guaratees of complete security or privacy of our offering.
                Users are responsible for ensuring they are compliant with any
                applicable laws and have the ultimate responsibility for their
                own data and privacy.
              </p>
            </section>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-white text-[#1C246E] font-semibold rounded-xl shadow-lg"
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
