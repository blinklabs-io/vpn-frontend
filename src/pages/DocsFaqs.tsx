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
      answer: "Nabu uses your Cardano wallet as your identity—no signup forms, no tracking cookies. Once connected, you're seconds away from spinning up a secure VPN tunnel that hides your IP, encrypts your traffic, and keeps your data yours."
    },
    {
      id: "how-does-it-work",
      question: "How does NABU VPN work?",
      answer: "Simply connect your Cardano wallet, select a plan, download your profile and launch OpenVPN."
    },
    {
      id: "why-use-vpn",
      question: "What is a VPN and why do people use them?",
      answer: "VPN stands for Virtual Private Network. A VPN has many benefits, for example a VPN can protect your privacy by encrypting your internet traffic and hiding your real IP address. It can also enhance security on public Wi-Fi, bypass geo-restrictions and government censorship to access blocked content. VPN can also be used to prevent your Internet Service Provider (ISP) from throttling your connection."
    },
    {
      id: "profile-download-time",
      question: "If I purchase a VPN plan, how long before I can download my profile?",
      answer: "It only takes a few seconds to a few minutes for the transaction to get on-chain and for your profile to be created. You can always check the status of your VPN instances."
    },
    {
      id: "wallet-needed-per-device",
      question: "Will I need to connect my wallet on each device that I use OpenVPN on?",
      answer: "No, you just need your profile .ovpn file to import onto your device."
    },
     {
      id: "mulitple-device-same-time",
      question: "Can I use the same VPN on more than one device at the same time?",
      answer: "No. Each profile is a single concurrent connection. But... you can buy more profiles."
    },
    {
      id: "expire-notification",
      question: "Will I get notified when my plan expires?",
      answer: "No silly. The whole point of a VPN is to protect your personal data. It’s best that we don’t have your contact information."
    },
    {
      id: "renew-plan-new-profile",
      question: "Will I need to download a new profile when I renew my plan?",
      answer: "No, renewing your plan lets you keep enjoying your current profile. A new profile is needed after 10 years from initial plan purchase. So, you have ample time before that happens."
    },
    {
      id: "switch-wallets",
      question: "What if I switch wallets?",
      answer: "Your plan will continue to work but you won’t be able to renew your plan or redownload your profile. Plans are tied to your wallet address. We would also feel really sad for you if you lost your wallet."
    },
    {
      id: "use-other-devices",
      question: "Can I use other devices with the OpenVPN protocol?",
      answer: "Maybe… probably… Give it a shot! You should be able to use lots of other devices that OpenVPN supports. See the OpenVPN Community page and open source repos here https://openvpn.net/community/"
    },
    {
      id: "transaction-download-profile",
      question: "Why do I have to sign a transaction to download my profile?",
      answer: "This transaction verifies that your wallet is authorized to download this profile. This is an internal transaction that will not cost you any transaction fees."
    },
    {
      id: "multiple-instances",
      question: "Can I buy multiple VPN instances?",
      answer: "Yes, you can buy multiple instances that give you a different profile per instance."
    },
    {
      id: "ip-address-for-openvpn",
      question: "Can NABU see the IP address that I use to connect to OpenVPN?",
      answer: "No, to find out more about how NABU works, see our How it works page (https://nabuvpn.com/how-it-works)"
    }
  ];

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
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
              <span className="text-white font-medium">Step 1</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">2</span>
              </div>
              <span className="text-white font-medium">Step 2</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">3</span>
              </div>
              <span className="text-white font-medium">Step 3</span>
            </div>
          </div>
        </div>

		  <div className="text-lg font-semibold text-white pr-4">      
	<p> 
		1. Install OpenVPN <br/><br/>
	
		On Windows: <br/>
		Download here: https://openvpn.net/client/ <br/><br/>

		Still have questions? See OpenVPN documentation here <br/>
		https://openvpn.net/connect-docs/connect-for-windows.html <br/><br/>
		
		On Linux: <br/>
		sudo apt install openvpn <br/><br/>
		
		On Mac: <br/>
		Download here: https://openvpn.net/client/ <br/><br/>

		Still have questions? See OpenVPN documentation here https://openvpn.net/connect-docs/macos-installation-guide.html <br/><br/>
		
		Android/iOS: <br/>
		Download here: https://play.google.com/store/apps/details?id=net.openvpn.openvpn <br/><br/>

		Still have questions? See OpenVPN documentation here <br/>
		https://openvpn.net/connect-docs/connect-for-android.html <br/><br/>
</p>

<p>
2. Download your VPN Profile <br/>
Go to this link and connect your wallet to purchase your VPN profile. <br/>
		(link url https://nabuvpn.com/account) <br/><br/>
</p>
<p>
3) Configuring the VPN Client <br/>
Windows: Place the .ovpn file in: C:\Program Files\OpenVPN\config\ <br/>
Linux/Mac: sudo openvpn --config /path/to/your-profile.ovpn <br/>
Android/iOS: Import into OpenVPN Connect. <br/><br/>

</p>
<p>
4) Connecting to the VPN <br/>
Windows: Right-click the GUI and select "Connect." <br/>
Linux/Mac: sudo openvpn --config /path/to/your-profile.ovpn <br/>
Android/iOS: Tap "Connect" in the app. <br/><br/>

Still have questions on how to use OpenVPN? <br/>
See the OpenVPN user guides here https://openvpn.net/connect-docs/user-guide.html <br/><br/>
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
                  className="w-full text-left p-6 hover:bg-[#ffffff08] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white pr-4">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      <svg
                        className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                          openItems.includes(faq.id) ? 'rotate-180' : ''
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
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
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
