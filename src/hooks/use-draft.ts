import { useEffect, useRef, useState } from "react";

/**
 * Persists in-progress form state to localStorage so users can recover
 * unsaved drafts after refresh / crash / tab close.
 *
 * - Keyed per user so drafts never bleed across accounts.
 * - Returns the raw stored value (or null) so callers can prompt for restore.
 * - `clear()` should be called after a successful save.
 */
export function useDraft<T>(key: string | null, value: T, opts?: { debounceMs?: number; enabled?: boolean }) {
  const enabled = opts?.enabled ?? true;
  const debounceMs = opts?.debounceMs ?? 400;
  const [storedDraft, setStoredDraft] = useState<T | null>(null);
  const initialized = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial read
  useEffect(() => {
    if (!enabled || !key || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setStoredDraft(JSON.parse(raw) as T);
    } catch {
      // ignore corrupt JSON
    }
    initialized.current = true;
  }, [key, enabled]);

  // Debounced write
  useEffect(() => {
    if (!enabled || !key || !initialized.current || typeof window === "undefined") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // quota / disabled storage — ignore
      }
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key, value, debounceMs, enabled]);

  const clear = () => {
    if (!key || typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setStoredDraft(null);
  };

  return { storedDraft, clear };
}
