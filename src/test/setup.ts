import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

Object.defineProperty(window, "cardano", {
  value: {
    nami: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
    eternl: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
    flint: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
    yoroi: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
    gerowallet: {
      enable: vi.fn(),
      isEnabled: vi.fn(),
    },
  },
  writable: true,
});

global.fetch = vi.fn();

global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

vi.mock("@emurgo/cardano-serialization-lib-browser", () => ({
  Address: {
    from_bytes: vi.fn().mockReturnValue({
      to_bech32: vi.fn().mockReturnValue("addr_test1mock..."),
    }),
  },
}));

afterEach(() => {
  vi.resetAllMocks();
});
