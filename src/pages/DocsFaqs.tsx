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
    <div className="flex flex-col relative pt-16 min-h-screen overflow-hidden bg-black/30">
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Quick answers about NABU VPN, billing, setup, and usage.
          </p>
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
                  className="w-full text-left p-6 hover:bg-[#ffffff08] transition-colors duration-200 outline-none"
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

