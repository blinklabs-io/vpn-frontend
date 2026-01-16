import type { WireGuardDevice } from "../api/types";
import { getDeviceIconFromName } from "../utils/deviceDetection";
import SpinningBorderButton from "./SpinningBorderButton";

interface WireGuardDeviceListProps {
  devices: WireGuardDevice[];
  deviceLimit: number;
  onAddDevice: () => void;
  onRedownloadConfig: (device: WireGuardDevice) => void;
  onRegenerateAll: () => void;
}

/**
 * Formats an ISO timestamp into a readable date string
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const WireGuardDeviceList = ({
  devices,
  deviceLimit,
  onAddDevice,
  onRedownloadConfig,
  onRegenerateAll,
}: WireGuardDeviceListProps) => {
  const deviceCount = devices.length;
  const canAddDevice = deviceCount < deviceLimit;
  const isAtLimit = deviceCount >= deviceLimit;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Device count header */}
      <div className="flex items-center justify-between">
        <p className="text-xs md:text-sm font-medium">
          Devices ({deviceCount}/{deviceLimit})
        </p>
      </div>

      {/* Device list */}
      {devices.length > 0 ? (
        <div className="flex flex-col gap-2">
          {devices.map((device) => (
            <div
              key={device.pubkey}
              className="flex flex-col gap-1.5 p-3 rounded-md bg-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base" role="img" aria-label="device">
                    {getDeviceIconFromName(device.name)}
                  </span>
                  <span className="text-sm font-medium">{device.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/70">
                  Created: {formatDate(device.createdAt)}
                </p>
                <button
                  onClick={() => onRedownloadConfig(device)}
                  className="text-xs px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                >
                  Re-download Config
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/70">No devices registered yet.</p>
      )}

      {/* Add device or limit reached message */}
      {canAddDevice ? (
        <SpinningBorderButton
          onClick={onAddDevice}
          className="flex items-center justify-center gap-2 py-1.5 px-3.5 backdrop-blur-xs shadow-sm bg-white text-black hover:bg-white/90 transition-all w-full md:w-auto md:self-start"
          radius="8px"
        >
          <span className="text-black font-semibold text-xs md:text-sm">
            + Add Device
          </span>
        </SpinningBorderButton>
      ) : isAtLimit ? (
        <div className="flex flex-col gap-2 p-3 rounded-md bg-white/10 backdrop-blur-sm">
          <p className="text-xs text-white/80">
            Device limit reached ({deviceLimit}/{deviceLimit}). To add a new device, you can
            regenerate all configurations which will remove existing devices.
          </p>
        </div>
      ) : null}

      {/* Regenerate all button - always visible when there are devices */}
      {devices.length > 0 && (
        <div className="flex justify-end pt-1">
          <button
            onClick={onRegenerateAll}
            className="text-xs px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
          >
            Regenerate All Configs
          </button>
        </div>
      )}
    </div>
  );
};

export default WireGuardDeviceList;
