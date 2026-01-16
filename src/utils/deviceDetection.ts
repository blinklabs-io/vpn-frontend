/**
 * Device detection utilities for determining device type and providing
 * appropriate naming suggestions for WireGuard peer configurations.
 */

export type DeviceType =
  | "iphone"
  | "ipad"
  | "mac"
  | "windows"
  | "android"
  | "linux"
  | "unknown";

/**
 * Detect the current device type based on user agent and platform
 */
export function detectDeviceTypeRaw(): DeviceType {
  if (typeof navigator === "undefined") return "unknown";

  const ua = navigator.userAgent;
  const platform = navigator.platform || "";

  // iOS detection
  if (/iPhone/.test(ua)) return "iphone";
  if (/iPad/.test(ua)) return "ipad";
  // iPadOS 13+ reports desktop Safari UA but has touch capability
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ipad";

  // macOS detection
  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(platform)) return "mac";
  if (/Mac OS X/.test(ua)) return "mac";

  // Windows detection
  if (/Win32|Win64|Windows|WinCE/.test(platform)) return "windows";
  if (/Windows/.test(ua)) return "windows";

  // Android detection
  if (/Android/.test(ua)) return "android";

  // Linux detection (must come after Android since Android is Linux-based)
  if (/Linux/.test(platform)) return "linux";
  if (/Linux/.test(ua) && !/Android/.test(ua)) return "linux";

  return "unknown";
}

/**
 * Get a human-readable device name suggestion based on detected device type
 */
export function detectDeviceType(): string {
  const deviceType = detectDeviceTypeRaw();

  switch (deviceType) {
    case "iphone":
      return "iPhone";
    case "ipad":
      return "iPad";
    case "mac":
      return "MacBook";
    case "windows":
      return "Windows PC";
    case "android":
      return "Android Phone";
    case "linux":
      return "Linux Desktop";
    default:
      return "Device";
  }
}

/**
 * Get an emoji icon representing the detected device type
 */
export function getDeviceIcon(): string {
  const deviceType = detectDeviceTypeRaw();

  switch (deviceType) {
    case "iphone":
    case "android":
      return "\u{1F4F1}"; // mobile phone emoji
    case "ipad":
      return "\u{1F4F2}"; // tablet emoji (mobile phone with arrow)
    case "mac":
    case "windows":
    case "linux":
      return "\u{1F4BB}"; // laptop emoji
    default:
      return "\u{1F5A5}"; // desktop computer emoji
  }
}

/**
 * Infer device type from a device name string (case-insensitive matching)
 */
export function inferDeviceTypeFromName(name: string): DeviceType {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("iphone")) return "iphone";
  if (lowerName.includes("ipad")) return "ipad";
  if (lowerName.includes("mac") || lowerName.includes("macbook")) return "mac";
  if (lowerName.includes("windows") || lowerName.includes("pc")) return "windows";
  if (lowerName.includes("android")) return "android";
  if (lowerName.includes("linux") || lowerName.includes("ubuntu") || lowerName.includes("debian")) return "linux";

  return "unknown";
}

/**
 * Get an emoji icon based on a device name string
 */
export function getDeviceIconFromName(name: string): string {
  const deviceType = inferDeviceTypeFromName(name);

  switch (deviceType) {
    case "iphone":
    case "android":
      return "\u{1F4F1}"; // mobile phone emoji
    case "ipad":
      return "\u{1F4F2}"; // tablet emoji (mobile phone with arrow)
    case "mac":
    case "windows":
    case "linux":
      return "\u{1F4BB}"; // laptop emoji
    default:
      return "\u{1F5A5}"; // desktop computer emoji
  }
}
