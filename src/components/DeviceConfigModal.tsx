import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { detectDeviceType } from '../utils/deviceDetection';
import { generateWireGuardKeypair } from '../utils/wireguardKeys';
import { setDeviceName } from '../utils/deviceNames';
import { useWireGuardProfile } from '../api/hooks/useWireGuard';
import { useWalletStore } from '../stores/walletStore';
import type { WireGuardDevice } from '../api/types';

interface SignDataResponse {
  key: string;
  signature: string;
}

interface DeviceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  regionName: string;
  regionId: string;
  existingDevice?: WireGuardDevice;
  onDeviceCreated?: (device: WireGuardDevice) => void;
}

type ModalStep = 'naming' | 'config';
type ConfigTab = 'qr' | 'download' | 'copy';

const MAX_DEVICE_NAME_LENGTH = 32;
const PRIVATE_KEY_PLACEHOLDER = '<REPLACE_WITH_YOUR_PRIVATE_KEY>';

/**
 * Modal for adding new WireGuard devices or re-downloading existing configs.
 *
 * Two flows:
 * 1. New device: Device naming -> Generate keypair -> Get config -> Display
 * 2. Existing device: Generate new keypair -> Get config -> Display
 */
export function DeviceConfigModal({
  isOpen,
  onClose,
  clientId,
  regionName,
  regionId,
  existingDevice,
  onDeviceCreated,
}: DeviceConfigModalProps) {
  // UI state
  const [step, setStep] = useState<ModalStep>(existingDevice ? 'config' : 'naming');
  const [selectedTab, setSelectedTab] = useState<ConfigTab>('qr');

  // Device naming state
  const [deviceName, setDeviceNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Config generation state
  const [config, setConfig] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Copy state
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hooks
  const { signMessage } = useWalletStore();
  const wireGuardProfile = useWireGuardProfile();

  const headingId = 'device-config-heading';

  // Initialize default device name on mount
  useEffect(() => {
    if (isOpen && !existingDevice) {
      const defaultName = detectDeviceType();
      setDeviceNameInput(defaultName);
    }
  }, [isOpen, existingDevice]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    if (step === 'naming' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    } else if (modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen, step]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

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
  }, [isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (copyErrorTimeoutRef.current) clearTimeout(copyErrorTimeoutRef.current);
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(existingDevice ? 'config' : 'naming');
      setSelectedTab('qr');
      setDeviceNameInput('');
      setNameError(null);
      setConfig(null);
      setIsGenerating(false);
      setGenerationError(null);
      setCopied(false);
      setCopyError(false);
    }
  }, [isOpen, existingDevice]);

  // Auto-generate config for existing device
  useEffect(() => {
    if (isOpen && existingDevice && !config && !isGenerating && !generationError) {
      handleGenerateConfig(existingDevice.name);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, existingDevice]);

  const validateDeviceName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Device name is required';
    }
    if (trimmed.length > MAX_DEVICE_NAME_LENGTH) {
      return `Device name must be ${MAX_DEVICE_NAME_LENGTH} characters or less`;
    }
    return null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDeviceNameInput(value);

    // Clear error when user starts typing
    if (nameError) {
      setNameError(null);
    }
  };

  const handleGenerateConfig = useCallback(async (name?: string) => {
    const finalName = name || deviceName.trim();

    // Validate name for new devices
    if (!existingDevice) {
      const error = validateDeviceName(finalName);
      if (error) {
        setNameError(error);
        return;
      }
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Step 1: Generate keypair
      const newKeypair = await generateWireGuardKeypair();

      // Step 2: Create auth payload and get config
      const timestamp = Math.floor(Date.now() / 1000);
      const challenge = `${clientId}${timestamp}`;

      const signResult = (await signMessage(challenge)) as SignDataResponse;

      const configText = await wireGuardProfile.mutateAsync({
        client_id: clientId,
        timestamp,
        signature: signResult.signature,
        key: signResult.key,
        wg_pubkey: newKeypair.publicKey,
      });

      // Step 3: Replace private key placeholder
      const finalConfig = configText.replace(
        PRIVATE_KEY_PLACEHOLDER,
        newKeypair.privateKey
      );
      setConfig(finalConfig);

      // Step 4: Store device name locally
      setDeviceName(newKeypair.publicKey, finalName);

      // Step 5: Notify parent of new device
      if (onDeviceCreated && !existingDevice) {
        const newDevice: WireGuardDevice = {
          pubkey: newKeypair.publicKey,
          name: finalName,
          assignedIp: '', // Will be updated when parent refreshes device list
          createdAt: new Date().toISOString(),
        };
        onDeviceCreated(newDevice);
      }

      // Move to config step
      setStep('config');
    } catch (error) {
      console.error('Failed to generate config:', error);
      setGenerationError(
        error instanceof Error
          ? error.message
          : 'Failed to generate configuration. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [deviceName, existingDevice, clientId, signMessage, wireGuardProfile, onDeviceCreated]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateConfig();
  };

  const handleDownload = () => {
    if (!config) return;

    const finalName = existingDevice?.name || deviceName.trim();
    const sanitizedName = finalName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const sanitizedRegion = regionId.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const filename = `nabu-${sanitizedRegion}-${sanitizedName}.conf`;

    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Delay revocation to ensure browser has time to initiate download
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleCopy = async () => {
    if (!config) return;

    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      setCopyError(false);

      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy config:', error);
      setCopyError(true);

      if (copyErrorTimeoutRef.current) clearTimeout(copyErrorTimeoutRef.current);
      copyErrorTimeoutRef.current = setTimeout(() => setCopyError(false), 3000);
    }
  };

  if (!isOpen) return null;

  const modalTitle = step === 'naming'
    ? 'Add New Device'
    : existingDevice
      ? `Config for ${existingDevice.name}`
      : 'Your WireGuard Config';

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 id={headingId} className="text-xl font-bold text-white">
              {modalTitle}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Region info */}
          <div className="text-sm text-white/60">
            Region: <span className="text-white/80">{regionName}</span>
          </div>

          {/* Step 1: Device Naming */}
          {step === 'naming' && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <label htmlFor="device-name" className="block text-sm font-medium text-white/80 mb-2">
                  Device Name
                </label>
                <input
                  ref={inputRef}
                  id="device-name"
                  type="text"
                  value={deviceName}
                  onChange={handleNameChange}
                  maxLength={MAX_DEVICE_NAME_LENGTH}
                  placeholder={detectDeviceType()}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-colors ${
                    nameError
                      ? 'border-red-400/50 focus:ring-red-400/50'
                      : 'border-white/20 focus:ring-purple-400/50 focus:border-purple-400/50'
                  }`}
                  disabled={isGenerating}
                />
                <div className="flex justify-between mt-2">
                  <span className={`text-xs ${nameError ? 'text-red-400' : 'text-white/50'}`}>
                    {nameError || `Max ${MAX_DEVICE_NAME_LENGTH} characters`}
                  </span>
                  <span className="text-xs text-white/50">
                    {deviceName.length}/{MAX_DEVICE_NAME_LENGTH}
                  </span>
                </div>
              </div>

              {generationError && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3" role="alert">
                  <p className="text-sm text-red-200">{generationError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-all bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Config'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Config Display */}
          {step === 'config' && (
            <div className="space-y-4">
              {/* Loading state for existing device */}
              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                  <span className="text-white/60">Generating configuration...</span>
                </div>
              )}

              {/* Error state */}
              {generationError && !isGenerating && (
                <div className="space-y-4">
                  <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4" role="alert">
                    <p className="text-sm text-red-200">{generationError}</p>
                  </div>
                  <button
                    onClick={() => handleGenerateConfig(existingDevice?.name)}
                    className="w-full py-3 px-4 rounded-lg font-semibold transition-all bg-purple-600 text-white hover:bg-purple-500"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Config display */}
              {config && !isGenerating && (
                <>
                  {/* Tab buttons */}
                  <div role="tablist" aria-label="Config delivery method" className="flex rounded-lg bg-white/10 p-1 gap-1">
                    <button
                      role="tab"
                      aria-selected={selectedTab === 'qr'}
                      aria-controls="tabpanel-qr"
                      id="tab-qr"
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        selectedTab === 'qr'
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedTab('qr')}
                    >
                      QR Code
                    </button>
                    <button
                      role="tab"
                      aria-selected={selectedTab === 'download'}
                      aria-controls="tabpanel-download"
                      id="tab-download"
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        selectedTab === 'download'
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedTab('download')}
                    >
                      Download
                    </button>
                    <button
                      role="tab"
                      aria-selected={selectedTab === 'copy'}
                      aria-controls="tabpanel-copy"
                      id="tab-copy"
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        selectedTab === 'copy'
                          ? 'bg-white text-black'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedTab('copy')}
                    >
                      Copy
                    </button>
                  </div>

                  {/* QR Code tab */}
                  {selectedTab === 'qr' && (
                    <div
                      role="tabpanel"
                      id="tabpanel-qr"
                      aria-labelledby="tab-qr"
                      className="text-center space-y-4"
                    >
                      <div className="inline-block p-4 bg-white rounded-xl">
                        <QRCodeSVG
                          value={config}
                          size={200}
                          level="L"
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-sm text-white/60">
                        Scan this QR code with your WireGuard app to import the configuration automatically.
                      </p>
                    </div>
                  )}

                  {/* Download tab */}
                  {selectedTab === 'download' && (
                    <div
                      role="tabpanel"
                      id="tabpanel-download"
                      aria-labelledby="tab-download"
                      className="text-center space-y-4"
                    >
                      <div className="py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </div>
                        <p className="text-sm text-white/60 mb-4">
                          Download the configuration file and import it into your WireGuard app.
                        </p>
                        <button
                          onClick={handleDownload}
                          className="px-6 py-3 rounded-lg font-semibold transition-all bg-purple-600 text-white hover:bg-purple-500"
                        >
                          Download Config File
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Copy tab */}
                  {selectedTab === 'copy' && (
                    <div
                      role="tabpanel"
                      id="tabpanel-copy"
                      aria-labelledby="tab-copy"
                      className="space-y-4"
                    >
                      <p className="text-sm text-white/80 text-center">
                        Copy the configuration and paste it into your WireGuard app's "Import from text" feature.
                      </p>
                      <textarea
                        readOnly
                        value={config}
                        rows={8}
                        aria-label="WireGuard configuration content"
                        className="w-full bg-black/30 rounded-lg p-3 text-xs text-white/80 font-mono resize-none border border-white/10 focus:outline-none focus:border-purple-400/50"
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      />
                      <button
                        onClick={handleCopy}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                          copyError
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-black hover:bg-white/90'
                        }`}
                      >
                        {copyError
                          ? 'Copy failed - try selecting text manually'
                          : copied
                            ? 'Copied!'
                            : 'Copy Configuration'}
                      </button>
                    </div>
                  )}

                  {/* Done button */}
                  <div className="pt-2">
                    <button
                      onClick={onClose}
                      className="w-full py-3 px-4 rounded-lg font-medium transition-all bg-white/10 text-white hover:bg-white/20"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeviceConfigModal;
