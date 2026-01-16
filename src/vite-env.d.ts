/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API URL (defaults to https://preprod-api.b7s.services) */
  readonly VITE_API_URL: string;
  /** Cardano network: 'mainnet' | 'preprod' | 'preview' (defaults to preprod) */
  readonly VITE_CARDANO_NETWORK: 'mainnet' | 'preprod' | 'preview';
  /** WireGuard feature flag - set to 'true' to enable WireGuard UI */
  readonly VITE_WIREGUARD_ENABLED: string;
  /** OpenVPN region identifier(s) - comma-separated list. If not set, OpenVPN flows are hidden */
  readonly VITE_OPENVPN_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
