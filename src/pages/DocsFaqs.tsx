import { Link } from "react-router";
import { useState, useMemo } from "react";
import {
  shouldShowWireGuardUI,
  isOpenVpnAvailable,
} from "../components/ProtocolToggle";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  /** Show only when WireGuard is enabled and OpenVPN is not available */
  wireGuardOnly?: boolean;
  /** Show only when OpenVPN is available and WireGuard is not enabled */
  openVpnOnly?: boolean;
  /** Show only when both protocols are available */
  bothProtocols?: boolean;
}

const DocsFaqs = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const wireGuardEnabled = shouldShowWireGuardUI();
  const openVpnEnabled = isOpenVpnAvailable();
  const bothEnabled = wireGuardEnabled && openVpnEnabled;

  // Build FAQ list based on enabled protocols
  const faqs: FAQItem[] = useMemo(() => {
    const allFaqs: FAQItem[] = [
      {
        id: "what-is-nabu",
        question: "What is NABU VPN?",
        answer:
          "Nabu uses your Cardano wallet as your identity—no signup forms, no tracking cookies. Once connected, you're seconds away from spinning up a secure VPN tunnel that hides your IP, encrypts your traffic, and keeps your data yours.",
      },
      // Protocol-specific "How does it work" answers
      {
        id: "how-does-it-work-both",
        question: "How does NABU VPN work?",
        answer:
          "Simply connect your Cardano wallet, select a plan, and configure your devices. For WireGuard, you can register up to 3 devices per subscription. For OpenVPN, download your profile and import it into your OpenVPN client.",
        bothProtocols: true,
      },
      {
        id: "how-does-it-work-wg",
        question: "How does NABU VPN work?",
        answer:
          "Simply connect your Cardano wallet, select a plan, and configure your devices. Each WireGuard subscription supports up to 3 devices—add them through the web interface and download the configuration to import into your WireGuard client.",
        wireGuardOnly: true,
      },
      {
        id: "how-does-it-work-ovpn",
        question: "How does NABU VPN work?",
        answer:
          "Simply connect your Cardano wallet, select a plan, and download your profile. Import the .ovpn file into your OpenVPN client and connect. Your profile stays valid until your subscription expires.",
        openVpnOnly: true,
      },
      // WireGuard-specific FAQs (show whenever WireGuard is enabled)
      {
        id: "why-wireguard-both",
        question: "Why WireGuard?",
        answer:
          "WireGuard is a modern VPN protocol designed for simplicity, speed, and security. It uses state-of-the-art cryptography and has a much smaller codebase than older protocols, making it easier to audit and less prone to vulnerabilities. WireGuard typically provides faster connection times and better performance, especially on mobile devices where it excels at handling network changes seamlessly.",
        bothProtocols: true,
      },
      {
        id: "why-wireguard-wg",
        question: "Why WireGuard?",
        answer:
          "WireGuard is a modern VPN protocol designed for simplicity, speed, and security. It uses state-of-the-art cryptography and has a much smaller codebase than older protocols, making it easier to audit and less prone to vulnerabilities. WireGuard typically provides faster connection times and better performance, especially on mobile devices where it excels at handling network changes seamlessly.",
        wireGuardOnly: true,
      },
      // Comparison FAQ (only when both available)
      {
        id: "wireguard-vs-openvpn",
        question: "WireGuard vs OpenVPN",
        answer:
          "WireGuard is newer, faster, and more efficient. It establishes connections almost instantly versus several seconds for OpenVPN. WireGuard uses modern cryptographic primitives (ChaCha20, Curve25519, BLAKE2) while OpenVPN relies on OpenSSL. WireGuard's codebase is around 4,000 lines compared to OpenVPN's 100,000+, making it easier to audit. However, OpenVPN has been around longer and is supported on more devices and platforms. Both protocols are secure when properly configured.",
        bothProtocols: true,
      },
      {
        id: "openvpn-compatibility",
        question: "When should I use OpenVPN?",
        answer:
          "OpenVPN is provided for compatibility with devices and systems that don't yet support WireGuard. You might choose OpenVPN if:\n\n• Your device or router only supports OpenVPN\n• You're using an older operating system without WireGuard support\n• Your network administrator requires OpenVPN\n• You need to use TCP mode to bypass restrictive firewalls (WireGuard is UDP-only)\n\nFor most users on modern devices, we recommend WireGuard for its superior performance.",
        bothProtocols: true,
      },
      // OpenVPN-specific FAQs (show whenever OpenVPN is available)
      {
        id: "about-openvpn-both",
        question: "About OpenVPN",
        answer:
          "OpenVPN is a mature, widely-supported VPN protocol that has been around since 2001. It uses OpenSSL for encryption and works on virtually every platform. OpenVPN can operate over both TCP and UDP, making it useful for bypassing restrictive firewalls. While newer protocols may offer better performance, OpenVPN remains a reliable and secure choice.",
        bothProtocols: true,
      },
      {
        id: "about-openvpn-ovpn",
        question: "About OpenVPN",
        answer:
          "OpenVPN is a mature, widely-supported VPN protocol that has been around since 2001. It uses OpenSSL for encryption and works on virtually every platform. OpenVPN can operate over both TCP and UDP, making it useful for bypassing restrictive firewalls. While newer protocols may offer better performance, OpenVPN remains a reliable and secure choice.",
        openVpnOnly: true,
      },
      {
        id: "why-use-vpn",
        question: "What is a VPN and why do people use them?",
        answer:
          "VPN stands for Virtual Private Network. A VPN has many benefits, for example a VPN can protect your privacy by encrypting your internet traffic and hiding your real IP address. It can also enhance security on public Wi-Fi and bypass geo-restrictions and government censorship to access blocked content. VPN can also be used to prevent your Internet Service Provider (ISP) from throttling your connection when visiting certain sites.",
      },
      // Setup time - protocol aware
      {
        id: "setup-time-both",
        question: "How long after purchase can I start using the VPN?",
        answer:
          "It only takes a few seconds to a few minutes for your transaction to be confirmed on-chain. For WireGuard, you can add devices immediately once your subscription is active—device registration happens instantly. For OpenVPN, your profile is generated within moments. You can check your subscription status anytime on the Account page.",
        bothProtocols: true,
      },
      {
        id: "setup-time-wg",
        question: "How long after purchase can I start using the VPN?",
        answer:
          "It only takes a few seconds to a few minutes for your transaction to be confirmed on-chain. Once your subscription is active, you can add devices immediately—registration happens instantly. You can check your subscription status anytime on the Account page.",
        wireGuardOnly: true,
      },
      {
        id: "setup-time-ovpn",
        question: "How long after purchase can I start using the VPN?",
        answer:
          "It only takes a few seconds to a few minutes for your transaction to be confirmed on-chain. Your OpenVPN profile is generated within moments after confirmation. You can check your subscription status anytime on the Account page.",
        openVpnOnly: true,
      },
      // Wallet per device - protocol aware
      {
        id: "wallet-needed-per-device-both",
        question: "Will I need to connect my wallet on each device?",
        answer:
          "For WireGuard, you'll need your wallet connected when adding new devices through the web interface—this is where your device keys are registered. Once configured, your devices connect directly to the VPN without needing wallet access. For OpenVPN, you just need your .ovpn profile file to import onto your device.",
        bothProtocols: true,
      },
      {
        id: "wallet-needed-per-device-wg",
        question: "Will I need to connect my wallet on each device?",
        answer:
          "You'll need your wallet connected when adding new devices through the web interface—this is where your device keys are registered. Once configured, your devices connect directly to the VPN without needing wallet access.",
        wireGuardOnly: true,
      },
      {
        id: "wallet-needed-per-device-ovpn",
        question: "Will I need to connect my wallet on each device?",
        answer:
          "No, you just need your .ovpn profile file to import onto your device. You only need your wallet connected to download or re-download your profile.",
        openVpnOnly: true,
      },
      {
        id: "payments-accepted",
        question: "Can I pay in another payment method besides ADA?",
        answer:
          "No, ADA (Cardano) is the only accepted payment method at this time.",
      },
      // Multiple devices - protocol aware
      {
        id: "multiple-devices-same-time-both",
        question: "Can I use the same VPN subscription on multiple devices?",
        answer:
          "With WireGuard, yes! Each subscription supports up to 3 devices, so you can connect from your phone, laptop, and desktop simultaneously. With OpenVPN, each subscription supports one device at a time. If you need more concurrent connections, you can purchase additional subscriptions.",
        bothProtocols: true,
      },
      {
        id: "multiple-devices-same-time-wg",
        question: "Can I use the same VPN subscription on multiple devices?",
        answer:
          "Yes! Each subscription supports up to 3 devices, so you can connect from your phone, laptop, and desktop simultaneously. If you need more than 3 concurrent connections, you can purchase additional subscriptions.",
        wireGuardOnly: true,
      },
      {
        id: "multiple-devices-same-time-ovpn",
        question: "Can I use the same VPN subscription on multiple devices?",
        answer:
          "Each OpenVPN subscription supports one concurrent connection. You can install your profile on multiple devices, but only one can be connected at a time. If you need simultaneous connections, you can purchase additional subscriptions.",
        openVpnOnly: true,
      },
      {
        id: "expire-notification",
        question: "Will I get notified when my plan expires?",
        answer:
          "The whole point of a VPN is to protect your personal data. We do not ask for your contact information, so we have no way to notify you.",
      },
      // Renew - protocol aware
      {
        id: "renew-plan-new-profile-both",
        question: "Will I need to reconfigure my devices when I renew my plan?",
        answer:
          "No, renewing your plan extends your existing subscription. Your WireGuard devices and OpenVPN profiles continue working without any reconfiguration.",
        bothProtocols: true,
      },
      {
        id: "renew-plan-new-profile-wg",
        question: "Will I need to reconfigure my devices when I renew my plan?",
        answer:
          "No, renewing your plan extends your existing subscription. Your device configurations continue working without any changes.",
        wireGuardOnly: true,
      },
      {
        id: "renew-plan-new-profile-ovpn",
        question: "Will I need to download a new profile when I renew my plan?",
        answer:
          "No, renewing your plan extends your existing subscription. Your profile continues working without any changes.",
        openVpnOnly: true,
      },
      // Switch wallets - protocol aware
      {
        id: "switch-wallets-both",
        question: "What if I switch wallets?",
        answer:
          "Your existing VPN connections will continue to work, but you won't be able to renew your subscription, add new WireGuard devices, re-download OpenVPN profiles, or manage your account. Subscriptions are tied to your wallet address, and you must have access to the original wallet for any management actions.",
        bothProtocols: true,
      },
      {
        id: "switch-wallets-wg",
        question: "What if I switch wallets?",
        answer:
          "Your existing VPN connections will continue to work, but you won't be able to renew your subscription, add new WireGuard devices, or manage your account. Subscriptions are tied to your wallet address, and you must have access to the original wallet for any management actions.",
        wireGuardOnly: true,
      },
      {
        id: "switch-wallets-ovpn",
        question: "What if I switch wallets?",
        answer:
          "Your existing VPN connections will continue to work, but you won't be able to renew your subscription or re-download your profile. Subscriptions are tied to your wallet address, and you must have access to the original wallet for any management actions.",
        openVpnOnly: true,
      },
      // Supported devices - protocol aware
      {
        id: "supported-devices-both",
        question: "What devices are supported?",
        answer:
          "WireGuard is supported on all major platforms including Windows, macOS, Linux, iOS, and Android. Most modern devices and operating systems have native WireGuard support or official apps available. For older devices that don't support WireGuard, OpenVPN is available as a fallback option with clients for virtually every platform. See wireguard.com/install and openvpn.net/community for client downloads.",
        bothProtocols: true,
      },
      {
        id: "supported-devices-wg",
        question: "What devices are supported?",
        answer:
          "WireGuard is supported on all major platforms including Windows, macOS, Linux, iOS, and Android. Most modern devices and operating systems have native WireGuard support or official apps available. See wireguard.com/install for client downloads.",
        wireGuardOnly: true,
      },
      {
        id: "supported-devices-ovpn",
        question: "What devices are supported?",
        answer:
          "OpenVPN is supported on virtually every platform including Windows, macOS, Linux, iOS, Android, and many routers. See openvpn.net/community for client downloads.",
        openVpnOnly: true,
      },
      // Wallet signing - protocol aware
      {
        id: "wallet-signing-both",
        question: "Why do I have to sign a message with my wallet?",
        answer:
          "Message signing verifies that you own the wallet associated with your subscription. For WireGuard, signing authorizes device registration. For OpenVPN, it authenticates profile downloads. This is just a cryptographic signature—no transaction is created and there are no fees.",
        bothProtocols: true,
      },
      {
        id: "wallet-signing-wg",
        question: "Why do I have to sign a message with my wallet?",
        answer:
          "Message signing verifies that you own the wallet associated with your subscription. Signing authorizes device registration. This is just a cryptographic signature—no transaction is created and there are no fees.",
        wireGuardOnly: true,
      },
      {
        id: "wallet-signing-ovpn",
        question: "Why do I have to sign a message with my wallet to download my profile?",
        answer:
          "The message signing process verifies that your wallet is the owner of the specified subscription. There are no transactions generated and therefore no transaction fees.",
        openVpnOnly: true,
      },
      // Multiple instances - protocol aware
      {
        id: "multiple-instances-both",
        question: "Can I buy multiple VPN subscriptions?",
        answer:
          "Yes, you can purchase multiple subscriptions. Each WireGuard subscription supports up to 3 devices, and you can have subscriptions in different regions. This is useful if you need more than 3 simultaneous connections or want to access content from multiple geographic locations.",
        bothProtocols: true,
      },
      {
        id: "multiple-instances-wg",
        question: "Can I buy multiple VPN subscriptions?",
        answer:
          "Yes, you can purchase multiple subscriptions. Each WireGuard subscription supports up to 3 devices, and you can have subscriptions in different regions. This is useful if you need more than 3 simultaneous connections or want to access content from multiple geographic locations.",
        wireGuardOnly: true,
      },
      {
        id: "multiple-instances-ovpn",
        question: "Can I buy multiple VPN subscriptions?",
        answer:
          "Yes, you can purchase multiple subscriptions for different regions or to support more concurrent connections.",
        openVpnOnly: true,
      },
      // IP logging - protocol aware
      {
        id: "ip-address-logging-both",
        question: "Can NABU see my IP address when I connect to the VPN?",
        answer:
          "No, we purposely disable all logging on our VPN servers for your privacy. This applies to both WireGuard and OpenVPN connections. To learn more about our privacy-focused architecture, see our How it works page.",
        bothProtocols: true,
      },
      {
        id: "ip-address-logging-wg",
        question: "Can NABU see my IP address when I connect to the VPN?",
        answer:
          "No, we purposely disable all logging on our VPN servers for your privacy. To learn more about our privacy-focused architecture, see our How it works page.",
        wireGuardOnly: true,
      },
      {
        id: "ip-address-logging-ovpn",
        question: "Can NABU see the IP address that I use to connect to OpenVPN?",
        answer:
          "No, we purposely do not log this information for your privacy. To learn more about our privacy-focused architecture, see our How it works page.",
        openVpnOnly: true,
      },
      {
        id: "wallet-balance-difference",
        question:
          "Why doesn't the wallet balance on the Account page match the balance shown by my wallet?",
        answer:
          "Many wallets will automatically include any unclaimed staking rewards when displaying the overall balance, but NABU is only querying the current wallet balance without unclaimed staking rewards. This may result in a small difference in the balance displayed, but it has no effect on your ability to manage your VPN subscriptions or the funds available in your wallet.",
      },
    ];

    // Filter FAQs based on enabled protocols
    return allFaqs.filter((faq) => {
      // Show if no protocol restriction
      if (!faq.wireGuardOnly && !faq.openVpnOnly && !faq.bothProtocols) {
        return true;
      }
      // Both protocols required
      if (faq.bothProtocols) {
        return bothEnabled;
      }
      // WireGuard only (show when WG enabled and OpenVPN not available, or explicitly WG-only)
      if (faq.wireGuardOnly) {
        return wireGuardEnabled && !openVpnEnabled;
      }
      // OpenVPN only (show when OpenVPN available and WireGuard not enabled)
      if (faq.openVpnOnly) {
        return openVpnEnabled && !wireGuardEnabled;
      }
      return true;
    });
  }, [wireGuardEnabled, openVpnEnabled, bothEnabled]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col relative pt-16 min-h-screen overflow-hidden">
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

