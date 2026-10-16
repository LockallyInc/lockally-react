import { useEffect, useState } from 'react';
import type { Contact, Template } from '@lockally/ui-core';
import { useLockally } from './context.js';

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error?: Error;
}

/** Search contacts (debounce upstream if you like). Re-runs when `q` changes. */
export function useContacts(q?: string): AsyncState<Contact[]> {
  const client = useLockally();
  const [state, setState] = useState<AsyncState<Contact[]>>({ data: [], loading: false });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    client
      .listContacts(q)
      .then((data) => active && setState({ data, loading: false }))
      .catch((error: Error) => active && setState({ data: [], loading: false, error }));
    return () => {
      active = false;
    };
  }, [client, q]);

  return state;
}

/** List stored templates once on mount. */
export function useTemplates(): AsyncState<Template[]> {
  const client = useLockally();
  const [state, setState] = useState<AsyncState<Template[]>>({ data: [], loading: true });

  useEffect(() => {
    let active = true;
    setState({ data: [], loading: true });
    client
      .listTemplates()
      .then((data) => active && setState({ data, loading: false }))
      .catch((error: Error) => active && setState({ data: [], loading: false, error }));
    return () => {
      active = false;
    };
  }, [client]);

  return state;
}
