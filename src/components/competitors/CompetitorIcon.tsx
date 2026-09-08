"use client";
import { useState } from "react";
import { faviconUrl } from "@/lib/competitor-icon";

const FALLBACK_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-green-100 text-green-700",
];

function fallbackColor(name: string): string {
  const sum = name.split("").reduce((n, ch) => n + ch.charCodeAt(0), 0);
  return FALLBACK_COLORS[sum % FALLBACK_COLORS.length];
}

/** A favicon pulled from the competitor's website, falling back to a colored initial when there's no website or the favicon fails to load. */
export function CompetitorIcon({ name, website, size = 24 }: { name: string; website: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = faviconUrl(website, size * 2);

  if (!src || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-sm font-bold shrink-0 ${fallbackColor(name)}`}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external favicon, not a project asset
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="rounded-sm shrink-0"
      onError={() => setFailed(true)}
    />
  );
}
