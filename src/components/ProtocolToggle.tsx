import { useState } from 'react';

/**
 * ProtocolToggle component for switching between WireGuard and OpenVPN protocols.
 *
 * Behavior:
 * - Defaults to WireGuard when VITE_WIREGUARD_ENABLED=true
 * - Shows "Looking for OpenVPN?" link when VITE_OPENVPN_REGION is set
 * - When OpenVPN is selected, shows a recommendation banner with a link to switch back
 * - Banner can be dismissed and preference is saved to localStorage
 * - When WireGuard is disabled (feature flag off), this component should not be rendered
 */

export type VpnProtocolType = 'wireguard' | 'openvpn';

const BANNER_DISMISSED_KEY = 'wireguard-recommendation-dismissed';

export interface ProtocolToggleProps {
  selectedProtocol: VpnProtocolType;
  onProtocolChange: (protocol: VpnProtocolType) => void;
}

// Check if WireGuard feature is enabled
const isWireGuardEnabled = import.meta.env.VITE_WIREGUARD_ENABLED === 'true';

// Get the OpenVPN region identifier (if set, OpenVPN is available)
const openVpnRegion = import.meta.env.VITE_OPENVPN_REGION;

/**
 * Helper to check if WireGuard UI should be shown
 */
export function shouldShowWireGuardUI(): boolean {
  return isWireGuardEnabled;
}

/**
 * Helper to check if OpenVPN option should be available
 */
export function isOpenVpnAvailable(): boolean {
  return !!openVpnRegion;
}

/**
 * Get the OpenVPN region identifier
 */
export function getOpenVpnRegion(): string | undefined {
  return openVpnRegion;
}

const ProtocolToggle = ({
  selectedProtocol,
  onProtocolChange,
}: ProtocolToggleProps) => {
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch {
      // Ignore localStorage errors
    }
  };

  // If WireGuard is not enabled, don't render the toggle
  // (the parent should handle showing OpenVPN-only flow)
  if (!isWireGuardEnabled) {
    return null;
  }

  const showOpenVpnLink = isOpenVpnAvailable();

  // WireGuard view with "Looking for OpenVPN?" link
  if (selectedProtocol === 'wireguard') {
    return (
      <div className="flex flex-col items-center gap-2 w-full">
        {showOpenVpnLink && (
          <button
            type="button"
            onClick={() => onProtocolChange('openvpn')}
            className="text-sm text-[#E1B8FF] hover:text-white transition-colors cursor-pointer underline underline-offset-2"
          >
            Looking for OpenVPN?
          </button>
        )}
      </div>
    );
  }

  // OpenVPN view with recommendation banner (if not dismissed) or minimal switch link
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {!bannerDismissed ? (
        <div className="w-full max-w-2xl rounded-lg bg-blue-500/20 border border-blue-500/40 p-4 relative">
          <button
            type="button"
            onClick={handleDismissBanner}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Dismiss recommendation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="flex items-start gap-3 pr-6">
            <span className="text-blue-400 text-xl flex-shrink-0" role="img" aria-label="Info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onProtocolChange('wireguard')}
                className="self-start text-sm font-semibold text-[#9400FF] hover:text-[#B44DFF] transition-colors cursor-pointer underline underline-offset-2"
              >
                We recommend WireGuard
              </button>
              <p className="text-sm text-gray-300">
                WireGuard offers faster speeds and multi-device support. OpenVPN is provided for compatibility with devices that don't support WireGuard.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onProtocolChange('wireguard')}
          className="text-sm text-[#E1B8FF] hover:text-white transition-colors cursor-pointer underline underline-offset-2"
        >
          Switch to WireGuard
        </button>
      )}
    </div>
  );
};

export default ProtocolToggle;
