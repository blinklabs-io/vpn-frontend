export type SortOption =
  | "default"
  | "recently_expired"
  | "most_recent"
  | "longest_duration";

export interface VpnInstanceData {
  id: string;
  region: string;
  duration: string;
  status: "Active" | "Expired" | "Pending";
  expires: string;
  expirationDate: Date;
  originalDuration: number;
}

export const sortVpnInstances = (
  instances: VpnInstanceData[],
  sortOption: SortOption,
): VpnInstanceData[] => {
  const sorted = [...instances];

  switch (sortOption) {
    case "recently_expired":
      return sorted.sort((a, b) => {
        if (a.status !== "Expired" && b.status === "Expired") return 1;
        if (a.status === "Expired" && b.status !== "Expired") return -1;
        return b.expirationDate.getTime() - a.expirationDate.getTime();
      });

    case "most_recent":
      return sorted.sort((a, b) => {
        if (a.status === "Pending" && b.status === "Pending") {
          return b.expirationDate.getTime() - a.expirationDate.getTime();
        }
        if (a.status === "Pending") return -1;
        if (b.status === "Pending") return 1;
        return b.expirationDate.getTime() - a.expirationDate.getTime();
      });

    case "longest_duration":
      return sorted.sort((a, b) => {
        if (a.status === "Pending" && b.status === "Pending") return 0;
        if (a.status === "Pending") return -1;
        if (b.status === "Pending") return 1;
        return b.originalDuration - a.originalDuration;
      });

    default:
      return sorted.sort((a, b) => {
        if (a.status === "Pending" && b.status !== "Pending") return -1;
        if (a.status !== "Pending" && b.status === "Pending") return 1;
        if (a.status === "Active" && b.status === "Expired") return -1;
        if (a.status === "Expired" && b.status === "Active") return 1;

        if (a.status === "Active") {
          return b.expirationDate.getTime() - a.expirationDate.getTime();
        } else {
          return b.expirationDate.getTime() - a.expirationDate.getTime();
        }
      });
  }
};

export const filterOptions = [
  { value: "default", label: "All Instances" },
  { value: "recently_expired", label: "Recently Expired" },
  { value: "most_recent", label: "Most Recent" },
  { value: "longest_duration", label: "Longest Duration" },
] as const;
