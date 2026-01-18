import { useState } from "react";
import { Link } from "react-router";
import { detectDeviceTypeRaw } from "../utils/deviceDetection";
import type { DeviceType } from "../utils/deviceDetection";
import {
  shouldShowWireGuardUI,
  isOpenVpnAvailable,
} from "../components/ProtocolToggle";

// Check protocol availability using shared helpers
const isWireGuardEnabled = shouldShowWireGuardUI();
const isOpenVpnEnabled = isOpenVpnAvailable();

/**
 * Get platform-specific WireGuard installation info
 */
function getWireGuardInstallInfo(deviceType: DeviceType): {
  appName: string;
  downloadUrl: string;
  storeText: string;
  instructions: string[];
} {
  switch (deviceType) {
    case "windows":
      return {
        appName: "WireGuard for Windows",
        downloadUrl: "https://www.wireguard.com/install/",
        storeText: "Download from wireguard.com",
        instructions: [
          "Download the WireGuard installer from the official website",
          "Run the installer and follow the prompts",
          "Once installed, WireGuard will appear in your system tray",
        ],
      };
    case "mac":
      return {
        appName: "WireGuard for macOS",
        downloadUrl: "https://apps.apple.com/app/wireguard/id1451685025",
        storeText: "Download from App Store",
        instructions: [
          "Download WireGuard from the Mac App Store",
          "Open the app and grant the necessary permissions",
          "WireGuard will appear in your menu bar",
        ],
      };
    case "iphone":
    case "ipad":
      return {
        appName: "WireGuard for iOS",
        downloadUrl: "https://apps.apple.com/app/wireguard/id1441195209",
        storeText: "Download from App Store",
        instructions: [
          "Download WireGuard from the App Store",
          "Open the app and tap 'Add a tunnel'",
          "Choose 'Create from QR code' to scan your config",
        ],
      };
    case "android":
      return {
        appName: "WireGuard for Android",
        downloadUrl: "https://play.google.com/store/apps/details?id=com.wireguard.android",
        storeText: "Download from Play Store",
        instructions: [
          "Download WireGuard from the Play Store",
          "Open the app and tap the '+' button",
          "Choose 'Scan from QR code' to scan your config",
        ],
      };
    case "linux":
      return {
        appName: "WireGuard for Linux",
        downloadUrl: "https://www.wireguard.com/install/",
        storeText: "Install via package manager",
        instructions: [
          "Install using your distribution's package manager (see commands below)",
          "Import your configuration file to /etc/wireguard/",
          "Use 'wg-quick up' to connect",
        ],
      };
    default:
      return {
        appName: "WireGuard",
        downloadUrl: "https://www.wireguard.com/install/",
        storeText: "Visit wireguard.com",
        instructions: [
          "Download WireGuard for your platform from wireguard.com",
          "Install and open the application",
          "Import your configuration file or scan the QR code",
        ],
      };
  }
}

/**
 * Get platform-specific OpenVPN installation info
 */
function getOpenVpnInstallInfo(deviceType: DeviceType): {
  appName: string;
  downloadUrl: string;
  storeText: string;
  instructions: string[];
} {
  switch (deviceType) {
    case "windows":
      return {
        appName: "OpenVPN Connect for Windows",
        downloadUrl: "https://openvpn.net/client/",
        storeText: "Download from openvpn.net",
        instructions: [
          "Download the OpenVPN Connect installer from the official website",
          "Run the installer and follow the prompts",
          "Once installed, OpenVPN will appear in your system tray",
        ],
      };
    case "mac":
      return {
        appName: "OpenVPN Connect for macOS",
        downloadUrl: "https://openvpn.net/client/",
        storeText: "Download from openvpn.net",
        instructions: [
          "Download OpenVPN Connect from the official website",
          "Open the installer and drag to Applications",
          "OpenVPN will appear in your menu bar",
        ],
      };
    case "iphone":
    case "ipad":
      return {
        appName: "OpenVPN Connect for iOS",
        downloadUrl: "https://apps.apple.com/app/openvpn-connect/id590379981",
        storeText: "Download from App Store",
        instructions: [
          "Download OpenVPN Connect from the App Store",
          "Open the app and allow VPN configuration access",
          "Import your .ovpn profile file to connect",
        ],
      };
    case "android":
      return {
        appName: "OpenVPN Connect for Android",
        downloadUrl: "https://play.google.com/store/apps/details?id=net.openvpn.openvpn",
        storeText: "Download from Play Store",
        instructions: [
          "Download OpenVPN Connect from the Play Store",
          "Open the app and grant necessary permissions",
          "Import your .ovpn profile file to connect",
        ],
      };
    case "linux":
      return {
        appName: "OpenVPN for Linux",
        downloadUrl: "https://openvpn.net/community-downloads/",
        storeText: "Install via package manager",
        instructions: [
          "Install using your distribution's package manager (see commands below)",
          "Place your .ovpn config file in a convenient location",
          "Use 'openvpn --config' to connect",
        ],
      };
    default:
      return {
        appName: "OpenVPN Connect",
        downloadUrl: "https://openvpn.net/client/",
        storeText: "Visit openvpn.net",
        instructions: [
          "Download OpenVPN Connect for your platform from openvpn.net",
          "Install and open the application",
          "Import your .ovpn profile file to connect",
        ],
      };
  }
}

