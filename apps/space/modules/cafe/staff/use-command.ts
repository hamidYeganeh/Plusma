import { useRef, useState } from "react";
import { message, request, RequestError } from "./staff-client";
type Command = { path: string; body: object; key: string };
function read(key: string): Command | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
    if (
      (saved &&
        typeof saved.path === "string" &&
        saved.path.startsWith("/venues/")) ||
      (saved &&
        typeof saved.path === "string" &&
        saved.path.startsWith("/orders/"))
    ) {
      if (
        typeof saved.key === "string" &&
        saved.body &&
        typeof saved.body === "object"
      )
        return saved;
    }
  } catch {
    /* The tab can still retry without storage. */
  }
  return null;
}
/** A lost response keeps the same payload/key, including across tab reloads. */
export function useCommand<T>(
  storageKey: string,
  onSuccess: (result: T) => void,
  onUnauthorized: () => void,
) {
  const [pending, setPending] = useState<Command | null>(() =>
    read(storageKey),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const running = useRef(false);
  function persist(value: Command | null) {
    setPending(value);
    try {
      if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* Keep retry intent in this tab. */
    }
  }
  async function run(command: Command) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    persist(command);
    try {
      const result = await request<T>(command.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": command.key,
        },
        body: JSON.stringify(command.body),
      });
      persist(null);
      onSuccess(result);
    } catch (value) {
      if (value instanceof RequestError && value.status < 500) {
        persist(null);
        if (value.status === 401) onUnauthorized();
      }
      setError(message(value));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return {
    pending,
    busy,
    error,
    run,
    retry: () => {
      if (pending) void run(pending);
    },
  };
}
