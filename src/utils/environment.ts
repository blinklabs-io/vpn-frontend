/**
 * Environment detection utilities for platform and browser detection.
 * Used to determine appropriate UI flows for different environments,
 * particularly wallet dApp browsers where file downloads don't work.
 */

export type Platform = 'desktop' | 'mobile-ios' | 'mobile-android' | 'mobile-other';
export type BrowserType = 'standard' | 'wallet-dapp' | 'pwa';

export interface Environment {
  platform: Platform;
  browserType: BrowserType;
  walletName: string | null;
  supportsDownloads: boolean;
  supportsClipboard: boolean;
}

// Cached environment detection result (doesn't change during session)
let cachedEnvironment: Environment | null = null;

/**
 * Detect the current platform based on user agent
 */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';

  const ua = navigator.userAgent;

  if (/iPhone|iPad|iPod/.test(ua)) return 'mobile-ios';
  // iPadOS 13+ reports desktop Safari UA but has touch capability
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'mobile-ios';
  if (/Android/.test(ua)) return 'mobile-android';
  if (/Mobile|webOS|Opera Mini|IEMobile/.test(ua)) return 'mobile-other';

  return 'desktop';
}

/**
 * Check if the current browser is a wallet's built-in dApp browser.
 * Returns the wallet name if detected, null otherwise.
 */
export function detectWalletDappBrowser(): string | null {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  const ua = navigator.userAgent.toLowerCase();

  // Lace mobile browser
  if (ua.includes('lace')) return 'Lace';

  // Eternl mobile browser
  if (ua.includes('eternl') || ua.includes('ccvault')) return 'Eternl';

  // Vespr
  if (ua.includes('vespr')) return 'Vespr';

  // Typhon
  if (ua.includes('typhon')) return 'Typhon';

  // Gero
  if (ua.includes('gero')) return 'Gero';

  // Yoroi
  if (ua.includes('yoroi')) return 'Yoroi';

  // Begin
  if (ua.includes('begin')) return 'Begin';

  // NuFi
  if (ua.includes('nufi')) return 'NuFi';

  // Generic detection: if window.cardano exists on mobile, likely a dApp browser
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isMobile() && (window as any).cardano) {
    // Check if exactly one wallet is available (common in dApp browsers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cardano = (window as any).cardano;
    const walletKeys = Object.keys(cardano).filter(
      key => typeof cardano[key]?.enable === 'function'
    );

    if (walletKeys.length === 1) {
      // Capitalize first letter
      const walletName = walletKeys[0];
      return walletName.charAt(0).toUpperCase() + walletName.slice(1);
    }

    return 'Wallet';
  }

  return null;
}

/**
 * Detect if running as an installed PWA
 */
export function isPwa(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari specific
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

/**
 * Detect full environment details (cached after first call)
 */
export function detectEnvironment(): Environment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const platform = detectPlatform();
  const walletName = detectWalletDappBrowser();
  const isWalletBrowser = walletName !== null;
  const isPwaMode = isPwa();

  // Determine browser type
  let browserType: BrowserType = 'standard';
  if (isWalletBrowser) {
    browserType = 'wallet-dapp';
  } else if (isPwaMode) {
    browserType = 'pwa';
  }

  cachedEnvironment = {
    platform,
    browserType,
    walletName,
    // Wallet dApp browsers typically don't support file downloads
    // Standard mobile browsers (Safari, Chrome) do support downloads
    supportsDownloads: !isWalletBrowser,
    // Clipboard may work but can be unreliable in wallet browsers
    supportsClipboard: typeof navigator !== 'undefined' && navigator.clipboard !== undefined,
  };

  return cachedEnvironment;
}

/**
 * Check if current platform is mobile
 */
export function isMobile(): boolean {
  return detectPlatform() !== 'desktop';
}

/**
 * Check if in a wallet's dApp browser
 */
export function isWalletDappBrowser(): boolean {
  return detectWalletDappBrowser() !== null;
}

/**
 * Check if file downloads are likely to work
 */
export function canDownloadFiles(): boolean {
  return detectEnvironment().supportsDownloads;
}

/**
 * Check if browser supports clipboard API
 */
export function supportsClipboard(): boolean {
  return detectEnvironment().supportsClipboard;
}

/**
 * Check if browser extensions (like wallet extensions) are supported
 */
export function supportsBrowserExtensions(): boolean {
  const platform = detectPlatform();
  // Browser extensions only work on desktop browsers
  return platform === 'desktop';
}
