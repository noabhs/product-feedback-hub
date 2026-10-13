"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// One fetch per page load, shared by every comment box on the page.
let peoplePromise: Promise<string[]> | null = null;
export function loadPeople(): Promise<string[]> {
  peoplePromise ??= fetch("/api/people")
    .then((r) => (r.ok ? r.json() : { people: [] }))
    .then((d) => (d.people ?? []) as string[])
    .catch(() => {
      peoplePromise = null;
      return [];
    });
  return peoplePromise;
}

/** The "@par" being typed just before the caret, if any. */
function activeQuery(value: string, caret: number): { start: number; query: string } | null {
  const m = /(^|[\s(])@([a-z0-9._-]*)$/i.exec(value.slice(0, caret));
  if (!m) return null;
  return { start: caret - m[2].length - 1, query: m[2].toLowerCase() };
}

export function MentionTextarea({
  value,
  onChange,
  currentUser,
  className,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  currentUser: string | null;
  className?: string;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [people, setPeople] = useState<string[]>([]);
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadPeople().then(setPeople);
  }, []);

  const q = dismissed ? null : activeQuery(value, caret);
  const matches = useMemo(() => {
    if (!q) return [];
    return people
      .filter((e) => e !== currentUser?.toLowerCase())
      .filter((e) => e.split("@")[0].toLowerCase().includes(q.query))
      .sort((a, b) => {
        // Names starting with what was typed come first.
        const as = a.startsWith(q.query) ? 0 : 1;
        const bs = b.startsWith(q.query) ? 0 : 1;
        return as - bs || a.localeCompare(b);
      })
      .slice(0, 6);
  }, [people, q, currentUser]);

  function pick(email: string) {
    if (!q) return;
    const insert = `@${email.split("@")[0]} `;
    const next = value.slice(0, q.start) + insert + value.slice(caret);
    const pos = q.start + insert.length;
    onChange(next);
    setCaret(pos);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(pos, pos);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pick(matches[Math.min(active, matches.length - 1)]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDismissed(true);
    }
  }

  return (
    <div className="relative">
      <textarea
        {...rest}
        ref={ref}
        value={value}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setCaret(e.target.selectionStart);
          setActive(0);
          setDismissed(false);
        }}
        onKeyDown={onKeyDown}
        onKeyUp={(e) => setCaret(e.currentTarget.selectionStart)}
        onClick={(e) => setCaret(e.currentTarget.selectionStart)}
      />
      {matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-20 rounded-md border border-[rgba(50,43,95,0.12)] bg-white shadow-lg py-1 max-h-56 overflow-auto"
        >
          {matches.map((email, i) => (
            <li
              key={email}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: click would fire after the textarea has already blurred.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(email);
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-1.5 cursor-pointer text-[13px] text-brand-primary ${
                i === active ? "bg-[rgba(50,43,95,0.06)]" : ""
              }`}
            >
              <span className="font-semibold">@{email.split("@")[0]}</span>
              <span className="opacity-40 ml-2">{email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
