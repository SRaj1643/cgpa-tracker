import { useEffect, useRef, useState } from "react";

/**
 * Reliable online/offline detection.
 *
 * - Source of truth: navigator.onLine + window 'online'/'offline' events.
 * - Debounces transitions (700ms) so a brief flap doesn't flicker the banner.
 * - When the browser claims "offline", verifies with a tiny no-cors HEAD ping
 *   before committing — avoids false positives from buggy network stacks.
 * - When the browser claims "online", clears offline state immediately.
 * - Cleans up listeners and timers on unmount.
 *
 * This hook intentionally does NOT react to API/Supabase errors. Backend
 * latency or validation errors must not be interpreted as "offline".
 */
export function useOnline() {
  const initial = typeof navigator !== "undefined" ? navigator.onLine : true;
  const [online, setOnline] = useState<boolean>(initial);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    mounted.current = true;

    const clearPending = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };

    const verifyOffline = async (): Promise<boolean> => {
      // If the browser already flipped back, trust it.
      if (navigator.onLine) return false;
      // Best-effort connectivity probe. no-cors so any reachable host counts.
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        await fetch(`${window.location.origin}/favicon.ico?_=${Date.now()}`, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
          signal: ctrl.signal,
        });
        clearTimeout(t);
        return false; // request succeeded → we are online
      } catch {
        return !navigator.onLine; // still offline per browser
      }
    };

    const goOnline = () => {
      clearPending();
      // Apply immediately — restoring connection should never lag.
      if (mounted.current) setOnline(true);
    };

    const goOffline = () => {
      clearPending();
      // Debounce + verify before showing the banner.
      debounceRef.current = setTimeout(async () => {
        const reallyOffline = await verifyOffline();
        if (mounted.current && reallyOffline) setOnline(false);
      }, 700);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Re-sync on tab focus / visibility change to clear stale offline state.
    const resync = () => {
      if (navigator.onLine) goOnline();
    };
    window.addEventListener("focus", resync);
    document.addEventListener("visibilitychange", resync);

    // Initial reconciliation in case state is stale after refresh.
    if (navigator.onLine && !online) setOnline(true);

    return () => {
      mounted.current = false;
      clearPending();
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("focus", resync);
      document.removeEventListener("visibilitychange", resync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return online;
}
