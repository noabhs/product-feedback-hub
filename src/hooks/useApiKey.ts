"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "navina_anthropic_key";
const CHANGE_EVENT = "navina:apikey-changed";

/**
 * The key lives in localStorage, so it's per-person and per-browser.
 *
 * Every hook instance keeps its own state, so saving from the sidebar control
 * has to notify the other consumers (the no-key banner, the extract pages) —
 * otherwise they'd keep showing stale state until a reload. A custom event
 * covers same-tab instances; the native `storage` event covers other tabs.
 */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState("");

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

  const saveKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
    setApiKeyState(trimmed);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const aiHeaders: Record<string, string> = apiKey ? { "x-anthropic-key": apiKey } : {};

  return { apiKey, saveKey, aiHeaders };
}
