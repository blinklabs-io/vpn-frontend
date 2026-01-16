import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getDeviceName,
  setDeviceName,
  removeDeviceName,
  getAllDeviceNames,
} from "../deviceNames";

describe("deviceNames utilities", () => {
  const STORAGE_KEY = "wg-device-names";

  // Mock localStorage
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => mockStorage[key] || null,
    );

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      (key: string, value: string) => {
        mockStorage[key] = value;
      },
    );

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(
      (key: string) => {
        delete mockStorage[key];
      },
    );

    vi.clearAllMocks();
  });

  describe("getDeviceName", () => {
    it("should return null for unknown pubkey", () => {
      const result = getDeviceName("unknown-pubkey");
      expect(result).toBeNull();
    });

    it("should return null when localStorage is empty", () => {
      const result = getDeviceName("some-pubkey");
      expect(result).toBeNull();
    });

    it("should return the stored name for a known pubkey", () => {
      const pubkey = "test-pubkey-123";
      const deviceName = "My iPhone";
      mockStorage[STORAGE_KEY] = JSON.stringify({
        [pubkey]: { name: deviceName, createdAt: "2024-01-01T00:00:00.000Z" },
      });

      const result = getDeviceName(pubkey);
      expect(result).toBe(deviceName);
    });

    it("should return null when pubkey exists but has no name field", () => {
      const pubkey = "test-pubkey-123";
      mockStorage[STORAGE_KEY] = JSON.stringify({
        [pubkey]: { createdAt: "2024-01-01T00:00:00.000Z" },
      });

      const result = getDeviceName(pubkey);
      expect(result).toBeNull();
    });

    it("should return null and log error when localStorage contains invalid JSON", () => {
      mockStorage[STORAGE_KEY] = "invalid-json";

      const result = getDeviceName("some-pubkey");
      expect(result).toBeNull();
    });

    it("should return the correct name when multiple devices exist", () => {
      const pubkey1 = "pubkey-1";
      const pubkey2 = "pubkey-2";
      mockStorage[STORAGE_KEY] = JSON.stringify({
        [pubkey1]: { name: "Device 1", createdAt: "2024-01-01T00:00:00.000Z" },
        [pubkey2]: { name: "Device 2", createdAt: "2024-01-02T00:00:00.000Z" },
      });

      expect(getDeviceName(pubkey1)).toBe("Device 1");
      expect(getDeviceName(pubkey2)).toBe("Device 2");
    });
  });

  describe("setDeviceName", () => {
    it("should store name correctly for new pubkey", () => {
      const pubkey = "new-pubkey";
      const name = "My New Device";

      setDeviceName(pubkey, name);

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored[pubkey]).toBeDefined();
      expect(stored[pubkey].name).toBe(name);
      expect(stored[pubkey].createdAt).toBeDefined();
    });

    it("should create ISO timestamp when storing", () => {
      const pubkey = "test-pubkey";
      const name = "Test Device";

      setDeviceName(pubkey, name);

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored[pubkey].createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it("should update existing device name", () => {
      const pubkey = "existing-pubkey";
      mockStorage[STORAGE_KEY] = JSON.stringify({
        [pubkey]: { name: "Old Name", createdAt: "2024-01-01T00:00:00.000Z" },
      });

      setDeviceName(pubkey, "New Name");

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored[pubkey].name).toBe("New Name");
    });

    it("should preserve other devices when adding new one", () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({
        "existing-pubkey": { name: "Existing Device", createdAt: "2024-01-01T00:00:00.000Z" },
      });

      setDeviceName("new-pubkey", "New Device");

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored["existing-pubkey"].name).toBe("Existing Device");
      expect(stored["new-pubkey"].name).toBe("New Device");
    });

    it("should handle empty string name", () => {
      const pubkey = "test-pubkey";

      setDeviceName(pubkey, "");

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored[pubkey].name).toBe("");
    });

    it("should handle names with special characters", () => {
      const pubkey = "test-pubkey";
      const name = 'My "Special" Device <test>';

      setDeviceName(pubkey, name);

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored[pubkey].name).toBe(name);
    });
  });

  describe("removeDeviceName", () => {
    it("should remove entry for given pubkey", () => {
      const pubkey = "pubkey-to-remove";
      mockStorage[STORAGE_KEY] = JSON.stringify({
        [pubkey]: { name: "Device", createdAt: "2024-01-01T00:00:00.000Z" },
      });

      removeDeviceName(pubkey);

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored[pubkey]).toBeUndefined();
    });

    it("should not throw when removing non-existent pubkey", () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({});

      expect(() => removeDeviceName("non-existent")).not.toThrow();
    });

    it("should not throw when localStorage is empty", () => {
      expect(() => removeDeviceName("any-pubkey")).not.toThrow();
    });

    it("should preserve other devices when removing one", () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({
        "pubkey-1": { name: "Device 1", createdAt: "2024-01-01T00:00:00.000Z" },
        "pubkey-2": { name: "Device 2", createdAt: "2024-01-02T00:00:00.000Z" },
        "pubkey-3": { name: "Device 3", createdAt: "2024-01-03T00:00:00.000Z" },
      });

      removeDeviceName("pubkey-2");

      const stored = JSON.parse(mockStorage[STORAGE_KEY]);
      expect(stored["pubkey-1"]).toBeDefined();
      expect(stored["pubkey-2"]).toBeUndefined();
      expect(stored["pubkey-3"]).toBeDefined();
    });
  });

  describe("getAllDeviceNames", () => {
    it("should return all entries", () => {
      const mapping = {
        "pubkey-1": { name: "Device 1", createdAt: "2024-01-01T00:00:00.000Z" },
        "pubkey-2": { name: "Device 2", createdAt: "2024-01-02T00:00:00.000Z" },
      };
      mockStorage[STORAGE_KEY] = JSON.stringify(mapping);

      const result = getAllDeviceNames();
      expect(result).toEqual(mapping);
    });

    it("should return empty object when localStorage is empty", () => {
      const result = getAllDeviceNames();
      expect(result).toEqual({});
    });

    it("should return empty object when localStorage contains invalid JSON", () => {
      mockStorage[STORAGE_KEY] = "invalid-json";

      const result = getAllDeviceNames();
      expect(result).toEqual({});
    });

    it("should return entries with correct structure", () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({
        "pubkey-1": { name: "Device 1", createdAt: "2024-01-01T00:00:00.000Z" },
      });

      const result = getAllDeviceNames();
      expect(result["pubkey-1"]).toHaveProperty("name");
      expect(result["pubkey-1"]).toHaveProperty("createdAt");
    });

    it("should return a new object, not the same reference", () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({
        "pubkey-1": { name: "Device 1", createdAt: "2024-01-01T00:00:00.000Z" },
      });

      const result1 = getAllDeviceNames();
      const result2 = getAllDeviceNames();
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe("integration", () => {
    it("should set and get device name correctly", () => {
      const pubkey = "test-pubkey";
      const name = "Test Device";

      setDeviceName(pubkey, name);
      const result = getDeviceName(pubkey);

      expect(result).toBe(name);
    });

    it("should set, get, and remove device name correctly", () => {
      const pubkey = "test-pubkey";
      const name = "Test Device";

      setDeviceName(pubkey, name);
      expect(getDeviceName(pubkey)).toBe(name);

      removeDeviceName(pubkey);
      expect(getDeviceName(pubkey)).toBeNull();
    });

    it("should handle multiple operations correctly", () => {
      setDeviceName("pubkey-1", "Device 1");
      setDeviceName("pubkey-2", "Device 2");
      setDeviceName("pubkey-3", "Device 3");

      expect(Object.keys(getAllDeviceNames())).toHaveLength(3);

      removeDeviceName("pubkey-2");
      expect(Object.keys(getAllDeviceNames())).toHaveLength(2);

      setDeviceName("pubkey-1", "Updated Device 1");
      expect(getDeviceName("pubkey-1")).toBe("Updated Device 1");
    });
  });
});
