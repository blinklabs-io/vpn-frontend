import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Helper to reset the cached environment between tests
// We need to re-import the module to reset the cache
const resetEnvironmentCache = async () => {
  vi.resetModules();
  const module = await import("../environment");
  return module;
};

describe("environment utilities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore original navigator
    vi.unstubAllGlobals();
  });

  describe("detectPlatform", () => {
    it("should return desktop for standard desktop user agents", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("desktop");
    });

    it("should return desktop for macOS without touch", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("desktop");
    });

    it("should return mobile-ios for iPhone user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        maxTouchPoints: 5,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-ios");
    });

    it("should return mobile-ios for iPad user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        maxTouchPoints: 5,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-ios");
    });

    it("should return mobile-ios for iPod user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        maxTouchPoints: 5,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-ios");
    });

    it("should return mobile-ios for iPadOS 13+ (desktop Safari UA with touch)", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        maxTouchPoints: 5,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-ios");
    });

    it("should return mobile-android for Android user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        maxTouchPoints: 5,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-android");
    });

    it("should return mobile-android for Android tablet user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 5,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-android");
    });

    it("should return mobile-other for generic Mobile user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Mobile; rv:120.0) Gecko/120.0 Firefox/120.0",
        maxTouchPoints: 5,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-other");
    });

    it("should return mobile-other for webOS user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (webOS; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager",
        maxTouchPoints: 1,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-other");
    });

    it("should return mobile-android for Opera Mini on Android user agent", async () => {
      // Note: Opera Mini on Android contains "Android" so it matches mobile-android first
      vi.stubGlobal("navigator", {
        userAgent:
          "Opera/9.80 (Android; Opera Mini/36.2.2254/119.132; U; en) Presto/2.12.423 Version/12.16",
        maxTouchPoints: 1,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-android");
    });

    it("should return mobile-other for Opera Mini on non-Android user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Opera/9.80 (J2ME/MIDP; Opera Mini/9.80 (S60; SymbOS; Opera Mobi/23.348; U; en) Presto/2.5.25 Version/10.54",
        maxTouchPoints: 1,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-other");
    });

    it("should return mobile-other for IEMobile user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)",
        maxTouchPoints: 1,
      });

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("mobile-other");
    });

    it("should return desktop when navigator is undefined", async () => {
      vi.stubGlobal("navigator", undefined);

      const { detectPlatform } = await resetEnvironmentCache();
      expect(detectPlatform()).toBe("desktop");
    });
  });

  describe("detectWalletDappBrowser", () => {
    it("should return null for standard browser user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
      });
      vi.stubGlobal("window", { cardano: undefined });

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBeNull();
    });

    it("should detect Lace wallet browser", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Lace/1.0",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("Lace");
    });

    it("should detect Eternl wallet browser", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14) Eternl/1.0 Mobile",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("Eternl");
    });

    it("should detect Eternl wallet browser with ccvault user agent", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14) ccvault/1.0 Mobile",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("Eternl");
    });

    it("should detect Vespr wallet browser", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Vespr/2.0",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("Vespr");
    });

    it("should detect Typhon wallet browser", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14) Typhon/1.0",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("Typhon");
    });

    it("should detect Gero wallet browser", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Gero/1.0",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("Gero");
    });

    it("should detect Yoroi wallet browser", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14) Yoroi/5.0",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("Yoroi");
    });

    it("should detect Begin wallet browser", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Begin/1.0",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("Begin");
    });

    it("should detect NuFi wallet browser", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14) NuFi/1.0",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("NuFi");
    });

    it("should detect generic wallet on mobile with single wallet in window.cardano", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {
        cardano: {
          someWallet: {
            enable: vi.fn(),
            isEnabled: vi.fn(),
          },
        },
      });

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("SomeWallet");
    });

    it("should return generic Wallet when multiple wallets exist on mobile", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {
        cardano: {
          wallet1: {
            enable: vi.fn(),
            isEnabled: vi.fn(),
          },
          wallet2: {
            enable: vi.fn(),
            isEnabled: vi.fn(),
          },
        },
      });

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("Wallet");
    });

    it("should return null when navigator is undefined", async () => {
      vi.stubGlobal("navigator", undefined);

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBeNull();
    });

    it("should return null when window is undefined", async () => {
      vi.stubGlobal("navigator", {
        userAgent: "Mozilla/5.0",
        maxTouchPoints: 0,
      });
      vi.stubGlobal("window", undefined);

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBeNull();
    });

    it("should return null on desktop even with window.cardano present", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
      });
      vi.stubGlobal("window", {
        cardano: {
          eternl: {
            enable: vi.fn(),
            isEnabled: vi.fn(),
          },
        },
      });

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBeNull();
    });

    it("should ignore cardano entries without enable function for generic detection", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {
        cardano: {
          notAWallet: {
            someMethod: vi.fn(),
          },
          realWallet: {
            enable: vi.fn(),
            isEnabled: vi.fn(),
          },
        },
      });

      const { detectWalletDappBrowser } = await resetEnvironmentCache();
      expect(detectWalletDappBrowser()).toBe("RealWallet");
    });
  });

  describe("detectEnvironment", () => {
    it("should return full environment object for standard desktop browser", async () => {
      const mockNavigator = {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
        clipboard: {},
      };
      vi.stubGlobal("navigator", mockNavigator);
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: mockNavigator,
      });

      const { detectEnvironment } = await resetEnvironmentCache();
      const env = detectEnvironment();

      expect(env.platform).toBe("desktop");
      expect(env.browserType).toBe("standard");
      expect(env.walletName).toBeNull();
      expect(env.supportsDownloads).toBe(true);
      expect(env.supportsClipboard).toBe(true);
    });

    it("should return wallet-dapp browser type when in wallet browser", async () => {
      const mockNavigator = {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Vespr/2.0",
        maxTouchPoints: 5,
        clipboard: {},
      };
      vi.stubGlobal("navigator", mockNavigator);
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: mockNavigator,
      });

      const { detectEnvironment } = await resetEnvironmentCache();
      const env = detectEnvironment();

      expect(env.platform).toBe("mobile-ios");
      expect(env.browserType).toBe("wallet-dapp");
      expect(env.walletName).toBe("Vespr");
      expect(env.supportsDownloads).toBe(false);
      expect(env.supportsClipboard).toBe(true);
    });

    it("should return pwa browser type when in standalone mode", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
        maxTouchPoints: 5,
        clipboard: {},
        standalone: false,
      });
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: true }),
        navigator: { standalone: false },
      });

      const { detectEnvironment } = await resetEnvironmentCache();
      const env = detectEnvironment();

      expect(env.browserType).toBe("pwa");
    });

    it("should return pwa browser type for iOS Safari standalone mode", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
        maxTouchPoints: 5,
        clipboard: {},
        standalone: true,
      });
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: { standalone: true },
      });

      const { detectEnvironment } = await resetEnvironmentCache();
      const env = detectEnvironment();

      expect(env.browserType).toBe("pwa");
    });

    it("should cache environment after first call", async () => {
      const mockNavigator = {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        maxTouchPoints: 0,
        clipboard: {},
      };
      vi.stubGlobal("navigator", mockNavigator);
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: mockNavigator,
      });

      const { detectEnvironment } = await resetEnvironmentCache();
      const env1 = detectEnvironment();
      const env2 = detectEnvironment();

      expect(env1).toBe(env2);
    });

    it("should detect supportsClipboard as false when clipboard is undefined", async () => {
      const mockNavigator = {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        maxTouchPoints: 0,
        clipboard: undefined,
      };
      vi.stubGlobal("navigator", mockNavigator);
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: mockNavigator,
      });

      const { detectEnvironment } = await resetEnvironmentCache();
      const env = detectEnvironment();

      expect(env.supportsClipboard).toBe(false);
    });
  });

  describe("isMobile", () => {
    it("should return true for iOS platform", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1",
        maxTouchPoints: 5,
      });

      const { isMobile } = await resetEnvironmentCache();
      expect(isMobile()).toBe(true);
    });

    it("should return true for Android platform", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120.0.0.0 Mobile Safari/537.36",
        maxTouchPoints: 5,
      });

      const { isMobile } = await resetEnvironmentCache();
      expect(isMobile()).toBe(true);
    });

    it("should return true for other mobile platforms", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Mobile; rv:120.0) Gecko/120.0 Firefox/120.0",
        maxTouchPoints: 5,
      });

      const { isMobile } = await resetEnvironmentCache();
      expect(isMobile()).toBe(true);
    });

    it("should return false for desktop platform", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
      });

      const { isMobile } = await resetEnvironmentCache();
      expect(isMobile()).toBe(false);
    });
  });

  describe("isWalletDappBrowser", () => {
    it("should return true when wallet browser is detected", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Eternl/1.0",
        maxTouchPoints: 5,
      });
      vi.stubGlobal("window", {});

      const { isWalletDappBrowser } = await resetEnvironmentCache();
      expect(isWalletDappBrowser()).toBe(true);
    });

    it("should return false for standard browser", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
      });
      vi.stubGlobal("window", {});

      const { isWalletDappBrowser } = await resetEnvironmentCache();
      expect(isWalletDappBrowser()).toBe(false);
    });
  });

  describe("canDownloadFiles", () => {
    it("should return true for standard desktop browser", async () => {
      const mockNavigator = {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
        clipboard: {},
      };
      vi.stubGlobal("navigator", mockNavigator);
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: mockNavigator,
      });

      const { canDownloadFiles } = await resetEnvironmentCache();
      expect(canDownloadFiles()).toBe(true);
    });

    it("should return true for standard mobile browser", async () => {
      const mockNavigator = {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
        maxTouchPoints: 5,
        clipboard: {},
      };
      vi.stubGlobal("navigator", mockNavigator);
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: mockNavigator,
      });

      const { canDownloadFiles } = await resetEnvironmentCache();
      expect(canDownloadFiles()).toBe(true);
    });

    it("should return false for wallet dApp browser", async () => {
      const mockNavigator = {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Lace/1.0",
        maxTouchPoints: 5,
        clipboard: {},
      };
      vi.stubGlobal("navigator", mockNavigator);
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: mockNavigator,
      });

      const { canDownloadFiles } = await resetEnvironmentCache();
      expect(canDownloadFiles()).toBe(false);
    });
  });

  describe("supportsClipboard", () => {
    it("should return true when clipboard API is available", async () => {
      const mockNavigator = {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
        clipboard: {
          writeText: vi.fn(),
          readText: vi.fn(),
        },
      };
      vi.stubGlobal("navigator", mockNavigator);
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: mockNavigator,
      });

      const { supportsClipboard } = await resetEnvironmentCache();
      expect(supportsClipboard()).toBe(true);
    });

    it("should return false when clipboard API is not available", async () => {
      const mockNavigator = {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
        clipboard: undefined,
      };
      vi.stubGlobal("navigator", mockNavigator);
      vi.stubGlobal("window", {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: mockNavigator,
      });

      const { supportsClipboard } = await resetEnvironmentCache();
      expect(supportsClipboard()).toBe(false);
    });
  });

  describe("supportsBrowserExtensions", () => {
    it("should return true for desktop platform", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        maxTouchPoints: 0,
      });

      const { supportsBrowserExtensions } = await resetEnvironmentCache();
      expect(supportsBrowserExtensions()).toBe(true);
    });

    it("should return false for iOS platform", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1",
        maxTouchPoints: 5,
      });

      const { supportsBrowserExtensions } = await resetEnvironmentCache();
      expect(supportsBrowserExtensions()).toBe(false);
    });

    it("should return false for Android platform", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120.0.0.0 Mobile Safari/537.36",
        maxTouchPoints: 5,
      });

      const { supportsBrowserExtensions } = await resetEnvironmentCache();
      expect(supportsBrowserExtensions()).toBe(false);
    });

    it("should return false for other mobile platforms", async () => {
      vi.stubGlobal("navigator", {
        userAgent:
          "Mozilla/5.0 (Mobile; rv:120.0) Gecko/120.0 Firefox/120.0",
        maxTouchPoints: 5,
      });

      const { supportsBrowserExtensions } = await resetEnvironmentCache();
      expect(supportsBrowserExtensions()).toBe(false);
    });
  });
});
