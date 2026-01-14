import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../test/utils';
import { ProfileDeliveryModal } from '../ProfileDeliveryModal';

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, size, level, includeMargin }: { value: string; size: number; level: string; includeMargin: boolean }) => (
    <div
      data-testid="qr-code-svg"
      data-value={value}
      data-size={size}
      data-level={level}
      data-include-margin={String(includeMargin)}
    >
      QR Code Mock
    </div>
  ),
}));

// Mock detectEnvironment from ../utils/environment
vi.mock('../../utils/environment', () => ({
  detectEnvironment: vi.fn(() => ({
    platform: 'desktop',
    browserType: 'standard',
    walletName: null,
    supportsDownloads: true,
    supportsClipboard: true,
  })),
}));

import { detectEnvironment } from '../../utils/environment';

const mockDetectEnvironment = vi.mocked(detectEnvironment);

describe('ProfileDeliveryModal', () => {
  const defaultProps = {
    downloadUrl: 'https://example.com/vpn-config/abc123.conf',
    clientId: 'client-123',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onClose = vi.fn();
    mockDetectEnvironment.mockReturnValue({
      platform: 'desktop',
      browserType: 'standard',
      walletName: null,
      supportsDownloads: true,
      supportsClipboard: true,
    });
  });

  describe('Modal rendering with correct accessibility attributes', () => {
    it('should render with role="dialog"', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to the heading', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'profile-delivery-heading');

      const heading = screen.getByRole('heading', { name: /get your vpn configuration/i });
      expect(heading).toHaveAttribute('id', 'profile-delivery-heading');
    });

    it('should render the heading text', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /get your vpn configuration/i })).toBeInTheDocument();
    });
  });

  describe('Tab navigation', () => {
    it('should render all three tabs with correct roles', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      expect(tablist).toHaveAttribute('aria-label', 'Delivery method');

      const tabs = within(tablist).getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveTextContent('QR Code');
      expect(tabs[1]).toHaveTextContent('Copy URL');
      expect(tabs[2]).toHaveTextContent('Copy Config');
    });

    it('should have QR Code tab selected by default', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const qrTab = screen.getByRole('tab', { name: /qr code/i });
      expect(qrTab).toHaveAttribute('aria-selected', 'true');

      const copyUrlTab = screen.getByRole('tab', { name: /copy url/i });
      expect(copyUrlTab).toHaveAttribute('aria-selected', 'false');

      const copyConfigTab = screen.getByRole('tab', { name: /copy config/i });
      expect(copyConfigTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should switch to Copy URL tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const copyUrlTab = screen.getByRole('tab', { name: /copy url/i });
      await user.click(copyUrlTab);

      expect(copyUrlTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /qr code/i })).toHaveAttribute('aria-selected', 'false');
    });

    it('should switch to Copy Config tab when clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('[Interface]\nPrivateKey=abc123'),
      } as Response);

      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const copyConfigTab = screen.getByRole('tab', { name: /copy config/i });
      await user.click(copyConfigTab);

      expect(copyConfigTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have correct aria-controls attributes on tabs', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /qr code/i })).toHaveAttribute('aria-controls', 'tabpanel-qr');
      expect(screen.getByRole('tab', { name: /copy url/i })).toHaveAttribute('aria-controls', 'tabpanel-copy-url');
      expect(screen.getByRole('tab', { name: /copy config/i })).toHaveAttribute('aria-controls', 'tabpanel-copy-config');
    });
  });

  describe('QR Code tab', () => {
    it('should render QRCodeSVG with correct props', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const qrCode = screen.getByTestId('qr-code-svg');
      expect(qrCode).toBeInTheDocument();
      expect(qrCode).toHaveAttribute('data-value', defaultProps.downloadUrl);
      expect(qrCode).toHaveAttribute('data-size', '180');
      expect(qrCode).toHaveAttribute('data-level', 'M');
      expect(qrCode).toHaveAttribute('data-include-margin', 'false');
    });

    it('should show instruction text for QR code', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      expect(screen.getByText(/scan this qr code with your phone's camera/i)).toBeInTheDocument();
      expect(screen.getByText(/opens in your regular browser where downloads work/i)).toBeInTheDocument();
    });

    it('should render tabpanel with correct attributes', () => {
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-qr');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-qr');
    });
  });

  describe('Copy URL tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);
      await user.click(screen.getByRole('tab', { name: /copy url/i }));
    });

    it('should display the download URL', () => {
      expect(screen.getByText(defaultProps.downloadUrl)).toBeInTheDocument();
    });

    it('should render tabpanel with correct attributes', () => {
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-copy-url');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-copy-url');
    });

    it('should show instruction text', () => {
      expect(screen.getByText(/copy the download link and open it in a regular browser/i)).toBeInTheDocument();
    });
  });

  describe('Copy URL button functionality', () => {
    it('should copy URL to clipboard when copy button is clicked and show success state', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /copy url/i }));

      const copyButton = screen.getByRole('button', { name: /copy download link/i });
      await user.click(copyButton);

      // Verify the success state shows, indicating clipboard.writeText was called and resolved
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
    });

    it('should show error state when copy fails', async () => {
      // Mock clipboard.writeText to fail - must be done before component renders
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Copy failed'));
      vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(mockWriteText);

      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /copy url/i }));

      const copyButton = screen.getByRole('button', { name: /copy download link/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy failed - try selecting text manually/i })).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });
  });

  describe('Copy Config tab', () => {
    const mockConfigContent = '[Interface]\nPrivateKey=abc123\nAddress=10.0.0.1/24';

    it('should fetch config when Copy Config tab is selected', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockConfigContent),
      } as Response);

      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /copy config/i }));

      expect(fetch).toHaveBeenCalledWith(defaultProps.downloadUrl, expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
    });

    it('should show loading state while fetching config', async () => {
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(fetch).mockReturnValue(fetchPromise as Promise<Response>);

      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /copy config/i }));

      expect(screen.getByText(/loading config/i)).toBeInTheDocument();

      // Cleanup
      resolvePromise!({ ok: true, text: () => Promise.resolve(mockConfigContent) });
    });

    it('should display config content after fetching', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockConfigContent),
      } as Response);

      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /copy config/i }));

      await waitFor(() => {
        const textarea = screen.getByRole('textbox', { name: /vpn configuration content/i });
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveValue(mockConfigContent);
      });
    });

    it('should show error message when fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /copy config/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/could not load config content/i)).toBeInTheDocument();
      });
    });

    it('should copy config content when copy button is clicked and show success state', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockConfigContent),
      } as Response);

      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /copy config/i }));

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /vpn configuration content/i })).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy configuration/i });
      await user.click(copyButton);

      // Verify the success state shows, indicating clipboard.writeText was called and resolved
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
      });
    });

    it('should show error state when copying config fails', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockConfigContent),
      } as Response);

      // Mock clipboard.writeText to fail - must be done before component renders
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Copy failed'));
      vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(mockWriteText);

      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /copy config/i }));

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /vpn configuration content/i })).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy configuration/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy failed - try selecting text manually/i })).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });

    it('should render tabpanel with correct attributes', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockConfigContent),
      } as Response);

      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.click(screen.getByRole('tab', { name: /copy config/i }));

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-copy-config');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-copy-config');
    });
  });

  describe('Try Download button', () => {
    it('should create an anchor with download attribute when clicked', async () => {
      const user = userEvent.setup();

      // Track anchor elements that get created and clicked
      const clickedAnchors: HTMLAnchorElement[] = [];
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName.toLowerCase() === 'a') {
          const originalClick = element.click.bind(element);
          element.click = () => {
            clickedAnchors.push(element as HTMLAnchorElement);
            originalClick();
          };
        }
        return element;
      });

      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const tryDownloadButton = screen.getByRole('button', { name: /try download/i });
      await user.click(tryDownloadButton);

      expect(clickedAnchors.length).toBeGreaterThan(0);

      const anchorElement = clickedAnchors[clickedAnchors.length - 1];
      expect(anchorElement.tagName).toBe('A');
      expect(anchorElement.href).toBe(defaultProps.downloadUrl);
      expect(anchorElement.download).toBe(`vpn-config-${defaultProps.clientId}.conf`);

      createElementSpy.mockRestore();
    });
  });

  describe('Close button', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Escape key closes modal', () => {
    it('should call onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Wallet dApp browser detection', () => {
    it('should show warning banner when in wallet dApp browser', () => {
      mockDetectEnvironment.mockReturnValue({
        platform: 'mobile-ios',
        browserType: 'wallet-dapp',
        walletName: 'Eternl',
        supportsDownloads: false,
        supportsClipboard: true,
      });

      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      expect(screen.getByText(/you're using eternl's built-in browser/i)).toBeInTheDocument();
      expect(screen.getByText(/direct downloads may not work here/i)).toBeInTheDocument();
    });

    it('should show generic message when wallet name is null', () => {
      mockDetectEnvironment.mockReturnValue({
        platform: 'mobile-android',
        browserType: 'wallet-dapp',
        walletName: null,
        supportsDownloads: false,
        supportsClipboard: true,
      });

      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      expect(screen.getByText(/you're using a wallet's built-in browser/i)).toBeInTheDocument();
    });

    it('should not show warning banner in standard browser', () => {
      mockDetectEnvironment.mockReturnValue({
        platform: 'desktop',
        browserType: 'standard',
        walletName: null,
        supportsDownloads: true,
        supportsClipboard: true,
      });

      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      expect(screen.queryByText(/you're using/i)).not.toBeInTheDocument();
    });
  });

  describe('Config fetch behavior', () => {
    const mockConfigContent = '[Interface]\nPrivateKey=abc123';

    it('should not refetch config when switching back to Copy Config tab', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockConfigContent),
      } as Response);

      const user = userEvent.setup();
      renderWithProviders(<ProfileDeliveryModal {...defaultProps} />);

      // Switch to Copy Config
      await user.click(screen.getByRole('tab', { name: /copy config/i }));

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /vpn configuration content/i })).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledTimes(1);

      // Switch to QR Code
      await user.click(screen.getByRole('tab', { name: /qr code/i }));

      // Switch back to Copy Config
      await user.click(screen.getByRole('tab', { name: /copy config/i }));

      // Should still only have been called once
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});
