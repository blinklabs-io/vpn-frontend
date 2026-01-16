import { describe, it, expect, afterEach, vi } from "vitest";

describe("wireguardKeys utilities", () => {
  // Store original crypto reference
  const originalCrypto = global.crypto;

  // Helper to reset the module cache
  const resetModule = async () => {
    vi.resetModules();
    const module = await import("../wireguardKeys");
    return module;
  };

  // Helper to create a mock JWK with a base64url-encoded 'd' parameter
  const createMockJwk = (privateKeyBytes: Uint8Array) => {
    // Convert bytes to base64url (JWK uses base64url, not standard base64)
    const base64 = btoa(String.fromCharCode(...privateKeyBytes));
    const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    return {
      kty: "OKP",
      crv: "X25519",
      d: base64url,
      x: "mockPublicKeyX",
    };
  };

  afterEach(() => {
    vi.resetAllMocks();
    // Restore original crypto
    global.crypto = originalCrypto;
  });

  describe("generateWireGuardKeypair", () => {
    it("should generate a keypair with base64-encoded public and private keys", async () => {
      // Create mock 32-byte keys
      const mockPublicKeyBytes = new Uint8Array(32).fill(1);
      const mockPrivateKeyBytes = new Uint8Array(32).fill(2);

      const mockKeyPair = {
        publicKey: { type: "public" },
        privateKey: { type: "private" },
      };

      // Mock crypto.subtle
      const mockSubtle = {
        generateKey: vi.fn().mockResolvedValue(mockKeyPair),
        exportKey: vi.fn().mockImplementation((format, key) => {
          if (format === "raw" && key.type === "public") {
            return Promise.resolve(mockPublicKeyBytes.buffer);
          }
          if (format === "jwk" && key.type === "private") {
            return Promise.resolve(createMockJwk(mockPrivateKeyBytes));
          }
          throw new Error("Unknown export format");
        }),
      };

      vi.stubGlobal("crypto", {
        subtle: mockSubtle,
      });

      const { generateWireGuardKeypair } = await resetModule();
      const keypair = await generateWireGuardKeypair();

      expect(keypair).toBeDefined();
      expect(keypair.publicKey).toBeDefined();
      expect(keypair.privateKey).toBeDefined();
      expect(typeof keypair.publicKey).toBe("string");
      expect(typeof keypair.privateKey).toBe("string");
    });

    it("should return keys with correct base64 length for 32-byte keys", async () => {
      // 32 bytes base64-encoded = 44 characters (with padding)
      const mockPublicKeyBytes = new Uint8Array(32).fill(0xab);
      const mockPrivateKeyBytes = new Uint8Array(32).fill(0xcd);

      const mockKeyPair = {
        publicKey: { type: "public" },
        privateKey: { type: "private" },
      };

      const mockSubtle = {
        generateKey: vi.fn().mockResolvedValue(mockKeyPair),
        exportKey: vi.fn().mockImplementation((format, key) => {
          if (format === "raw" && key.type === "public") {
            return Promise.resolve(mockPublicKeyBytes.buffer);
          }
          if (format === "jwk" && key.type === "private") {
            return Promise.resolve(createMockJwk(mockPrivateKeyBytes));
          }
          throw new Error("Unknown export format");
        }),
      };

      vi.stubGlobal("crypto", {
        subtle: mockSubtle,
      });

      const { generateWireGuardKeypair } = await resetModule();
      const keypair = await generateWireGuardKeypair();

      // Base64 encoding of 32 bytes produces 44 characters (32 * 4 / 3 = 42.67, rounded up with padding = 44)
      expect(keypair.publicKey.length).toBe(44);
      // Private key from JWK may have slightly different length due to base64url conversion
      // but should be close to 44 characters
      expect(keypair.privateKey.length).toBeGreaterThanOrEqual(43);
      expect(keypair.privateKey.length).toBeLessThanOrEqual(44);
    });

    it("should call crypto.subtle.generateKey with X25519 algorithm", async () => {
      const mockKeyPair = {
        publicKey: { type: "public" },
        privateKey: { type: "private" },
      };

      const mockSubtle = {
        generateKey: vi.fn().mockResolvedValue(mockKeyPair),
        exportKey: vi.fn().mockImplementation((format: string) => {
          if (format === "raw") {
            return Promise.resolve(new Uint8Array(32).buffer);
          }
          if (format === "jwk") {
            return Promise.resolve(createMockJwk(new Uint8Array(32)));
          }
          throw new Error("Unknown export format");
        }),
      };

      vi.stubGlobal("crypto", {
        subtle: mockSubtle,
      });

      const { generateWireGuardKeypair } = await resetModule();
      await generateWireGuardKeypair();

      expect(mockSubtle.generateKey).toHaveBeenCalledWith(
        { name: "X25519" },
        true,
        ["deriveBits"],
      );
    });

    it("should throw error when WebCrypto API is not available", async () => {
      vi.stubGlobal("crypto", undefined);

      const { generateWireGuardKeypair } = await resetModule();

      await expect(generateWireGuardKeypair()).rejects.toThrow(
        "WebCrypto API is not available",
      );
    });

    it("should throw error when crypto.subtle is not available", async () => {
      vi.stubGlobal("crypto", {
        subtle: undefined,
      });

      const { generateWireGuardKeypair } = await resetModule();

      await expect(generateWireGuardKeypair()).rejects.toThrow(
        "WebCrypto API is not available",
      );
    });

    it("should export public key in raw format", async () => {
      const mockKeyPair = {
        publicKey: { type: "public" },
        privateKey: { type: "private" },
      };

      const mockSubtle = {
        generateKey: vi.fn().mockResolvedValue(mockKeyPair),
        exportKey: vi.fn().mockImplementation((format) => {
          if (format === "raw") {
            return Promise.resolve(new Uint8Array(32).buffer);
          }
          if (format === "jwk") {
            return Promise.resolve(createMockJwk(new Uint8Array(32)));
          }
          throw new Error("Unknown export format");
        }),
      };

      vi.stubGlobal("crypto", {
        subtle: mockSubtle,
      });

      const { generateWireGuardKeypair } = await resetModule();
      await generateWireGuardKeypair();

      expect(mockSubtle.exportKey).toHaveBeenCalledWith(
        "raw",
        mockKeyPair.publicKey,
      );
    });

    it("should export private key in jwk format", async () => {
      const mockKeyPair = {
        publicKey: { type: "public" },
        privateKey: { type: "private" },
      };

      const mockSubtle = {
        generateKey: vi.fn().mockResolvedValue(mockKeyPair),
        exportKey: vi.fn().mockImplementation((format) => {
          if (format === "raw") {
            return Promise.resolve(new Uint8Array(32).buffer);
          }
          if (format === "jwk") {
            return Promise.resolve(createMockJwk(new Uint8Array(32)));
          }
          throw new Error("Unknown export format");
        }),
      };

      vi.stubGlobal("crypto", {
        subtle: mockSubtle,
      });

      const { generateWireGuardKeypair } = await resetModule();
      await generateWireGuardKeypair();

      expect(mockSubtle.exportKey).toHaveBeenCalledWith(
        "jwk",
        mockKeyPair.privateKey,
      );
    });

    it("should generate different keypairs on subsequent calls", async () => {
      let callCount = 0;
      const mockSubtle = {
        generateKey: vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve({
            publicKey: { type: "public", id: callCount },
            privateKey: { type: "private", id: callCount },
          });
        }),
        exportKey: vi.fn().mockImplementation((format, key) => {
          if (format === "raw") {
            // Return different bytes based on key id
            const bytes = new Uint8Array(32);
            bytes.fill(key.id);
            return Promise.resolve(bytes.buffer);
          }
          if (format === "jwk") {
            // Return different JWK based on key id
            const bytes = new Uint8Array(32);
            bytes.fill(key.id + 100);
            return Promise.resolve(createMockJwk(bytes));
          }
          throw new Error("Unknown export format");
        }),
      };

      vi.stubGlobal("crypto", {
        subtle: mockSubtle,
      });

      const { generateWireGuardKeypair } = await resetModule();
      const keypair1 = await generateWireGuardKeypair();
      const keypair2 = await generateWireGuardKeypair();

      expect(keypair1.publicKey).not.toBe(keypair2.publicKey);
      expect(keypair1.privateKey).not.toBe(keypair2.privateKey);
    });

    it("should propagate errors from crypto.subtle.generateKey", async () => {
      const mockSubtle = {
        generateKey: vi.fn().mockRejectedValue(new Error("Key generation failed")),
        exportKey: vi.fn(),
      };

      vi.stubGlobal("crypto", {
        subtle: mockSubtle,
      });

      const { generateWireGuardKeypair } = await resetModule();

      await expect(generateWireGuardKeypair()).rejects.toThrow(
        "Key generation failed",
      );
    });
  });
});
