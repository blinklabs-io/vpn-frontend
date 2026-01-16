import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Helper to reset the module cache between tests
const resetModule = async () => {
  vi.resetModules();
  const module = await import("../deviceDetection");
  return module;
};

describe("deviceDetection utilities", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("detectDeviceTypeRaw", () => {
    it("should return 'unknown' when navigator is undefined", async () => {
      vi.stubGlobal("navigator", undefined);

      const { detectDeviceTypeRaw } = await resetModule();
      expect(detectDeviceTypeRaw()).toBe("unknown");
    });

    it("should return 'iphone' for iPhone user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        platform: "iPhone",
        maxTouchPoints: 5,
      });

      const { detectDeviceTypeRaw } = await resetModule();
      expect(detectDeviceTypeRaw()).toBe("iphone");
    });

    it("should return 'ipad' for iPad user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        platform: "iPad",
        maxTouchPoints: 5,
      });

      const { detectDeviceTypeRaw } = await resetModule();
      expect(detectDeviceTypeRaw()).toBe("ipad");
    });

    it("should return 'ipad' for iPadOS 13+ (desktop Safari UA with touch)", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      });

      const { detectDeviceTypeRaw } = await resetModule();
      expect(detectDeviceTypeRaw()).toBe("ipad");
    });

    it("should return 'mac' for macOS desktop user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "MacIntel",
        maxTouchPoints: 0,
      });

      const { detectDeviceTypeRaw } = await resetModule();
      expect(detectDeviceTypeRaw()).toBe("mac");
    });

    it("should return 'windows' for Windows user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Win32",
        maxTouchPoints: 0,
      });

      const { detectDeviceTypeRaw } = await resetModule();
      expect(detectDeviceTypeRaw()).toBe("windows");
    });

    it("should return 'android' for Android user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      });

      const { detectDeviceTypeRaw } = await resetModule();
      expect(detectDeviceTypeRaw()).toBe("android");
    });

    it("should return 'linux' for Linux desktop user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Linux x86_64",
        maxTouchPoints: 0,
      });

      const { detectDeviceTypeRaw } = await resetModule();
      expect(detectDeviceTypeRaw()).toBe("linux");
    });

    it("should return 'unknown' for unrecognized user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "SomeCustomBrowser/1.0",
        platform: "unknown",
        maxTouchPoints: 0,
      });

      const { detectDeviceTypeRaw } = await resetModule();
      expect(detectDeviceTypeRaw()).toBe("unknown");
    });
  });

  describe("detectDeviceType", () => {
    it("should return 'iPhone' for iPhone device", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        platform: "iPhone",
        maxTouchPoints: 5,
      });

      const { detectDeviceType } = await resetModule();
      expect(detectDeviceType()).toBe("iPhone");
    });

    it("should return 'iPad' for iPad device", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
        platform: "iPad",
        maxTouchPoints: 5,
      });

      const { detectDeviceType } = await resetModule();
      expect(detectDeviceType()).toBe("iPad");
    });

    it("should return 'MacBook' for macOS device", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 0,
      });

      const { detectDeviceType } = await resetModule();
      expect(detectDeviceType()).toBe("MacBook");
    });

    it("should return 'Windows PC' for Windows device", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        platform: "Win32",
        maxTouchPoints: 0,
      });

      const { detectDeviceType } = await resetModule();
      expect(detectDeviceType()).toBe("Windows PC");
    });

    it("should return 'Android Phone' for Android device", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      });

      const { detectDeviceType } = await resetModule();
      expect(detectDeviceType()).toBe("Android Phone");
    });

    it("should return 'Linux Desktop' for Linux device", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
        platform: "Linux x86_64",
        maxTouchPoints: 0,
      });

      const { detectDeviceType } = await resetModule();
      expect(detectDeviceType()).toBe("Linux Desktop");
    });

    it("should return 'Device' for unknown device type", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "UnknownBrowser/1.0",
        platform: "unknown",
        maxTouchPoints: 0,
      });

      const { detectDeviceType } = await resetModule();
      expect(detectDeviceType()).toBe("Device");
    });
  });

  describe("getDeviceIcon", () => {
    it("should return mobile phone emoji for iPhone", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
        platform: "iPhone",
        maxTouchPoints: 5,
      });

      const { getDeviceIcon } = await resetModule();
      expect(getDeviceIcon()).toBe("\u{1F4F1}");
    });

    it("should return mobile phone emoji for Android", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (Linux; Android 14)",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      });

      const { getDeviceIcon } = await resetModule();
      expect(getDeviceIcon()).toBe("\u{1F4F1}");
    });

    it("should return tablet emoji for iPad", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0)",
        platform: "iPad",
        maxTouchPoints: 5,
      });

      const { getDeviceIcon } = await resetModule();
      expect(getDeviceIcon()).toBe("\u{1F4F2}");
    });

    it("should return laptop emoji for Mac", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 0,
      });

      const { getDeviceIcon } = await resetModule();
      expect(getDeviceIcon()).toBe("\u{1F4BB}");
    });

    it("should return laptop emoji for Windows", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (Windows NT 10.0)",
        platform: "Win32",
        maxTouchPoints: 0,
      });

      const { getDeviceIcon } = await resetModule();
      expect(getDeviceIcon()).toBe("\u{1F4BB}");
    });

    it("should return laptop emoji for Linux", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
        platform: "Linux x86_64",
        maxTouchPoints: 0,
      });

      const { getDeviceIcon } = await resetModule();
      expect(getDeviceIcon()).toBe("\u{1F4BB}");
    });

    it("should return desktop computer emoji for unknown device", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "UnknownBrowser/1.0",
        platform: "unknown",
        maxTouchPoints: 0,
      });

      const { getDeviceIcon } = await resetModule();
      expect(getDeviceIcon()).toBe("\u{1F5A5}");
    });
  });

  describe("inferDeviceTypeFromName", () => {
    beforeEach(async () => {
      // Set up a default navigator for inferDeviceTypeFromName tests
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0",
        platform: "unknown",
        maxTouchPoints: 0,
      });
    });

    it("should return 'iphone' for name containing 'iphone'", async () => {
      const { inferDeviceTypeFromName } = await resetModule();
      expect(inferDeviceTypeFromName("My iPhone")).toBe("iphone");
      expect(inferDeviceTypeFromName("IPHONE 15")).toBe("iphone");
      expect(inferDeviceTypeFromName("iphone-work")).toBe("iphone");
    });

    it("should return 'ipad' for name containing 'ipad'", async () => {
      const { inferDeviceTypeFromName } = await resetModule();
      expect(inferDeviceTypeFromName("My iPad")).toBe("ipad");
      expect(inferDeviceTypeFromName("IPAD Pro")).toBe("ipad");
      expect(inferDeviceTypeFromName("ipad-home")).toBe("ipad");
    });

    it("should return 'mac' for name containing 'mac' or 'macbook'", async () => {
      const { inferDeviceTypeFromName } = await resetModule();
      expect(inferDeviceTypeFromName("MacBook Pro")).toBe("mac");
      expect(inferDeviceTypeFromName("My Mac")).toBe("mac");
      expect(inferDeviceTypeFromName("mac mini")).toBe("mac");
      expect(inferDeviceTypeFromName("MACBOOK Air")).toBe("mac");
    });

    it("should return 'windows' for name containing 'windows' or 'pc'", async () => {
      const { inferDeviceTypeFromName } = await resetModule();
      expect(inferDeviceTypeFromName("Windows Desktop")).toBe("windows");
      expect(inferDeviceTypeFromName("My PC")).toBe("windows");
      expect(inferDeviceTypeFromName("Office PC")).toBe("windows");
      expect(inferDeviceTypeFromName("WINDOWS laptop")).toBe("windows");
    });

    it("should return 'android' for name containing 'android'", async () => {
      const { inferDeviceTypeFromName } = await resetModule();
      expect(inferDeviceTypeFromName("Android Phone")).toBe("android");
      expect(inferDeviceTypeFromName("My ANDROID")).toBe("android");
      expect(inferDeviceTypeFromName("android-tablet")).toBe("android");
    });

    it("should return 'linux' for name containing 'linux', 'ubuntu', or 'debian'", async () => {
      const { inferDeviceTypeFromName } = await resetModule();
      expect(inferDeviceTypeFromName("Linux Server")).toBe("linux");
      expect(inferDeviceTypeFromName("Ubuntu Desktop")).toBe("linux");
      expect(inferDeviceTypeFromName("Debian Box")).toBe("linux");
      expect(inferDeviceTypeFromName("my LINUX laptop")).toBe("linux");
    });

    it("should return 'unknown' for unrecognized names", async () => {
      const { inferDeviceTypeFromName } = await resetModule();
      expect(inferDeviceTypeFromName("My Device")).toBe("unknown");
      expect(inferDeviceTypeFromName("Home")).toBe("unknown");
      expect(inferDeviceTypeFromName("Work Computer")).toBe("unknown");
      expect(inferDeviceTypeFromName("")).toBe("unknown");
    });

    it("should be case-insensitive", async () => {
      const { inferDeviceTypeFromName } = await resetModule();
      expect(inferDeviceTypeFromName("IPHONE")).toBe("iphone");
      expect(inferDeviceTypeFromName("iphone")).toBe("iphone");
      expect(inferDeviceTypeFromName("IPhone")).toBe("iphone");
      expect(inferDeviceTypeFromName("iPHONE")).toBe("iphone");
    });
  });

  describe("getDeviceIconFromName", () => {
    beforeEach(async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0",
        platform: "unknown",
        maxTouchPoints: 0,
      });
    });

    it("should return mobile phone emoji for iPhone name", async () => {
      const { getDeviceIconFromName } = await resetModule();
      expect(getDeviceIconFromName("My iPhone")).toBe("\u{1F4F1}");
    });

    it("should return mobile phone emoji for Android name", async () => {
      const { getDeviceIconFromName } = await resetModule();
      expect(getDeviceIconFromName("Android Phone")).toBe("\u{1F4F1}");
    });

    it("should return tablet emoji for iPad name", async () => {
      const { getDeviceIconFromName } = await resetModule();
      expect(getDeviceIconFromName("iPad Pro")).toBe("\u{1F4F2}");
    });

    it("should return laptop emoji for Mac name", async () => {
      const { getDeviceIconFromName } = await resetModule();
      expect(getDeviceIconFromName("MacBook")).toBe("\u{1F4BB}");
    });

    it("should return laptop emoji for Windows name", async () => {
      const { getDeviceIconFromName } = await resetModule();
      expect(getDeviceIconFromName("Windows PC")).toBe("\u{1F4BB}");
    });

    it("should return laptop emoji for Linux name", async () => {
      const { getDeviceIconFromName } = await resetModule();
      expect(getDeviceIconFromName("Linux Desktop")).toBe("\u{1F4BB}");
    });

    it("should return desktop computer emoji for unknown name", async () => {
      const { getDeviceIconFromName } = await resetModule();
      expect(getDeviceIconFromName("My Device")).toBe("\u{1F5A5}");
    });
  });
});
