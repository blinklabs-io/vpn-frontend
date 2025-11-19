export const truncateAddress = (
  address: string | null | undefined,
  startChars = 8,
  endChars = 8,
): string => {
  if (!address) return "";
  
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

