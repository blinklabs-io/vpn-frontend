import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, userEvent } from "../../test/utils";

// We need to mock import.meta.env before importing the component
// Since the module reads env vars at import time, we'll use vi.stubEnv

describe("ProtocolToggle", () => {
  afterEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  describe("when WireGuard is enabled", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_WIREGUARD_ENABLED", "true");
    });

    describe("and OpenVPN region is set", () => {
      beforeEach(() => {
        vi.stubEnv("VITE_OPENVPN_REGION", "us-east-1");
      });

      it("should render WireGuard selected by default and show OpenVPN link", async () => {
        vi.resetModules();
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="wireguard"
            onProtocolChange={onProtocolChange}
          />,
        );

        expect(
          screen.getByText(/looking for openvpn\?/i),
        ).toBeInTheDocument();
      });

      it("should call onProtocolChange with 'openvpn' when clicking OpenVPN link", async () => {
        vi.resetModules();
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="wireguard"
            onProtocolChange={onProtocolChange}
          />,
        );

        const openVpnLink = screen.getByText(/looking for openvpn\?/i);
        await user.click(openVpnLink);

        expect(onProtocolChange).toHaveBeenCalledWith("openvpn");
      });

      it("should show recommendation banner when OpenVPN is selected", async () => {
        vi.resetModules();
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="openvpn"
            onProtocolChange={onProtocolChange}
          />,
        );

        expect(
          screen.getByText(/we recommend wireguard/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/openvpn is provided for compatibility/i),
        ).toBeInTheDocument();
      });

      it("should show 'We recommend WireGuard' button when OpenVPN is selected", async () => {
        vi.resetModules();
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="openvpn"
            onProtocolChange={onProtocolChange}
          />,
        );

        expect(
          screen.getByRole("button", { name: /we recommend wireguard/i }),
        ).toBeInTheDocument();
      });

      it("should call onProtocolChange with 'wireguard' when clicking We recommend WireGuard", async () => {
        vi.resetModules();
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="openvpn"
            onProtocolChange={onProtocolChange}
          />,
        );

        const switchButton = screen.getByRole("button", {
          name: /we recommend wireguard/i,
        });
        await user.click(switchButton);

        expect(onProtocolChange).toHaveBeenCalledWith("wireguard");
      });

      it("should show dismiss button on recommendation banner", async () => {
        vi.resetModules();
        localStorage.clear();
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="openvpn"
            onProtocolChange={onProtocolChange}
          />,
        );

        expect(
          screen.getByRole("button", { name: /dismiss recommendation/i }),
        ).toBeInTheDocument();
      });

      it("should hide banner when dismiss button is clicked", async () => {
        vi.resetModules();
        localStorage.clear();
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="openvpn"
            onProtocolChange={onProtocolChange}
          />,
        );

        const dismissButton = screen.getByRole("button", {
          name: /dismiss recommendation/i,
        });
        await user.click(dismissButton);

        expect(
          screen.queryByText(/we recommend wireguard/i),
        ).not.toBeInTheDocument();
      });

      it("should persist banner dismissal in localStorage", async () => {
        vi.resetModules();
        localStorage.clear();
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="openvpn"
            onProtocolChange={onProtocolChange}
          />,
        );

        const dismissButton = screen.getByRole("button", {
          name: /dismiss recommendation/i,
        });
        await user.click(dismissButton);

        expect(localStorage.getItem("wireguard-recommendation-dismissed")).toBe(
          "true",
        );
      });

      it("should not show banner if previously dismissed", async () => {
        vi.resetModules();
        localStorage.setItem("wireguard-recommendation-dismissed", "true");
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="openvpn"
            onProtocolChange={onProtocolChange}
          />,
        );

        expect(
          screen.queryByText(/we recommend wireguard/i),
        ).not.toBeInTheDocument();
      });
    });

    describe("and OpenVPN region is not set", () => {
      beforeEach(() => {
        vi.stubEnv("VITE_OPENVPN_REGION", "");
      });

      it("should not show 'Looking for OpenVPN?' link", async () => {
        vi.resetModules();
        const { default: ProtocolToggle } = await import("../ProtocolToggle");

        const onProtocolChange = vi.fn();
        renderWithProviders(
          <ProtocolToggle
            selectedProtocol="wireguard"
            onProtocolChange={onProtocolChange}
          />,
        );

        expect(
          screen.queryByText(/looking for openvpn\?/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("when WireGuard is disabled", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_WIREGUARD_ENABLED", "false");
    });

    it("should return null (not render anything)", async () => {
      vi.resetModules();
      const { default: ProtocolToggle } = await import("../ProtocolToggle");

      const onProtocolChange = vi.fn();
      const { container } = renderWithProviders(
        <ProtocolToggle
          selectedProtocol="wireguard"
          onProtocolChange={onProtocolChange}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("helper functions", () => {
    describe("shouldShowWireGuardUI", () => {
      it("should return true when VITE_WIREGUARD_ENABLED is 'true'", async () => {
        vi.stubEnv("VITE_WIREGUARD_ENABLED", "true");
        vi.resetModules();
        const { shouldShowWireGuardUI } = await import("../ProtocolToggle");

        expect(shouldShowWireGuardUI()).toBe(true);
      });

      it("should return false when VITE_WIREGUARD_ENABLED is not 'true'", async () => {
        vi.stubEnv("VITE_WIREGUARD_ENABLED", "false");
        vi.resetModules();
        const { shouldShowWireGuardUI } = await import("../ProtocolToggle");

        expect(shouldShowWireGuardUI()).toBe(false);
      });
    });

    describe("isOpenVpnAvailable", () => {
      it("should return true when VITE_OPENVPN_REGION is set", async () => {
        vi.stubEnv("VITE_OPENVPN_REGION", "us-east-1");
        vi.resetModules();
        const { isOpenVpnAvailable } = await import("../ProtocolToggle");

        expect(isOpenVpnAvailable()).toBe(true);
      });

      it("should return false when VITE_OPENVPN_REGION is empty", async () => {
        vi.stubEnv("VITE_OPENVPN_REGION", "");
        vi.resetModules();
        const { isOpenVpnAvailable } = await import("../ProtocolToggle");

        expect(isOpenVpnAvailable()).toBe(false);
      });

      it("should return false when VITE_OPENVPN_REGION is undefined", async () => {
        vi.unstubAllEnvs();
        vi.resetModules();
        const { isOpenVpnAvailable } = await import("../ProtocolToggle");

        expect(isOpenVpnAvailable()).toBe(false);
      });
    });

    describe("getOpenVpnRegion", () => {
      it("should return the region when set", async () => {
        vi.stubEnv("VITE_OPENVPN_REGION", "eu-west-1");
        vi.resetModules();
        const { getOpenVpnRegion } = await import("../ProtocolToggle");

        expect(getOpenVpnRegion()).toBe("eu-west-1");
      });

      it("should return undefined when not set", async () => {
        vi.unstubAllEnvs();
        vi.resetModules();
        const { getOpenVpnRegion } = await import("../ProtocolToggle");

        expect(getOpenVpnRegion()).toBeUndefined();
      });
    });
  });

  describe("UI styling", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_WIREGUARD_ENABLED", "true");
      vi.stubEnv("VITE_OPENVPN_REGION", "us-east-1");
    });

    it("should have correct styling for OpenVPN link", async () => {
      vi.resetModules();
      const { default: ProtocolToggle } = await import("../ProtocolToggle");

      const onProtocolChange = vi.fn();
      renderWithProviders(
        <ProtocolToggle
          selectedProtocol="wireguard"
          onProtocolChange={onProtocolChange}
        />,
      );

      const link = screen.getByText(/looking for openvpn\?/i);
      expect(link).toHaveClass("text-sm");
      expect(link).toHaveClass("underline");
    });

    it("should render info icon in recommendation banner", async () => {
      vi.resetModules();
      localStorage.clear();
      const { default: ProtocolToggle } = await import("../ProtocolToggle");

      const onProtocolChange = vi.fn();
      renderWithProviders(
        <ProtocolToggle
          selectedProtocol="openvpn"
          onProtocolChange={onProtocolChange}
        />,
      );

      const infoIcon = screen.getByRole("img", { name: /info/i });
      expect(infoIcon).toBeInTheDocument();
    });

    it("should have blue styling for recommendation banner", async () => {
      vi.resetModules();
      localStorage.clear();
      const { default: ProtocolToggle } = await import("../ProtocolToggle");

      const onProtocolChange = vi.fn();
      renderWithProviders(
        <ProtocolToggle
          selectedProtocol="openvpn"
          onProtocolChange={onProtocolChange}
        />,
      );

      const banner = screen
        .getByText(/openvpn is provided for compatibility/i)
        .closest("div");
      // Check parent container has blue styling
      const container = banner?.parentElement?.parentElement;
      expect(container).toHaveClass("bg-blue-500/20");
      expect(container).toHaveClass("border-blue-500/40");
    });
  });
});
