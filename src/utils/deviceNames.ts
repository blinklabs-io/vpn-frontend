/**
 * Device name management utilities for WireGuard peers.
 * Stores user-defined device names in localStorage, keyed by public key.
 */

export interface DeviceNameEntry {
  name: string;
  createdAt: string; // ISO timestamp
}

export interface DeviceNameMapping {
  [pubkey: string]: DeviceNameEntry;
}

const STORAGE_KEY = "wg-device-names";

/**
 * Get the stored device name for a given public key
 *
 * @param pubkey - Base64-encoded WireGuard public key
 * @returns The stored device name, or null if not found
 */
export function getDeviceName(pubkey: string): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const mapping: DeviceNameMapping = JSON.parse(stored);
    return mapping[pubkey]?.name ?? null;
  } catch (error) {
    console.error("Failed to get device name:", error);
    return null;
  }
}

/**
 * Store a device name for a given public key
 *
 * @param pubkey - Base64-encoded WireGuard public key
 * @param name - User-defined device name
 */
export function setDeviceName(pubkey: string, name: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const mapping: DeviceNameMapping = stored ? JSON.parse(stored) : {};

    mapping[pubkey] = {
      name,
      createdAt: mapping[pubkey]?.createdAt ?? new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  } catch (error) {
    console.error("Failed to set device name:", error);
  }
}

/**
 * Remove the stored device name for a given public key
 *
 * @param pubkey - Base64-encoded WireGuard public key
 */
export function removeDeviceName(pubkey: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const mapping: DeviceNameMapping = JSON.parse(stored);
    delete mapping[pubkey];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  } catch (error) {
    console.error("Failed to remove device name:", error);
  }
}

/**
 * Get all stored device name mappings
 *
 * @returns Object mapping public keys to device name entries
 */
export function getAllDeviceNames(): DeviceNameMapping {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to get all device names:", error);
    return {};
  }
}
