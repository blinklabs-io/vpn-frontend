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
  id: string;
  key: string;
  signature: string;
}

export interface TxRenewRequest {
  paymentAddress: string;
  clientId: string;
  duration: number;
  price: number;
  region: string;
}

export interface TxRenewResponse {
  txCbor: string;
}

// ============================================================================
// WireGuard Types
// ============================================================================

/**
 * Authentication payload required for all WireGuard API requests.
 * Uses COSE signature verification with Ed25519 keys.
 */
export interface WireGuardAuthPayload {
  /** Hex-encoded NFT asset name (subscription identifier) */
  client_id: string;
  /** Unix timestamp (must be within 15 minutes of server time) */
  timestamp: number;
  /** Hex-encoded COSE Sign1 message (payload = client_id + timestamp) */
  signature: string;
  /** Hex-encoded COSE Key (Ed25519 public key) */
  key: string;
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
