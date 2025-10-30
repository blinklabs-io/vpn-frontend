import { Link } from "react-router";
import { useState } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const DocsFaqs = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const faqs: FAQItem[] = [
    {
      id: "what-is-nabu",
      question: "What is NABU VPN?",
      answer:
        "Nabu uses your Cardano wallet as your identity—no signup forms, no tracking cookies. Once connected, you're seconds away from spinning up a secure VPN tunnel that hides your IP, encrypts your traffic, and keeps your data yours.",
    },
    {
      id: "how-does-it-work",
      question: "How does NABU VPN work?",
      answer:
        "Simply connect your Cardano wallet, select a plan, download your profile and launch OpenVPN.",
    },
    {
      id: "why-use-vpn",
      question: "What is a VPN and why do people use them?",
      answer:
        "VPN stands for Virtual Private Network. A VPN has many benefits, for example a VPN can protect your privacy by encrypting your internet traffic and hiding your real IP address. It can also enhance security on public Wi-Fi and bypass geo-restrictions and government censorship to access blocked content. VPN can also be used to prevent your Internet Service Provider (ISP) from throttling your connection when visiting certain sites.",
    },
    {
      id: "profile-download-time",
      question:
        "If I purchase a VPN plan, how long before I can download my profile?",
      answer:
        "It only takes a few seconds to a few minutes for the transaction to get on-chain and for your profile to be created. You can always check the status of your VPN instances on our site.",
    },
    {
      id: "wallet-needed-per-device",
      question:
        "Will I need to connect my wallet on each device that I use OpenVPN on?",
      answer:
        "No, you just need your profile .ovpn file to import onto your device.",
    },
    {
      id: "payments-accepted",
      question: "Can I pay in another payment method besides ADA?",
      answer:
        "No, ADA (Cardano) is the only accepted payment method at this time.",
    },
    {
      id: "multiple-devices-same-time",
      question:
        "Can I use the same VPN on more than one device at the same time?",
      answer:
        "No. Each profile is a single concurrent connection. You can purchase additional subscriptions if you need to support more than one device at the same time.",
    },
    {
      id: "expire-notification",
      question: "Will I get notified when my plan expires?",
      answer:
        "The whole point of a VPN is to protect your personal data. We do not ask for your contact information, so we have no way to notify you.",
    },
    {
      id: "renew-plan-new-profile",
      question: "Will I need to download a new profile when I renew my plan?",
      answer:
        "No, renewing your plan lets you keep enjoying your current profile.",
    },
    {
      id: "switch-wallets",
      question: "What if I switch wallets?",
      answer:
        "Your plan will continue to work but you won’t be able to renew your plan or redownload your profile. Plans are tied to your wallet address, and you must have access to the original wallet for any management actions.",
    },
    {
      id: "use-other-devices",
      question: "Can I use other devices with the OpenVPN protocol?",
      answer:
        "The VPN should be usable with any device that supports the OpenVPN client and importing an OVPN file to configure it. This includes common platforms such as Linux, Windows, macOS, iOS, and Android. See the OpenVPN Community page and open source repos here https://openvpn.net/community/",
    },
    {
      id: "transaction-download-profile",
      question:
        "Why do I have to sign a message with my wallet to download my profile?",
      answer:
        "The message signing process verifies that your wallet is the owner of the specified profile. There are no transactions generated and therefore no transaction fees.",
    },
    {
      id: "multiple-instances",
      question: "Can I buy multiple VPN instances?",
      answer:
        "Yes, you can purchase multiple subscriptions that give you a different profile per instance.",
    },
    {
      id: "ip-address-for-openvpn",
      question: "Can NABU see the IP address that I use to connect to OpenVPN?",
      answer:
        "No, we purposely do not log this information for your privacy. To find out more about how NABU works, see our How it works page (https://nabuvpn.com/how-it-works)",
    },
    {
      id: "wallet-balance-difference",
      question:
        "Why doesn't the wallet balance on the Account page match the balance shown by my wallet?",
      answer:
        "Many wallets will automatically include any unclaimed staking rewards when displaying the overall balance, but NABU is only querying the current wallet balance without unclaimed staking rewards. This may result in a small difference in the balance displayed, but it has no effect on your ability to manage your VPN subscriptions or the funds available in your wallet.",
    },
  ];

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)] relative pt-16 min-h-screen overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Documentation & FAQs
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            Find answers to common questions about NABU VPN
          </p>

          {/* Step Guide */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">1</span>
              </div>
              <span className="text-white font-medium">Install OpenVPN</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">2</span>
              </div>
              <span className="text-white font-medium">Download Profile</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">3</span>
              </div>
              <span className="text-white font-medium">
                Configure & Connect
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Steps */}
        <div className="space-y-8 mb-12">
          {/* Step 1: Install OpenVPN */}
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">1</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Install OpenVPN</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Windows */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-8 h-8 text-blue-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91v-6.75l10 .15z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Windows</h3>
                </div>
                <div className="space-y-3">
                  <a
                    href="https://openvpn.net/client/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Download OpenVPN Client
                  </a>
                  <a
                    href="https://openvpn.net/connect-docs/connect-for-windows.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Windows Documentation
                  </a>
                </div>
              </div>

              {/* Mac */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-8 h-8 text-gray-300"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">macOS</h3>
                </div>
                <div className="space-y-3">
                  <a
                    href="https://openvpn.net/client/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Download OpenVPN Client
                  </a>
                  <a
                    href="https://openvpn.net/connect-docs/macos-installation-guide.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    macOS Documentation
                  </a>
                </div>
              </div>

              {/* Linux */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-8 h-8 text-orange-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.504 0C5.588 0 0 5.588 0 12.504s5.588 12.504 12.504 12.504S25.008 19.42 25.008 12.504 19.42 0 12.504 0zm0 22.008c-5.243 0-9.504-4.261-9.504-9.504S7.261 3 12.504 3s9.504 4.261 9.504 9.504-4.261 9.504-9.504 9.504z" />
                    <path d="M12.504 6.5c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10.5c-2.481 0-4.5-2.019-4.5-4.5s2.019-4.5 4.5-4.5 4.5 2.019 4.5 4.5-2.019 4.5-4.5 4.5z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Linux</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-300 text-sm font-mono">
                        Terminal Command
                      </span>
                    </div>
                    <code className="text-green-400 font-mono text-sm">
                      sudo apt install openvpn
                    </code>
                  </div>
                </div>
              </div>

              {/* Mobile */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-8 h-8 text-green-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17 1.01L7 1c-1.1 0-1.99.9-1.99 2v18c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Mobile</h3>
                </div>
                <div className="flex flex-col gap-3">
                  <a
                    href="https://play.google.com/store/apps/details?id=net.openvpn.openvpn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    Android/iOS App
                  </a>
                  <a
                    href="https://openvpn.net/connect-docs/connect-for-android.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Mobile Documentation
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Download Profile */}
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">2</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                Download Your VPN Profile
              </h2>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <svg
                  className="w-8 h-8 text-purple-400"
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
                <h3 className="text-lg font-semibold text-white">
                  Connect Wallet & Purchase
                </h3>
              </div>
              <p className="text-gray-300 mb-4">
                Go to your account page and connect your Cardano wallet to
                purchase your VPN profile.
              </p>
              <Link
                to="/account"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
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
                Go to Account Page
              </Link>
            </div>
          </div>

          {/* Step 3: Configure & Connect */}
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">3</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                Configure & Connect
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Configuration */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-8 h-8 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">
                    Configuration
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-blue-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91v-6.75l10 .15z" />
                      </svg>
                      <span className="text-gray-300 text-sm">Windows</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <code className="text-gray-300 font-mono text-sm">
                        C:\Program Files\OpenVPN\config\
                      </code>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-orange-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12.504 0C5.588 0 0 5.588 0 12.504s5.588 12.504 12.504 12.504S25.008 19.42 25.008 12.504 19.42 0 12.504 0zm0 22.008c-5.243 0-9.504-4.261-9.504-9.504S7.261 3 12.504 3s9.504 4.261 9.504 9.504-4.261 9.504-9.504 9.504z" />
                      </svg>
                      <span className="text-gray-300 text-sm">Linux/Mac</span>
                    </div>
                    <code className="text-green-400 font-mono text-sm">
                      sudo openvpn --config /path/to/your-profile.ovpn
                    </code>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-green-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17 1.01L7 1c-1.1 0-1.99.9-1.99 2v18c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
                      </svg>
                      <span className="text-gray-300 text-sm">Mobile</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Import into OpenVPN Connect app
                    </span>
                  </div>
                </div>
              </div>

              {/* Connection */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-8 h-8 text-green-400"
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
                  <h3 className="text-lg font-semibold text-white">
                    Connection
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-blue-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91v-6.75l10 .15z" />
                      </svg>
                      <span className="text-gray-300 text-sm">Windows</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Right-click GUI and select "Connect"
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-orange-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12.504 0C5.588 0 0 5.588 0 12.504s5.588 12.504 12.504 12.504S25.008 19.42 25.008 12.504 19.42 0 12.504 0zm0 22.008c-5.243 0-9.504-4.261-9.504-9.504S7.261 3 12.504 3s9.504 4.261 9.504 9.504-4.261 9.504-9.504 9.504z" />
                      </svg>
                      <span className="text-gray-300 text-sm">Linux/Mac</span>
                    </div>
                    <code className="text-green-400 font-mono text-sm">
                      sudo openvpn --config /path/to/your-profile.ovpn
                    </code>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-green-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17 1.01L7 1c-1.1 0-1.99.9-1.99 2v18c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
                      </svg>
                      <span className="text-gray-300 text-sm">Mobile</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Tap "Connect" in the app
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-gray-300 text-sm">
                    Still have questions on how to use OpenVPN?
                    <a
                      href="https://openvpn.net/connect-docs/user-guide.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors ml-1"
                    >
                      See the OpenVPN user guides here
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#00000066] to-[#1a1a2e66] rounded-2xl p-8 backdrop-blur-xl border border-[#ffffff2a] shadow-2xl">
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-[#00000033] rounded-xl border border-[#ffffff1a] overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full text-left p-6 hover:bg-[#ffffff08] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white pr-4">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      <svg
                        className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                          openItems.includes(faq.id) ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openItems.includes(faq.id)
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-6">
                    <div className="border-t border-[#ffffff1a] pt-4">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

export default DocsFaqs;
