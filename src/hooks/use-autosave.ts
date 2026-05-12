import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave. Calls `save(value)` after the user stops changing
 * `value` for `delay` ms. Skips the very first render so we don't save
 * the freshly hydrated value back to the server.
 *
 * Concurrency: each new save bumps a `runId`; only the latest run is
 * allowed to update status, preventing stale "saved" toasts from races.
 */
export function useAutosave<T>(
  value: T,
  save: (v: T) => Promise<void>,
  opts?: { delay?: number; enabled?: boolean; equals?: (a: T, b: T) => boolean },
) {
  const delay = opts?.delay ?? 800;
  const enabled = opts?.enabled ?? true;
  const equals = opts?.equals ?? ((a, b) => JSON.stringify(a) === JSON.stringify(b));

  const [status, setStatus] = useState<SaveStatus>("idle");
  const lastSaved = useRef<T | null>(null);
  const firstRender = useRef(true);
  const runId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (firstRender.current) {
      firstRender.current = false;
      lastSaved.current = value;
      return;
    }
    if (lastSaved.current !== null && equals(lastSaved.current, value)) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const myRun = ++runId.current;
      setStatus("saving");
      try {
        await save(value);
        if (myRun !== runId.current) return; // a newer run started — ignore
        lastSaved.current = value;
        setStatus("saved");
        setTimeout(() => {
          if (myRun === runId.current) setStatus("idle");
        }, 1500);
      } catch {
        if (myRun !== runId.current) return;
        setStatus("error");
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled]);

  return status;
}