/**
 * Get the human-readable device name for display
 */
function getDeviceDisplayName(deviceType: DeviceType): string {
  switch (deviceType) {
    case "windows":
      return "Windows";
    case "mac":
      return "macOS";
    case "iphone":
      return "iPhone";
    case "ipad":
      return "iPad";
    case "android":
      return "Android";
    case "linux":
      return "Linux";
    default:
      return "your device";
  }
}

/**
 * Platform icon component
 */
const PlatformIcon = ({ deviceType, className = "w-8 h-8" }: { deviceType: DeviceType; className?: string }) => {
  switch (deviceType) {
    case "windows":
      return (
        <svg className={`${className} text-blue-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91v-6.75l10 .15z" />
        </svg>
      );
    case "mac":
      return (
        <svg className={`${className} text-gray-300`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      );
    case "iphone":
    case "ipad":
    case "android":
      return (
        <svg className={`${className} text-green-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 1.01L7 1c-1.1 0-1.99.9-1.99 2v18c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
        </svg>
      );
    case "linux":
      return (
        <svg className={`${className} text-orange-400`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.504 0C5.588 0 0 5.588 0 12.504s5.588 12.504 12.504 12.504S25.008 19.42 25.008 12.504 19.42 0 12.504 0zm0 22.008c-5.243 0-9.504-4.261-9.504-9.504S7.261 3 12.504 3s9.504 4.261 9.504 9.504-4.261 9.504-9.504 9.504z" />
        </svg>
      );
    default:
      return (
        <svg className={`${className} text-purple-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
  }
};

/**
 * Collapsible section component
 */
const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/5 rounded-xl border border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-white/5 transition-colors rounded-xl"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-white">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

/**
 * WireGuard Install Guide content
 */
const WireGuardInstallGuide = () => {
  const deviceType = detectDeviceTypeRaw();
  const deviceName = getDeviceDisplayName(deviceType);
  const installInfo = getWireGuardInstallInfo(deviceType);
  const isMobile = deviceType === "iphone" || deviceType === "ipad" || deviceType === "android";

  return (
    <>
      {/* Platform detection banner */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30 mb-8">
        <div className="flex items-center gap-3">
          <PlatformIcon deviceType={deviceType} className="w-10 h-10" />
          <div>
            <p className="text-white font-medium">
              We detected you're on <span className="text-blue-400">{deviceName}</span>
            </p>
            <p className="text-gray-300 text-sm">Here's how to get started with NABU VPN</p>
          </div>
        </div>
      </div>

      {/* Quick steps overview */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">1</span>
          </div>
          <span className="text-white font-medium">Install WireGuard</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">2</span>
          </div>
          <span className="text-white font-medium">Get Your Config</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">3</span>
          </div>
          <span className="text-white font-medium">Import & Connect</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#00000066] to-[#1a1a2e66] rounded-2xl p-8 backdrop-blur-xl border border-[#ffffff2a] shadow-2xl">
        <div className="space-y-8">
          {/* Step 1: Install WireGuard */}
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">1</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Install WireGuard</h2>
            </div>

            {/* Recommended for detected platform */}
            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <PlatformIcon deviceType={deviceType} />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Recommended for {deviceName}
                  </h3>
                  <p className="text-gray-300 text-sm">{installInfo.appName}</p>
                </div>
              </div>
              <a
                href={installInfo.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {installInfo.storeText}
              </a>
              <ul className="space-y-2">
                {installInfo.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-blue-400 mt-1">*</span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>

            {/* Linux terminal commands */}
            {deviceType === "linux" && (
              <div className="space-y-3 mb-6">
                <h4 className="text-white font-medium">Terminal Commands:</h4>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400 text-sm font-mono">Ubuntu/Debian:</span>
                  </div>
                  <code className="text-green-400 font-mono text-sm">
                    sudo apt install wireguard
                  </code>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400 text-sm font-mono">Fedora:</span>
                  </div>
                  <code className="text-green-400 font-mono text-sm">
                    sudo dnf install wireguard-tools
                  </code>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400 text-sm font-mono">Arch Linux:</span>
                  </div>
                  <code className="text-green-400 font-mono text-sm">
                    sudo pacman -S wireguard-tools
                  </code>
                </div>
              </div>
            )}

            {/* Other platforms */}
            <CollapsibleSection title="Other Platforms">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {deviceType !== "windows" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="windows" className="w-6 h-6" />
                      <h4 className="text-white font-medium">Windows</h4>
                    </div>
                    <a
                      href="https://www.wireguard.com/install/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors text-sm"
                    >
                      Download from wireguard.com
                    </a>
                  </div>
                )}
                {deviceType !== "mac" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="mac" className="w-6 h-6" />
                      <h4 className="text-white font-medium">macOS</h4>
                    </div>
                    <a
                      href="https://apps.apple.com/app/wireguard/id1451685025"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors text-sm"
                    >
                      Download from App Store
                    </a>
                  </div>
                )}
                {deviceType !== "iphone" && deviceType !== "ipad" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="iphone" className="w-6 h-6" />
                      <h4 className="text-white font-medium">iOS (iPhone/iPad)</h4>
                    </div>
                    <a
                      href="https://apps.apple.com/app/wireguard/id1441195209"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors text-sm"
                    >
                      Download from App Store
                    </a>
                  </div>
                )}
                {deviceType !== "android" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="android" className="w-6 h-6" />
                      <h4 className="text-white font-medium">Android</h4>
                    </div>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.wireguard.android"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors text-sm"
                    >
                      Download from Play Store
                    </a>
                  </div>
                )}
                {deviceType !== "linux" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="linux" className="w-6 h-6" />
                      <h4 className="text-white font-medium">Linux</h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Install via package manager (apt, dnf, pacman)
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* Step 2: Get Your Config */}
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">2</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Get Your Config</h2>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Connect Wallet & Add Device</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Go to your account page, connect your Cardano wallet, and purchase a VPN subscription.
                Then add a device to get your WireGuard configuration.
              </p>
              <Link
                to="/account"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Go to Account Page
              </Link>
            </div>
          </div>

          {/* Step 3: Import Config */}
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">3</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Import & Connect</h2>
            </div>

            {/* QR Code section for mobile */}
            {isMobile && (
              <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/30 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Scan QR Code (Easiest Method)</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  The easiest way to import your WireGuard configuration on mobile is to scan the QR code:
                </p>
                <ol className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">1.</span>
                    Open the WireGuard app on your {deviceName}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">2.</span>
                    Tap the "+" button to add a new tunnel
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">3.</span>
                    Select "Create from QR code" or "Scan from QR code"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">4.</span>
                    Point your camera at the QR code shown on your Account page
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">5.</span>
                    Give the tunnel a name and tap "Create Tunnel"
                  </li>
                </ol>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Desktop/File Import */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Import Config File</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="windows" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Windows</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Click "Import tunnel(s) from file" and select your .conf file
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="mac" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">macOS</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Click "Import Tunnel(s) from File" or drag-and-drop the .conf file
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="linux" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Linux</span>
                    </div>
                    <code className="text-green-400 font-mono text-sm">
                      sudo wg-quick up ./nabu-wg.conf
                    </code>
                  </div>
                </div>
              </div>

              {/* Connecting */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Connect</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="windows" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Windows</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Click "Activate" on your tunnel
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="mac" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">macOS</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Toggle the switch to connect
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="iphone" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Mobile</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Toggle the switch next to your tunnel
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="linux" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Linux</span>
                    </div>
                    <code className="text-green-400 font-mono text-sm">
                      sudo wg-quick up nabu-wg
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code tip for desktop users */}
            {!isMobile && (
              <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium text-sm mb-1">Setting up on mobile?</p>
                    <p className="text-gray-300 text-sm">
                      When you get your config from the Account page, you can display a QR code.
                      Open WireGuard on your mobile device and scan the QR code to import your configuration instantly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-gray-300 text-sm">
                    Need more help with WireGuard?
                    <a
                      href="https://www.wireguard.com/quickstart/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors ml-1"
                    >
                      See the official WireGuard quick start guide
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsed OpenVPN Section - only show when OpenVPN is available */}
          {isOpenVpnEnabled && (
            <CollapsibleSection title="Looking for OpenVPN?">
              <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 mb-6">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-400 flex-shrink-0">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-300 text-sm">
                    <span className="text-white font-semibold">We recommend WireGuard</span>{" "}
                    for better performance and multi-device support. OpenVPN is available
                    for devices that don't support WireGuard.
                  </p>
                </div>
              </div>

              <OpenVpnContent />
            </CollapsibleSection>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * OpenVPN content - extracted from the original InstallGuide
 */
const OpenVpnContent = () => {
  return (
    <div className="space-y-6">
      {/* Install OpenVPN */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Install OpenVPN</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91v-6.75l10 .15z" />
              </svg>
              <h4 className="text-white font-medium">Windows</h4>
            </div>
            <a
              href="https://openvpn.net/client/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-white transition-colors text-sm"
            >
              Download OpenVPN Client
            </a>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <h4 className="text-white font-medium">macOS</h4>
            </div>
            <a
              href="https://openvpn.net/client/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-white transition-colors text-sm"
            >
              Download OpenVPN Client
            </a>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.504 0C5.588 0 0 5.588 0 12.504s5.588 12.504 12.504 12.504S25.008 19.42 25.008 12.504 19.42 0 12.504 0zm0 22.008c-5.243 0-9.504-4.261-9.504-9.504S7.261 3 12.504 3s9.504 4.261 9.504 9.504-4.261 9.504-9.504 9.504z" />
              </svg>
              <h4 className="text-white font-medium">Linux</h4>
            </div>
            <code className="text-green-400 font-mono text-sm">
              sudo apt install openvpn
            </code>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 1.01L7 1c-1.1 0-1.99.9-1.99 2v18c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
              </svg>
              <h4 className="text-white font-medium">Mobile</h4>
            </div>
            <a
              href="https://play.google.com/store/apps/details?id=net.openvpn.openvpn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-white transition-colors text-sm"
            >
              Android/iOS App
            </a>
          </div>
        </div>
      </div>

      {/* Configure OpenVPN */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Configure & Connect</h3>
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91v-6.75l10 .15z" />
              </svg>
              <span className="text-gray-300 text-sm">Windows</span>
            </div>
            <code className="text-gray-300 font-mono text-sm">
              C:\Program Files\OpenVPN\config\
            </code>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
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
              <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 1.01L7 1c-1.1 0-1.99.9-1.99 2v18c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
              </svg>
              <span className="text-gray-300 text-sm">Mobile</span>
            </div>
            <span className="text-gray-300 text-sm">Import into OpenVPN Connect app</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  );
};

/**
 * Original OpenVPN Install Guide (shown when WireGuard is disabled)
 */
const OpenVpnInstallGuide = () => {
  const deviceType = detectDeviceTypeRaw();
  const deviceName = getDeviceDisplayName(deviceType);
  const installInfo = getOpenVpnInstallInfo(deviceType);
  const isMobile = deviceType === "iphone" || deviceType === "ipad" || deviceType === "android";

  return (
    <>
      {/* Platform detection banner */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30 mb-8">
        <div className="flex items-center gap-3">
          <PlatformIcon deviceType={deviceType} className="w-10 h-10" />
          <div>
            <p className="text-white font-medium">
              We detected you're on <span className="text-blue-400">{deviceName}</span>
            </p>
            <p className="text-gray-300 text-sm">Here's how to get started with NABU VPN</p>
          </div>
        </div>
      </div>

      {/* Quick steps overview */}
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
          <span className="text-white font-medium">Import & Connect</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#00000066] to-[#1a1a2e66] rounded-2xl p-8 backdrop-blur-xl border border-[#ffffff2a] shadow-2xl">
        <div className="space-y-8">
          {/* Step 1: Install OpenVPN */}
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">1</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Install OpenVPN</h2>
            </div>

            {/* Recommended for detected platform */}
            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <PlatformIcon deviceType={deviceType} />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Recommended for {deviceName}
                  </h3>
                  <p className="text-gray-300 text-sm">{installInfo.appName}</p>
                </div>
              </div>
              <a
                href={installInfo.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {installInfo.storeText}
              </a>
              <ul className="space-y-2">
                {installInfo.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-blue-400 mt-1">*</span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>

            {/* Linux terminal commands */}
            {deviceType === "linux" && (
              <div className="space-y-3 mb-6">
                <h4 className="text-white font-medium">Terminal Commands:</h4>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400 text-sm font-mono">Ubuntu/Debian:</span>
                  </div>
                  <code className="text-green-400 font-mono text-sm">
                    sudo apt install openvpn
                  </code>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400 text-sm font-mono">Fedora:</span>
                  </div>
                  <code className="text-green-400 font-mono text-sm">
                    sudo dnf install openvpn
                  </code>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400 text-sm font-mono">Arch Linux:</span>
                  </div>
                  <code className="text-green-400 font-mono text-sm">
                    sudo pacman -S openvpn
                  </code>
                </div>
              </div>
            )}

            {/* Other platforms */}
            <CollapsibleSection title="Other Platforms">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {deviceType !== "windows" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="windows" className="w-6 h-6" />
                      <h4 className="text-white font-medium">Windows</h4>
                    </div>
                    <a
                      href="https://openvpn.net/client/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors text-sm"
                    >
                      Download from openvpn.net
                    </a>
                  </div>
                )}
                {deviceType !== "mac" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="mac" className="w-6 h-6" />
                      <h4 className="text-white font-medium">macOS</h4>
                    </div>
                    <a
                      href="https://openvpn.net/client/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors text-sm"
                    >
                      Download from openvpn.net
                    </a>
                  </div>
                )}
                {deviceType !== "iphone" && deviceType !== "ipad" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="iphone" className="w-6 h-6" />
                      <h4 className="text-white font-medium">iOS (iPhone/iPad)</h4>
                    </div>
                    <a
                      href="https://apps.apple.com/app/openvpn-connect/id590379981"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors text-sm"
                    >
                      Download from App Store
                    </a>
                  </div>
                )}
                {deviceType !== "android" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="android" className="w-6 h-6" />
                      <h4 className="text-white font-medium">Android</h4>
                    </div>
                    <a
                      href="https://play.google.com/store/apps/details?id=net.openvpn.openvpn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors text-sm"
                    >
                      Download from Play Store
                    </a>
                  </div>
                )}
                {deviceType !== "linux" && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <PlatformIcon deviceType="linux" className="w-6 h-6" />
                      <h4 className="text-white font-medium">Linux</h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Install via package manager (apt, dnf, pacman)
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* Step 2: Download Profile */}
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">2</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Download Your Profile</h2>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Connect Wallet & Purchase</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Go to your account page, connect your Cardano wallet, and purchase a VPN subscription.
                Then download your OpenVPN profile (.ovpn file).
              </p>
              <Link
                to="/account"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Go to Account Page
              </Link>
            </div>
          </div>

          {/* Step 3: Import & Connect */}
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">3</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Import & Connect</h2>
            </div>

            {/* Mobile-specific instructions */}
            {isMobile && (
              <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/30 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Import Profile on {deviceName}</h3>
                </div>
                <ol className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">1.</span>
                    Open the OpenVPN Connect app on your {deviceName}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">2.</span>
                    Tap the "+" or "Import" button
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">3.</span>
                    Select your downloaded .ovpn profile file
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">4.</span>
                    Tap "Add" to import the profile
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">5.</span>
                    Toggle the switch to connect
                  </li>
                </ol>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Import Config */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Import Profile</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="windows" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Windows</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Right-click system tray icon, select "Import file..." and choose your .ovpn file
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="mac" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">macOS</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Click menu bar icon, select "Import Profile" and choose your .ovpn file
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="linux" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Linux</span>
                    </div>
                    <code className="text-green-400 font-mono text-sm">
                      sudo openvpn --config ./nabu-vpn.ovpn
                    </code>
                  </div>
                </div>
              </div>

              {/* Connect */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Connect</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="windows" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Windows</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Right-click system tray icon and select "Connect"
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="mac" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">macOS</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Click menu bar icon and toggle the switch to connect
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="iphone" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Mobile</span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      Toggle the switch next to your profile
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon deviceType="linux" className="w-4 h-4" />
                      <span className="text-gray-300 text-sm">Linux</span>
                    </div>
                    <code className="text-green-400 font-mono text-sm">
                      sudo openvpn --config ./nabu-vpn.ovpn
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-gray-300 text-sm">
                    Need more help with OpenVPN?
                    <a
                      href="https://openvpn.net/connect-docs/user-guide.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-white transition-colors ml-1"
                    >
                      See the official OpenVPN user guide
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const InstallGuide = () => {
  return (
    <div className="flex flex-col relative pt-16 min-h-screen overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            How to Install NABU VPN
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            {isWireGuardEnabled
              ? "Follow these steps to install WireGuard and connect with your NABU subscription on any device."
              : "Follow these steps to install OpenVPN and connect with your NABU profile on any device."}
          </p>
        </div>

        {isWireGuardEnabled ? <WireGuardInstallGuide /> : <OpenVpnInstallGuide />}

        <div className="text-center mt-8">
          <Link
            to="/docs-faqs"
            className="inline-flex items-center px-8 py-4 text-white border border-white/20 backdrop-blur-sm font-semibold rounded-xl shadow-lg hover:bg-gray-800 transition-colors"
          >
            <span className="mr-2">Read FAQs</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InstallGuide;
