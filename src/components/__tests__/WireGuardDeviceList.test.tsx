import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, userEvent } from "../../test/utils";
import WireGuardDeviceList from "../WireGuardDeviceList";
import type { WireGuardDevice } from "../../api/types";

// Mock the deviceDetection utility
vi.mock("../../utils/deviceDetection", () => ({
  getDeviceIconFromName: vi.fn((name: string) => {
    if (name.toLowerCase().includes("iphone")) return "\u{1F4F1}";
    if (name.toLowerCase().includes("mac")) return "\u{1F4BB}";
    return "\u{1F5A5}";
  }),
}));

describe("WireGuardDeviceList", () => {
  const mockOnAddDevice = vi.fn();
  const mockOnRedownloadConfig = vi.fn();
  const mockOnRegenerateAll = vi.fn();

  const createMockDevice = (
    overrides: Partial<WireGuardDevice> = {},
  ): WireGuardDevice => ({
    pubkey: `pubkey-${Math.random().toString(36).slice(2)}`,
    name: "Test Device",
    assignedIp: "10.8.0.2",
    createdAt: "2024-01-15T12:00:00.000Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("device count display", () => {
    it("should render device count correctly with no devices", () => {
      renderWithProviders(
        <WireGuardDeviceList
          devices={[]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText("Devices (0/3)")).toBeInTheDocument();
    });

    it("should render device count correctly with some devices", () => {
      const devices = [createMockDevice(), createMockDevice()];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText("Devices (2/3)")).toBeInTheDocument();
    });

    it("should render device count correctly when at limit", () => {
      const devices = [
        createMockDevice(),
        createMockDevice(),
        createMockDevice(),
      ];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText("Devices (3/3)")).toBeInTheDocument();
    });
  });

  describe("device list rendering", () => {
    it("should show 'No devices registered yet' when devices array is empty", () => {
      renderWithProviders(
        <WireGuardDeviceList
          devices={[]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(
        screen.getByText("No devices registered yet."),
      ).toBeInTheDocument();
    });

    it("should render devices with names", () => {
      const devices = [
        createMockDevice({ name: "My iPhone" }),
        createMockDevice({ name: "MacBook Pro" }),
      ];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText("My iPhone")).toBeInTheDocument();
      expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
    });

    it("should render devices with formatted dates", () => {
      const devices = [
        createMockDevice({ createdAt: "2024-01-15T12:00:00.000Z" }),
        createMockDevice({ createdAt: "2024-06-20T08:30:00.000Z" }),
      ];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText(/Created: Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Created: Jun 20, 2024/)).toBeInTheDocument();
    });

    it("should render device icons based on device name", () => {
      const devices = [
        createMockDevice({ name: "My iPhone" }),
        createMockDevice({ name: "MacBook Pro" }),
      ];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      // Check that device icons are rendered
      const deviceIcons = screen.getAllByRole("img", { name: /device/i });
      expect(deviceIcons).toHaveLength(2);
    });

    it("should handle invalid date gracefully", () => {
      const devices = [createMockDevice({ createdAt: "invalid-date" })];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      // The formatDate function returns "Unknown" for invalid dates
      expect(screen.getByText(/Created: Unknown/)).toBeInTheDocument();
    });
  });

  describe("Add Device button", () => {
    it("should render 'Add Device' button when below device limit", () => {
      renderWithProviders(
        <WireGuardDeviceList
          devices={[createMockDevice()]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText("+ Add Device")).toBeInTheDocument();
    });

    it("should call onAddDevice when Add Device button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <WireGuardDeviceList
          devices={[]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      const addButton = screen.getByText("+ Add Device");
      await user.click(addButton);

      expect(mockOnAddDevice).toHaveBeenCalledTimes(1);
    });

    it("should hide 'Add Device' button when at device limit", () => {
      const devices = [
        createMockDevice(),
        createMockDevice(),
        createMockDevice(),
      ];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.queryByText("+ Add Device")).not.toBeInTheDocument();
    });
  });

  describe("device limit message", () => {
    it("should show device limit message when at limit", () => {
      const devices = [
        createMockDevice(),
        createMockDevice(),
        createMockDevice(),
      ];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText(/Device limit reached/i)).toBeInTheDocument();
      expect(
        screen.getByText(/regenerate all configurations/i),
      ).toBeInTheDocument();
    });

    it("should not show device limit message when below limit", () => {
      renderWithProviders(
        <WireGuardDeviceList
          devices={[createMockDevice()]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.queryByText(/Device limit reached/i)).not.toBeInTheDocument();
    });
  });

  describe("Re-download Config button", () => {
    it("should render 'Re-download Config' button for each device", () => {
      const devices = [createMockDevice(), createMockDevice()];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      const redownloadButtons = screen.getAllByText("Re-download Config");
      expect(redownloadButtons).toHaveLength(2);
    });

    it("should call onRedownloadConfig with correct device when clicked", async () => {
      const user = userEvent.setup();
      const device1 = createMockDevice({ name: "Device 1", pubkey: "pk1" });
      const device2 = createMockDevice({ name: "Device 2", pubkey: "pk2" });

      renderWithProviders(
        <WireGuardDeviceList
          devices={[device1, device2]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      const redownloadButtons = screen.getAllByText("Re-download Config");
      await user.click(redownloadButtons[0]);

      expect(mockOnRedownloadConfig).toHaveBeenCalledWith(device1);
    });
  });

  describe("Regenerate All Configs button", () => {
    it("should render 'Regenerate All Configs' button when there are devices", () => {
      renderWithProviders(
        <WireGuardDeviceList
          devices={[createMockDevice()]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText("Regenerate All Configs")).toBeInTheDocument();
    });

    it("should not render 'Regenerate All Configs' button when no devices", () => {
      renderWithProviders(
        <WireGuardDeviceList
          devices={[]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(
        screen.queryByText("Regenerate All Configs"),
      ).not.toBeInTheDocument();
    });

    it("should call onRegenerateAll when clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <WireGuardDeviceList
          devices={[createMockDevice()]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      const regenerateButton = screen.getByText("Regenerate All Configs");
      await user.click(regenerateButton);

      expect(mockOnRegenerateAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("different device limits", () => {
    it("should work correctly with device limit of 1", () => {
      const devices = [createMockDevice()];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={1}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText("Devices (1/1)")).toBeInTheDocument();
      expect(screen.queryByText("+ Add Device")).not.toBeInTheDocument();
      expect(screen.getByText(/Device limit reached/i)).toBeInTheDocument();
    });

    it("should work correctly with device limit of 5", () => {
      const devices = [
        createMockDevice(),
        createMockDevice(),
        createMockDevice(),
      ];

      renderWithProviders(
        <WireGuardDeviceList
          devices={devices}
          deviceLimit={5}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText("Devices (3/5)")).toBeInTheDocument();
      expect(screen.getByText("+ Add Device")).toBeInTheDocument();
      expect(screen.queryByText(/Device limit reached/i)).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should render correctly with exactly one device", () => {
      const device = createMockDevice({ name: "Single Device" });

      renderWithProviders(
        <WireGuardDeviceList
          devices={[device]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      expect(screen.getByText("Devices (1/3)")).toBeInTheDocument();
      expect(screen.getByText("Single Device")).toBeInTheDocument();
      expect(screen.getByText("+ Add Device")).toBeInTheDocument();
      expect(screen.getByText("Regenerate All Configs")).toBeInTheDocument();
    });

    it("should handle device with empty name", () => {
      const device = createMockDevice({ name: "" });

      renderWithProviders(
        <WireGuardDeviceList
          devices={[device]}
          deviceLimit={3}
          onAddDevice={mockOnAddDevice}
          onRedownloadConfig={mockOnRedownloadConfig}
          onRegenerateAll={mockOnRegenerateAll}
        />,
      );

      // Should still render without crashing
      expect(screen.getByText("Devices (1/3)")).toBeInTheDocument();
    });
  });
});
