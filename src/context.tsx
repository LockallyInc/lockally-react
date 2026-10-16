import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { LockallyClient, type GetToken } from '@lockally/ui-core';

const LockallyContext = createContext<LockallyClient | null>(null);

export interface LockallyProviderProps {
  /** Async callback returning a short-lived bearer token from your backend. */
  getToken?: GetToken;
  /** Base URL / proxy. Default `https://api.lockally.com`. */
  baseUrl?: string;
  /** Inject a preconfigured client (mainly for testing). Overrides getToken/baseUrl. */
  client?: LockallyClient;
  children: ReactNode;
}

/**
 * Provides a {@link LockallyClient} to the Lockally components below it.
 * Never pass a secret `lk_live_` key — supply `getToken` (short-lived token from
 * your backend) or a `baseUrl` proxy.
 */
export function LockallyProvider({ getToken, baseUrl, client, children }: LockallyProviderProps) {
  const value = useMemo(
    () => client ?? new LockallyClient({ getToken, baseUrl }),
    [client, getToken, baseUrl],
  );
  return <LockallyContext.Provider value={value}>{children}</LockallyContext.Provider>;
}

/** Access the Lockally client from within a {@link LockallyProvider}. */
export function useLockally(): LockallyClient {
  const client = useContext(LockallyContext);
  if (!client) {
    throw new Error('useLockally() must be used inside a <LockallyProvider>.');
  }
  return client;
}
