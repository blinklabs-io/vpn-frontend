import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import {
  renderWithProviders,
  setupWalletMocks,
  userEvent,
} from "../../test/utils";
import WalletConnection from "../WalletConnection";
import { useWalletStore } from "../../stores/walletStore";

vi.mock("@cardano-foundation/cardano-connect-with-wallet", () => ({
  ConnectWalletList: ({
    supportedWallets,
    onConnect,
  }: {
    supportedWallets: string[];
    onConnect: (wallet: string) => void;
  }) => (
    <div data-testid="mock-wallet-list">
      {supportedWallets.map((wallet) => (
        <button
          key={wallet}
          data-testid={`wallet-option-${wallet}`}
          type="button"
          onClick={() => onConnect(wallet)}
        >
          {wallet}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../stores/walletStore");

const mockUseWalletStore = vi.mocked(useWalletStore);

describe("WalletConnection", () => {
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  const mockOpenWalletModal = vi.fn();
  const mockCloseWalletModal = vi.fn();

  const createMockStore = (overrides = {}) => ({
    isConnected: false,
    connect: mockConnect,
    disconnect: mockDisconnect,
    isEnabled: false,
    enabledWallet: null,
    stakeAddress: null,
    walletApi: null,
    isWalletModalOpen: false,
    setWalletState: vi.fn(),
    signMessage: vi.fn(),
    toggleWalletModal: vi.fn(),
    openWalletModal: mockOpenWalletModal,
    closeWalletModal: mockCloseWalletModal,
    ...overrides,
  });

  beforeEach(() => {
    vi.resetAllMocks();
    setupWalletMocks();
    mockConnect.mockResolvedValue(true);
    mockUseWalletStore.mockReturnValue(createMockStore());
  });

  describe("when wallet is not connected", () => {
    it("should render connect button with default variant", () => {
      renderWithProviders(<WalletConnection />);

      const connectButton = screen.getByRole("button", {
        name: /connect wallet/i,
      });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).toHaveClass("border-white", "text-black");
    });

    it("should render connect button with white variant", () => {
      renderWithProviders(<WalletConnection variant="white" />);

      const connectButton = screen.getByRole("button", {
        name: /connect wallet/i,
      });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).toHaveClass("bg-white", "text-black");
    });

    it("should render full layout when showTitle and showDescription are true", () => {
      renderWithProviders(
        <WalletConnection showTitle={true} showDescription={true} />,
      );

      expect(
        screen.getByText(/connect your wallet to begin/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/any descriptive copy/i)).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /wallet/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /connect/i }),
      ).toBeInTheDocument();
    });

    it("should call connect when a wallet option is selected from open modal", async () => {
      // Render with modal already open to test wallet selection behavior
      mockUseWalletStore.mockReturnValue(createMockStore({ isWalletModalOpen: true }));

      const user = userEvent.setup();
      renderWithProviders(<WalletConnection />);

      const walletOption = await screen.findByTestId("wallet-option-eternl");
      await user.click(walletOption);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith("eternl");
      });
    });

    it("should show error message when wallet connection fails", async () => {
      mockConnect.mockRejectedValue(new Error("Connection failed"));
      // Render with modal already open
      mockUseWalletStore.mockReturnValue(createMockStore({ isWalletModalOpen: true }));

      const user = userEvent.setup();
      renderWithProviders(<WalletConnection />);

      const walletOption = await screen.findByTestId("wallet-option-eternl");
      await user.click(walletOption);

      await waitFor(() => {
        expect(
          screen.getByText(/error connecting to eternl/i),
        ).toBeInTheDocument();
      });
    });

    it("should surface error when wallet is not installed", async () => {
      mockConnect.mockRejectedValue(new Error("eternl wallet is not installed"));
      // Render with modal already open
      mockUseWalletStore.mockReturnValue(createMockStore({ isWalletModalOpen: true }));

      const user = userEvent.setup();
      renderWithProviders(<WalletConnection />);

      const walletOption = await screen.findByTestId("wallet-option-eternl");
      await user.click(walletOption);

      await waitFor(() => {
        expect(
          screen.getByText(/wallet is not installed/i),
        ).toBeInTheDocument();
      });
    });

    it("should display wallet options in flex layout after clicking connect", async () => {
      // Render with modal already open to test that wallet options are displayed
      mockUseWalletStore.mockReturnValue(createMockStore({ isWalletModalOpen: true }));

      renderWithProviders(<WalletConnection listLayout="flex" />);

      expect(
        await screen.findByTestId("wallet-option-eternl"),
      ).toBeInTheDocument();
    });
  });

  describe("when wallet is connected", () => {
    beforeEach(() => {
      mockUseWalletStore.mockReturnValue(createMockStore({
        isConnected: true,
        isEnabled: true,
        enabledWallet: "nami",
        stakeAddress: "stake1234567890",
      }));
    });

    it("should render disconnect button", () => {
      renderWithProviders(<WalletConnection />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect/i,
      });
      expect(disconnectButton).toBeInTheDocument();
    });

    it("should call disconnect function when disconnect button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<WalletConnection />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect/i,
      });
      await user.click(disconnectButton);

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it("should not render connect button when connected", () => {
      renderWithProviders(<WalletConnection />);

      expect(
        screen.queryByRole("button", { name: /connect wallet/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("variant props", () => {
    it("should apply correct classes for default variant", () => {
      renderWithProviders(<WalletConnection variant="default" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "border-white",
        "bg-white/80",
        "text-black",
      );
    });

    it("should apply correct classes for white variant", () => {
      renderWithProviders(<WalletConnection variant="white" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-white", "text-black");
    });
  });

  describe("conditional rendering", () => {
    it("should render only title when showTitle is true", () => {
      renderWithProviders(
        <WalletConnection showTitle={true} showDescription={false} />,
      );

      expect(
        screen.getByText(/connect your wallet to begin/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/any descriptive copy/i),
      ).not.toBeInTheDocument();
    });

    it("should render only description when showDescription is true", () => {
      renderWithProviders(
        <WalletConnection showTitle={false} showDescription={true} />,
      );

      expect(
        screen.queryByText(/connect your wallet to begin/i),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/any descriptive copy/i)).toBeInTheDocument();
    });

    it("should render simple button when both title and description are false", () => {
      renderWithProviders(
        <WalletConnection showTitle={false} showDescription={false} />,
      );

      expect(
        screen.queryByText(/connect your wallet to begin/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/any descriptive copy/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /connect wallet/i }),
      ).toBeInTheDocument();
    });
  });
});
