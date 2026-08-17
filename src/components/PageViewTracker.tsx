"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Records a page view on each navigation. Deduplicated per path so React
 * re-renders and Strict Mode's double-invoke don't log the same view twice.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastLogged.current === pathname) return;
    lastLogged.current = pathname;

    // keepalive so the request survives the navigation that triggered it.
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {}); // analytics must never surface an error to the user
  }, [pathname]);

  return null;
}
