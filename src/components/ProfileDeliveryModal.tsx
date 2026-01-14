import { useState, useCallback, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { detectEnvironment } from '../utils/environment';

interface ProfileDeliveryModalProps {
  downloadUrl: string;
  clientId: string;
  onClose: () => void;
}

type DeliveryMethod = 'qr' | 'copy-url' | 'copy-config';
type CopiedItem = 'url' | 'config' | null;

/**
 * Modal for delivering VPN config profiles in environments where
 * direct file downloads don't work (e.g., wallet dApp browsers).
 *
 * Provides three alternatives:
 * 1. QR Code - Scan to open download URL in regular browser
 * 2. Copy URL - Copy the download link to clipboard
 * 3. Copy Config - Fetch and copy raw config text
 */
export function ProfileDeliveryModal({
  downloadUrl,
  clientId,
  onClose,
}: ProfileDeliveryModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod>('qr');
  const [copiedItem, setCopiedItem] = useState<CopiedItem>(null);
  const [copyError, setCopyError] = useState(false);
  const [configContent, setConfigContent] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const env = detectEnvironment();
  const hasFetchedConfig = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const copiedItemTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingId = 'profile-delivery-heading';

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap and initial focus
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    // Focus the modal on mount
    modal.focus();

    // Simple focus trap
    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleFocusTrap);
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, []);

  // Cleanup abort controller and timeouts on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (copiedItemTimeoutRef.current) {
        clearTimeout(copiedItemTimeoutRef.current);
      }
      if (copyErrorTimeoutRef.current) {
        clearTimeout(copyErrorTimeoutRef.current);
      }
    };
  }, []);

  // Fetch config content when user selects copy-config method
  const fetchConfigContent = useCallback(async () => {
    if (hasFetchedConfig.current || configContent || isLoadingConfig) return;

    hasFetchedConfig.current = true;
    setIsLoadingConfig(true);
    setConfigError(null);

    // Create new abort controller for this request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(downloadUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error('Failed to fetch config');
      }
      const text = await response.text();
      setConfigContent(text);
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch config:', error);
      setConfigError('Could not load config content. Try copying the URL instead.');
      hasFetchedConfig.current = false; // Allow retry
    } finally {
      setIsLoadingConfig(false);
    }
  }, [downloadUrl, configContent, isLoadingConfig]);

  const handleSelectCopyConfig = () => {
    setSelectedMethod('copy-config');
    fetchConfigContent();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopiedItem('url');
      setCopyError(false);
      if (copiedItemTimeoutRef.current) {
        clearTimeout(copiedItemTimeoutRef.current);
      }
      copiedItemTimeoutRef.current = setTimeout(() => setCopiedItem(null), 3000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      setCopyError(true);
      if (copyErrorTimeoutRef.current) {
        clearTimeout(copyErrorTimeoutRef.current);
      }
      copyErrorTimeoutRef.current = setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handleCopyConfig = async () => {
    if (!configContent) return;

    try {
      await navigator.clipboard.writeText(configContent);
      setCopiedItem('config');
      setCopyError(false);
      if (copiedItemTimeoutRef.current) {
        clearTimeout(copiedItemTimeoutRef.current);
      }
      copiedItemTimeoutRef.current = setTimeout(() => setCopiedItem(null), 3000);
    } catch (error) {
      console.error('Failed to copy config:', error);
      setCopyError(true);
      if (copyErrorTimeoutRef.current) {
        clearTimeout(copyErrorTimeoutRef.current);
      }
      copyErrorTimeoutRef.current = setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handleTryDownload = () => {
    // Attempt direct download anyway - might work in some cases
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `vpn-config-${clientId}.conf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-[#1a1a2e] border border-white/20 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto outline-none"
      >
        <div className="p-6 space-y-5">
          <div className="text-center">
            <h2 id={headingId} className="text-xl font-bold text-white mb-2">
              Get Your VPN Configuration
            </h2>

            {env.browserType === 'wallet-dapp' && (
              <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-purple-200">
                  You're using {env.walletName || 'a wallet'}'s built-in browser.
                  Direct downloads may not work here - use one of the options below.
                </p>
              </div>
            )}
          </div>

          {/* Delivery method tabs */}
          <div role="tablist" aria-label="Delivery method" className="flex rounded-lg bg-white/10 p-1 gap-1">
            <button
              role="tab"
              aria-selected={selectedMethod === 'qr'}
              aria-controls="tabpanel-qr"
              id="tab-qr"
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedMethod === 'qr'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setSelectedMethod('qr')}
            >
              QR Code
            </button>
            <button
              role="tab"
              aria-selected={selectedMethod === 'copy-url'}
              aria-controls="tabpanel-copy-url"
              id="tab-copy-url"
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedMethod === 'copy-url'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setSelectedMethod('copy-url')}
            >
              Copy URL
            </button>
            <button
              role="tab"
              aria-selected={selectedMethod === 'copy-config'}
              aria-controls="tabpanel-copy-config"
              id="tab-copy-config"
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedMethod === 'copy-config'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={handleSelectCopyConfig}
            >
              Copy Config
            </button>
          </div>

          {/* QR Code section */}
          {selectedMethod === 'qr' && (
            <div
              role="tabpanel"
              id="tabpanel-qr"
              aria-labelledby="tab-qr"
              className="text-center space-y-4"
            >
              <p className="text-sm text-white/80">
                Scan this QR code with your phone's camera to download the config:
              </p>
              <div className="inline-block p-4 bg-white rounded-xl">
                <QRCodeSVG
                  value={downloadUrl}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-white/60">
                Opens in your regular browser where downloads work.
              </p>
            </div>
          )}

          {/* Copy URL section */}
          {selectedMethod === 'copy-url' && (
            <div
              role="tabpanel"
              id="tabpanel-copy-url"
              aria-labelledby="tab-copy-url"
              className="space-y-4"
            >
              <p className="text-sm text-white/80 text-center">
                Copy the download link and open it in a regular browser:
              </p>
              <div className="bg-black/30 rounded-lg p-3 break-all">
                <p className="text-xs text-white/60 font-mono">{downloadUrl}</p>
              </div>
              <button
                onClick={handleCopyUrl}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  copyError && selectedMethod === 'copy-url'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {copyError && selectedMethod === 'copy-url'
                  ? 'Copy failed - try selecting text manually'
                  : copiedItem === 'url'
                    ? 'Copied!'
                    : 'Copy Download Link'}
              </button>
            </div>
          )}

          {/* Copy Config section */}
          {selectedMethod === 'copy-config' && (
            <div
              role="tabpanel"
              id="tabpanel-copy-config"
              aria-labelledby="tab-copy-config"
              className="space-y-4"
            >
              <p className="text-sm text-white/80 text-center">
                Copy the configuration text and paste it into your VPN app's "Import" feature:
              </p>

              {isLoadingConfig && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="ml-3 text-white/60">Loading config...</span>
                </div>
              )}

              {configError && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3" role="alert">
                  <p className="text-sm text-red-200">{configError}</p>
                </div>
              )}

              {configContent && !isLoadingConfig && (
                <>
                  <textarea
                    readOnly
                    value={configContent}
                    rows={8}
                    aria-label="VPN configuration content"
                    className="w-full bg-black/30 rounded-lg p-3 text-xs text-white/80 font-mono resize-none border border-white/10 focus:outline-none focus:border-purple-400/50"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                  <button
                    onClick={handleCopyConfig}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      copyError && selectedMethod === 'copy-config'
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    {copyError && selectedMethod === 'copy-config'
                      ? 'Copy failed - try selecting text manually'
                      : copiedItem === 'config'
                        ? 'Copied!'
                        : 'Copy Configuration'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTryDownload}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all bg-purple-600 text-white hover:bg-purple-500"
            >
              Try Download
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all bg-white/10 text-white hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileDeliveryModal;
