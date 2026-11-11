'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and React's initial hydration pass, then `true`
 * on the client without triggering `setState` inside an effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function subscribeToHistoryChange(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

/** Reads a URL query parameter safely after hydration without effect setState. */
export function useClientSearchParam(name: string): string | null {
  return useSyncExternalStore(
    subscribeToHistoryChange,
    () => new URLSearchParams(window.location.search).get(name),
    () => null
  );
}

