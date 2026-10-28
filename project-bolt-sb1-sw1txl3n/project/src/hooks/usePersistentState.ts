import { useCallback, useEffect, useState } from 'react';

/**
 * Tiny typed wrapper around localStorage with cross-tab sync and SSR safety.
 * Falls back to in-memory state when storage is unavailable.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [key, state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue != null) {
        try {
          setState(JSON.parse(e.newValue) as T);
        } catch {
          /* ignore malformed */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  const update = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) =>
        typeof value === 'function' ? (value as (prev: T) => T)(prev) : value,
      );
    },
    [],
  );

  return [state, update];
}
