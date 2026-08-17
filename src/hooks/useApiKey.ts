"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "navina_anthropic_key";
const CHANGE_EVENT = "navina:apikey-changed";

/** Cached across hook instances so every consumer doesn't re-request it. */
let serverKeyCache: boolean | null = null;

/**
 * A personal key is optional: it overrides the shared server key when set.
 *
 * `ready` distinguishes "still checking" from "checked, no key anywhere", so
 * the no-key warning doesn't flash on every page load before the answer lands.
 */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState("");
  const [hasServerKey, setHasServerKey] = useState<boolean>(serverKeyCache ?? false);
  const [ready, setReady] = useState(serverKeyCache !== null);

  useEffect(() => {
    const read = () => setApiKeyState(localStorage.getItem(STORAGE_KEY) ?? "");
    read();

    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === STORAGE_KEY) read();
    };
    window.addEventListener(CHANGE_EVENT, read);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, read);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (serverKeyCache !== null) return;
    let active = true;
    fetch("/api/ai/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        serverKeyCache = Boolean(d?.serverKey);
        setHasServerKey(serverKeyCache);
        setReady(true);
      })
      .catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const saveKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
    setApiKeyState(trimmed);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  // Only send the header when a personal key exists; otherwise the server falls
  // back to its own.
  const aiHeaders: Record<string, string> = apiKey ? { "x-anthropic-key": apiKey } : {};

  return {
    apiKey,
    saveKey,
    aiHeaders,
    hasServerKey,
    /** True when AI features are usable, by either route. */
    canUseAi: Boolean(apiKey) || hasServerKey,
    ready,
  };
}
