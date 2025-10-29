export interface PendingTransaction {
  id: string;
  region: string;
  duration: string;
  purchaseTime: string;
  status: "pending" | "complete";
  attempts: number;
  maxAttempts: number;
}

const STORAGE_KEY = "vpn_pending_transactions";
const CLEANUP_AFTER_MS = 24 * 60 * 60 * 1000;

export function getPendingTransactions(): PendingTransaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const transactions: PendingTransaction[] = JSON.parse(stored);
    return transactions;
  } catch (error) {
    console.error("Failed to get pending transactions:", error);
    return [];
  }
}

export function getActivePendingTransactions(): PendingTransaction[] {
  return getPendingTransactions().filter((tx) => tx.status === "pending");
}

export function addPendingTransaction(
  transaction: Omit<PendingTransaction, "status" | "attempts" | "maxAttempts">,
): void {
  try {
    const transactions = getPendingTransactions();

    const existingIndex = transactions.findIndex(
      (tx) => tx.id === transaction.id,
    );
    if (existingIndex !== -1) {
      console.warn(
        `Transaction ${transaction.id} already exists, not adding duplicate`,
      );
      return;
    }

    const newTransaction: PendingTransaction = {
      ...transaction,
      status: "pending",
      attempts: 0,
      maxAttempts: 20,
    };

    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Failed to add pending transaction:", error);
  }
}

export function updateTransactionStatus(
  id: string,
  status: "pending" | "complete",
): void {
  try {
    const transactions = getPendingTransactions();
    const transaction = transactions.find((tx) => tx.id === id);

    if (!transaction) {
      console.warn(`Transaction ${id} not found`);
      return;
    }

    transaction.status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Failed to update transaction status:", error);
  }
}

export function updateTransactionAttempts(id: string, attempts: number): void {
  try {
    const transactions = getPendingTransactions();
    const transaction = transactions.find((tx) => tx.id === id);

    if (!transaction) {
      console.warn(`Transaction ${id} not found`);
      return;
    }

    transaction.attempts = attempts;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Failed to update transaction attempts:", error);
  }
}

export function removePendingTransaction(id: string): void {
  try {
    const transactions = getPendingTransactions();
    const filtered = transactions.filter((tx) => tx.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove pending transaction:", error);
  }
}

export function cleanupCompletedTransactions(): void {
  try {
    const transactions = getPendingTransactions();
    const now = Date.now();

    const filtered = transactions.filter((tx) => {
      if (tx.status === "pending") {
        return true;
      }

      const purchaseTime = new Date(tx.purchaseTime).getTime();
      return now - purchaseTime < CLEANUP_AFTER_MS;
    });

    if (filtered.length !== transactions.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log(
        `Cleaned up ${transactions.length - filtered.length} old completed transactions`,
      );
    }
  } catch (error) {
    console.error("Failed to cleanup completed transactions:", error);
  }
}

export function clearAllPendingTransactions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear pending transactions:", error);
  }
}
