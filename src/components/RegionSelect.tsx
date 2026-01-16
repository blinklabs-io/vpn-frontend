import { useEffect } from "react";
import Select from "react-select";
import type { VpnProtocolType } from "./ProtocolToggle";

/**
 * Map of region IDs to friendly display names.
 * Format: "Friendly Name (technical-id)"
 */
const REGION_FRIENDLY_NAMES: Record<string, string> = {
  // WireGuard regions
  "wg-us1": "United States East",
  "wg-us2": "United States West",
  "wg-eu1": "Europe (Amsterdam)",
  "wg-eu2": "Europe (Frankfurt)",
  "wg-asia1": "Asia Pacific (Singapore)",
  "wg-asia2": "Asia Pacific (Tokyo)",
  // Mock WireGuard region for development/testing
  "dev-us1": "Development US (WireGuard)",
  // OpenVPN legacy regions (preprod uses spaces in region names)
  us1: "United States",
  "us east-1": "United States East",
  "us east-2": "United States East 2",
  // Add more mappings as needed
};

/**
 * Get the friendly display name for a region.
 * Returns "Friendly Name (technical-id)" format.
 */
function getRegionDisplayName(regionId: string): string {
  const friendlyName = REGION_FRIENDLY_NAMES[regionId];
  if (friendlyName) {
    return `${friendlyName} (${regionId})`;
  }
  // Fallback: capitalize and format the region ID
  return regionId.toUpperCase();
}

// Get the OpenVPN regions from environment (comma-separated list)
const openVpnRegionsEnv = import.meta.env.VITE_OPENVPN_REGION || "";
const openVpnRegions = openVpnRegionsEnv
  .split(",")
  .map((r: string) => r.trim())
  .filter(Boolean);


/**
 * Check if a region is an OpenVPN region
 */
function isOpenVpnRegion(region: string): boolean {
  return openVpnRegions.includes(region);
}

/**
 * Filter regions based on the selected protocol.
 * - For WireGuard: exclude OpenVPN regions (any region not in VITE_OPENVPN_REGION list)
 * - For OpenVPN: only include OpenVPN regions
 */
export function filterRegionsByProtocol(
  regions: string[],
  protocol: VpnProtocolType
): string[] {
  if (protocol === "openvpn") {
    // Only show OpenVPN regions
    return regions.filter(isOpenVpnRegion);
  }

  // WireGuard: exclude OpenVPN regions
  return regions.filter((r) => !isOpenVpnRegion(r));
}

interface RegionSelectProps {
  value: string;
  onChange: (region: string) => void;
  regions: string[];
  disabled?: boolean;
  showTooltips?: boolean;
  /** Protocol filter - when set, filters regions appropriately */
  protocol?: VpnProtocolType;
}

const RegionSelect = ({
  value,
  onChange,
  regions,
  disabled,
  showTooltips,
  protocol,
}: RegionSelectProps) => {
  // Filter regions based on protocol if specified
  const filteredRegions = protocol
    ? filterRegionsByProtocol(regions, protocol)
    : regions;

  // Auto-select first region when current value is not in filtered regions
  // This handles both single-region cases and when value is filtered out by protocol change
  useEffect(() => {
    if (filteredRegions.length === 0) {
      return;
    }
    if (!filteredRegions.includes(value)) {
      onChange(filteredRegions[0]);
    }
  }, [filteredRegions, value, onChange]);

  // Hide selector entirely when only 1 region available
  if (filteredRegions.length <= 1) {
    return null;
  }

  const options = filteredRegions.map((region) => ({
    value: region,
    label: getRegionDisplayName(region),
  }));

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  return (
    <div
      className="w-full max-w-xs"
      {...(showTooltips && { "data-tooltip-id": "region-tooltip" })}
    >
      <Select
        value={selectedOption}
        onChange={(option) => option && onChange(option.value)}
        options={options}
        isDisabled={disabled}
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            minHeight: "40px",
          }),
          singleValue: (base) => ({
            ...base,
            color: "white",
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "rgba(148, 0, 255, 0.8)"
              : state.isFocused
                ? "rgba(148, 0, 255, 0.3)"
                : "rgba(0, 0, 0, 0.8)",
            color: "white",
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }),
          placeholder: (base) => ({
            ...base,
            color: "rgba(255, 255, 255, 0.7)",
          }),
        }}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: "rgba(148, 0, 255, 0.8)",
            primary75: "rgba(148, 0, 255, 0.6)",
            primary50: "rgba(148, 0, 255, 0.4)",
            primary25: "rgba(148, 0, 255, 0.2)",
          },
        })}
      />
    </div>
  );
};

export default RegionSelect;
