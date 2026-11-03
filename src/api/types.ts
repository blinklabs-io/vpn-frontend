export interface RefDataResponse {
  regions?: string[];
  prices?: Array<{
    duration: number;
    price: number;
  }>;
  [key: string]: unknown;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export interface TxSignupRequest {
  paymentAddress: string;
  duration: number;
  price: number;
  region: string;
  protocol: VpnProtocol;
}

export interface TxSignupResponse {
  clientId: string;
  txCbor: string;
}

export interface ClientListRequest {
  ownerAddress: string;
}

export interface ClientInfo {
  expiration: string;
  id: string;
  region: string;
  duration?: number;
}

export interface ClientListResponse extends ApiResponse<ClientInfo[]> {
  data: ClientInfo[];
}

export interface ClientAvailableRequest {
  id: string;
}

export interface ClientAvailableResponse {
  msg?: string;
}

export interface ClientProfileRequest {
  /** Hex-encoded NFT asset name; auth is via the Bearer session token. */
  id: string;
}

export interface TxRenewRequest {
  paymentAddress: string;
  clientId: string;
  duration: number;
  price: number;
  region: string;
  protocol: VpnProtocol;
}

export interface TxRenewResponse {
  txCbor: string;
}

// ============================================================================
// Session Auth Types
// ============================================================================

/**
 * POST /api/auth/session - Exchange a wallet-signed challenge for a session
 * token covering all subscriptions owned by the wallet.
 */
export interface SessionTokenResponse {
  /** Signed JWT session token to send as `Authorization: Bearer <token>` */
  token: string;
  /** Unix timestamp (seconds) at which the token expires */
  expires_at: number;
}

// ============================================================================
// WireGuard Types
// ============================================================================

/**
 * Authentication payload for WireGuard API requests.
 *
 * Requests are authenticated with an `Authorization: Bearer <token>` header
 * (see {@link SessionTokenResponse}); `client_id` only names the target
 * subscription in the body.
 */
export interface WireGuardAuthPayload {
  /** Hex-encoded NFT asset name (subscription identifier) */
  client_id: string;
}

/**
 * POST /api/client/wg-register - Register a new WireGuard device
 */
export interface WireGuardRegisterRequest extends WireGuardAuthPayload {
  /** Base64-encoded WireGuard public key */
  wg_pubkey: string;
}

export interface WireGuardRegisterResponse {
  success: boolean;
  /** Assigned IP address, e.g., "10.8.0.2" */
  assigned_ip: string;
  /** Current number of registered devices */
  device_count: number;
  /** Maximum allowed devices (default: 3) */
  device_limit: number;
}

/**
 * POST /api/client/wg-profile - Get WireGuard config file content
 * Note: Auto-registers device if not already registered
 */
export interface WireGuardProfileRequest extends WireGuardAuthPayload {
  /** Base64-encoded WireGuard public key */
  wg_pubkey: string;
}
// Response: plain text (Content-Type: text/plain) - the .conf file content

/**
 * DELETE /api/client/wg-peer - Remove a WireGuard device
 */
export interface WireGuardPeerRequest extends WireGuardAuthPayload {
  /** Base64-encoded WireGuard public key */
  wg_pubkey: string;
}

export interface WireGuardDeleteResponse {
  success: boolean;
  /** Number of devices remaining after deletion */
  remaining_devices: number;
}

/**
 * POST /api/client/wg-devices - List all registered devices for a client
 */
export type WireGuardDevicesRequest = WireGuardAuthPayload;

export interface WireGuardDevicesResponse {
  devices: Array<{
    /** Base64-encoded WireGuard public key */
    pubkey: string;
    /** Assigned IP address */
    assigned_ip: string;
    /** Unix timestamp of device registration */
    created_at: number;
  }>;
  /** Maximum allowed devices */
  limit: number;
}

/**
 * Frontend-only device representation.
 * Combines backend device data with locally-stored device names.
 */
export interface WireGuardDevice {
  /** Base64-encoded WireGuard public key (from backend) */
  pubkey: string;
  /** User-assigned device name (from localStorage) */
  name: string;
  /** Assigned IP address (from backend) */
  assignedIp: string;
  /** ISO timestamp of device registration (converted from unix timestamp) */
  createdAt: string;
}

// ============================================================================
// VPN Instance Types
// ============================================================================

/** VPN protocol type */
export type VpnProtocol = 'openvpn' | 'wireguard';

/**
 * Represents a VPN subscription instance.
 * Extends ClientInfo with protocol and device information.
 */
export interface VpnInstance extends ClientInfo {
  /** Protocol used by this instance */
  protocol: VpnProtocol;
  /** Registered devices (only for WireGuard instances, frontend-enriched) */
  devices?: WireGuardDevice[];
}
