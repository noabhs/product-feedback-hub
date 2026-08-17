"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "navina_anthropic_key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState("");

  useEffect(() => {
    setApiKeyState(localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  const saveKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setApiKeyState(trimmed);
  }, []);

  const aiHeaders: Record<string, string> = apiKey
    ? { "x-anthropic-key": apiKey }
    : {};

  return { apiKey, saveKey, aiHeaders };
}
