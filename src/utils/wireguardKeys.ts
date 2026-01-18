/**
 * WireGuard key generation utilities using WebCrypto API.
 * Generates X25519 keypairs for WireGuard peer configurations.
 */

export interface WireGuardKeypair {
  publicKey: string; // Base64-encoded 32-byte X25519 public key
  privateKey: string; // Base64-encoded 32-byte X25519 private key
}

/**
 * Generate a new WireGuard X25519 keypair using WebCrypto API.
 *
 * @returns Promise resolving to an object containing base64-encoded public and private keys
 * @throws Error if WebCrypto API is not available or key generation fails
 */
export async function generateWireGuardKeypair(): Promise<WireGuardKeypair> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("WebCrypto API is not available");
  }

  // Generate X25519 keypair
  const keyPair = (await crypto.subtle.generateKey(
    { name: "X25519" },
    true, // extractable - needed to export the keys
    ["deriveBits"],
  )) as CryptoKeyPair;

  // Export public key (raw format gives us the 32-byte key directly)
  const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKey = btoa(
    String.fromCharCode(...new Uint8Array(publicKeyRaw)),
  );

  // Export private key using JWK format (more robust than PKCS8 slicing)
  const jwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  // JWK 'd' parameter is the private key in base64url encoding
  // Convert base64url to standard base64 and add padding
  const base64url = jwk.d!.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64url.length % 4)) % 4;
  const privateKey = base64url + "=".repeat(padding);

  return { publicKey, privateKey };
}
