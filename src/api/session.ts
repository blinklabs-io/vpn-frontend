import {
  HttpError,
  post,
  postPlainText,
  del,
  getClientProfile,
} from "./client";
import { useWalletStore } from "../stores/walletStore";

/**
 * Runs an authenticated API call, attaching a wallet-wide Bearer session
 * token. If the call fails with 401 (expired/invalid token), the cached token
 * is cleared and the call is retried once with a fresh token.
 */
async function withSessionToken<T>(
  call: (headers: Record<string, string>) => Promise<T>,
): Promise<T> {
  const store = useWalletStore.getState();
  const token = await store.getSessionToken();
  try {
    return await call({ Authorization: `Bearer ${token}` });
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      // Conditional clear: only evicts if `token` is still cached, so a
      // concurrent 401 cannot delete a token another call already refreshed.
      await store.clearSessionToken(token);
      const fresh = await store.getSessionToken();
      return await call({ Authorization: `Bearer ${fresh}` });
    }
    throw error;
  }
}

/** Authenticated POST returning JSON. */
export function authedPost<T>(endpoint: string, data?: unknown): Promise<T> {
  return withSessionToken((headers) => post<T>(endpoint, data, { headers }));
}

/** Authenticated POST returning text/plain. */
export function authedPostPlainText(
  endpoint: string,
  data?: unknown,
): Promise<string> {
  return withSessionToken((headers) =>
    postPlainText(endpoint, data, { headers }),
  );
}

/** Authenticated DELETE returning JSON. */
export function authedDel<T>(endpoint: string, data?: unknown): Promise<T> {
  return withSessionToken((headers) => del<T>(endpoint, data, { headers }));
}

/**
 * Authenticated OpenVPN profile fetch. Returns the pre-signed config URL (or
 * config text). Uses the wallet-wide session token instead of a per-request
 * signature; clientId names which subscription's profile to fetch.
 */
export function authedGetClientProfile(clientId: string): Promise<string> {
  return withSessionToken((headers) =>
    getClientProfile({ id: clientId }, headers),
  );
}
