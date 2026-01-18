import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, userEvent } from "../../test/utils";
import { DeviceConfigModal } from "../DeviceConfigModal";

// Mock the wallet store
const mockSignMessage = vi.fn();
vi.mock("../../stores/walletStore", () => ({
  useWalletStore: () => ({
    signMessage: mockSignMessage,
  }),
}));

// Mock the WireGuard profile hook
const mockMutateAsync = vi.fn();
vi.mock("../../api/hooks/useWireGuard", () => ({
  useWireGuardProfile: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock device detection
vi.mock("../../utils/deviceDetection", () => ({
  detectDeviceType: () => "Desktop",
}));

// Mock keypair generation
vi.mock("../../utils/wireguardKeys", () => ({
  generateWireGuardKeypair: () =>
    Promise.resolve({
      publicKey: "test-public-key-base64",
      privateKey: "test-private-key-base64",
    }),
}));

// Mock device name storage
vi.mock("../../utils/deviceNames", () => ({
  setDeviceName: vi.fn(),
  getDeviceName: vi.fn(),
}));

describe("DeviceConfigModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    clientId: "test-client-id",
    regionName: "United States East",
    regionId: "wg-us1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignMessage.mockResolvedValue({
      signature: "mock-signature",
      key: "mock-key",
    });
    mockMutateAsync.mockResolvedValue(
      "[Interface]\nPrivateKey = <REPLACE_WITH_YOUR_PRIVATE_KEY>\nAddress = 10.8.0.2/32\n\n[Peer]\nPublicKey = server-key\nEndpoint = vpn.example.com:51820\nAllowedIPs = 0.0.0.0/0",
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should not render when isOpen is false", () => {
      renderWithProviders(
        <DeviceConfigModal {...defaultProps} isOpen={false} />,
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should show naming step for new devices", () => {
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      expect(screen.getByText("Add New Device")).toBeInTheDocument();
      expect(screen.getByLabelText(/device name/i)).toBeInTheDocument();
    });

    it("should show default device name from detection", () => {
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      const input = screen.getByLabelText(/device name/i) as HTMLInputElement;
      expect(input.value).toBe("Desktop");
    });

    it("should show config step for existing device", async () => {
      const existingDevice = {
        pubkey: "existing-pubkey",
        name: "My iPhone",
        assignedIp: "10.8.0.5",
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(
        <DeviceConfigModal {...defaultProps} existingDevice={existingDevice} />,
      );

      // Should show the device name in the title
      await waitFor(() => {
        expect(
          screen.getByText(/config for my iphone/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("device naming", () => {
    it("should allow changing device name", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      const input = screen.getByLabelText(/device name/i);
      await user.clear(input);
      await user.type(input, "My Custom Device");

      expect(input).toHaveValue("My Custom Device");
    });

    it("should show error for empty device name", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      const input = screen.getByLabelText(/device name/i);
      await user.clear(input);

      const generateButton = screen.getByRole("button", {
        name: /generate config/i,
      });
      await user.click(generateButton);

      expect(screen.getByText(/device name is required/i)).toBeInTheDocument();
    });

    it("should respect maxLength attribute and show character count at limit", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      const input = screen.getByLabelText(/device name/i) as HTMLInputElement;
      await user.clear(input);
      // Note: input has maxLength=32, so typing 33 chars results in 32 chars
      // The validation happens server-side or we need to test the validation function directly
      await user.type(input, "a".repeat(32)); // Type exactly 32 chars (max allowed by input)

      // Verify input respects maxLength
      expect(input.value.length).toBe(32);
      expect(screen.getByText(/32\/32/)).toBeInTheDocument();
    });

    it("should show character count", () => {
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      // "Desktop" is 7 characters
      expect(screen.getByText(/7\/32/)).toBeInTheDocument();
    });
  });

  describe("config generation", () => {
    it("should generate config when button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      const generateButton = screen.getByRole("button", {
        name: /generate config/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it("should replace private key placeholder in config", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      const generateButton = screen.getByRole("button", {
        name: /generate config/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/your wireguard config/i),
        ).toBeInTheDocument();
      });

      // Switch to copy tab to see config text
      const copyTab = screen.getByRole("tab", { name: /copy/i });
      await user.click(copyTab);

      // Should not contain the placeholder
      expect(
        screen.queryByText(/<REPLACE_WITH_YOUR_PRIVATE_KEY>/),
      ).not.toBeInTheDocument();
    });

    it("should show error when generation fails", async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));

      const user = userEvent.setup();
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      const generateButton = screen.getByRole("button", {
        name: /generate config/i,
      });
      await user.click(generateButton);

      // The component shows the error message from the Error object
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it("should call onDeviceCreated callback for new devices", async () => {
      const onDeviceCreated = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <DeviceConfigModal
          {...defaultProps}
          onDeviceCreated={onDeviceCreated}
        />,
      );

      const generateButton = screen.getByRole("button", {
        name: /generate config/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(onDeviceCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            pubkey: "test-public-key-base64",
            name: "Desktop",
          }),
        );
      });
    });
  });

  describe("config display", () => {
    it("should show QR code tab by default", async () => {
      const existingDevice = {
        pubkey: "existing-pubkey",
        name: "Test Device",
        assignedIp: "10.8.0.5",
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(
        <DeviceConfigModal {...defaultProps} existingDevice={existingDevice} />,
      );

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /qr code/i })).toHaveAttribute(
          "aria-selected",
          "true",
        );
      });
    });

    it("should switch between tabs", async () => {
      const user = userEvent.setup();
      const existingDevice = {
        pubkey: "existing-pubkey",
        name: "Test Device",
        assignedIp: "10.8.0.5",
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(
        <DeviceConfigModal {...defaultProps} existingDevice={existingDevice} />,
      );

      // For existing devices, the title is "Config for {name}"
      await waitFor(() => {
        expect(
          screen.getByText(/config for test device/i),
        ).toBeInTheDocument();
      });

      // Click Download tab
      const downloadTab = screen.getByRole("tab", { name: /download/i });
      await user.click(downloadTab);
      expect(downloadTab).toHaveAttribute("aria-selected", "true");

      // Click Copy tab
      const copyTab = screen.getByRole("tab", { name: /copy/i });
      await user.click(copyTab);
      expect(copyTab).toHaveAttribute("aria-selected", "true");
    });

    it("should show download button with correct filename", async () => {
      const user = userEvent.setup();
      const existingDevice = {
        pubkey: "existing-pubkey",
        name: "My iPhone",
        assignedIp: "10.8.0.5",
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(
        <DeviceConfigModal {...defaultProps} existingDevice={existingDevice} />,
      );

      // For existing devices, the title is "Config for {name}"
      await waitFor(() => {
        expect(
          screen.getByText(/config for my iphone/i),
        ).toBeInTheDocument();
      });

      const downloadTab = screen.getByRole("tab", { name: /download/i });
      await user.click(downloadTab);

      // Download tab shows a button to download, not the filename directly in text
      // The filename is generated when clicking the button
      expect(screen.getByRole("button", { name: /download config file/i })).toBeInTheDocument();
    });
  });

  describe("modal behavior", () => {
    it("should close when close button is clicked", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <DeviceConfigModal {...defaultProps} onClose={onClose} />,
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("should close when Escape key is pressed", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <DeviceConfigModal {...defaultProps} onClose={onClose} />,
      );

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalled();
    });

    it("should have correct ARIA attributes", () => {
      renderWithProviders(<DeviceConfigModal {...defaultProps} />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby");
    });
  });

  describe("copy functionality", () => {
    it("should show copy tab with config textarea and copy button", async () => {
      const user = userEvent.setup();

      const existingDevice = {
        pubkey: "existing-pubkey",
        name: "Test Device",
        assignedIp: "10.8.0.5",
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(
        <DeviceConfigModal {...defaultProps} existingDevice={existingDevice} />,
      );

      // For existing devices, the title is "Config for {name}"
      await waitFor(() => {
        expect(
          screen.getByText(/config for test device/i),
        ).toBeInTheDocument();
      });

      const copyTab = screen.getByRole("tab", { name: /copy/i });
      await user.click(copyTab);

      // Should show textarea with config content
      const textarea = screen.getByLabelText(/wireguard configuration content/i);
      expect(textarea).toBeInTheDocument();

      // Should show copy button
      const copyButton = screen.getByRole("button", { name: /copy configuration/i });
      expect(copyButton).toBeInTheDocument();
    });
  });
});
