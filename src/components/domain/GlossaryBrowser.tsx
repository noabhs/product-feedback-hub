"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { clsx } from "clsx";
import { Input } from "@/components/ui/Input";
import { GLOSSARY, termId } from "@/lib/domain/glossary";
import { TOPICS } from "@/lib/domain/topics";
import { useUrlReader, useUrlState } from "@/hooks/useUrlState";
import { ResourceList, TopicPill } from "@/components/domain/parts";

const topicTitle = (slug: string) => TOPICS.find((t) => t.slug === slug)?.title ?? slug;

export function GlossaryBrowser() {
  const url = useUrlReader();
  const [search, setSearch] = useState(url.str("search"));
  const [topic, setTopic] = useState(url.str("topic"));
  // Opened by a #anchor link from a topic page, or by clicking a row.
  const [open, setOpen] = useState<string | null>(null);

  useUrlState({ search, topic });

  // The anchor is only readable in the browser, so the row is opened from a
  // timer callback after mount rather than from the effect body.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const t = setTimeout(() => {
      setOpen(hash);
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "center" }));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GLOSSARY.filter((g) => {
      if (topic && !g.topics.includes(topic)) return false;
      if (!q) return true;
      return (
        g.term.toLowerCase().includes(q) ||
        (g.expansion ?? "").toLowerCase().includes(q) ||
        g.short.toLowerCase().includes(q) ||
        g.explanation.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [search, topic]);

  // Letters that have at least one term, for the jump strip.
  const letters = useMemo(
    () => Array.from(new Set(filtered.map((g) => g.term[0].toUpperCase()))),
    [filtered],
  );

  const openTerm = (id: string) => {
    setOpen((cur) => (cur === id ? null : id));
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
  };

  return (
    <div>
      <div className="mb-4">
        <Input
          icon={<Search className="w-4 h-4" />}
          placeholder="Search terms, acronyms or definitions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search glossary"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[{ slug: "", title: "All topics" }, ...TOPICS.filter((t) => GLOSSARY.some((g) => g.topics.includes(t.slug)))].map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setTopic(t.slug)}
            className={clsx(
              "px-3 py-1 rounded-pill text-[12.5px] font-medium border transition-colors cursor-pointer",
              topic === t.slug
                ? "bg-brand-secondary-500 text-white border-brand-secondary-500"
                : "bg-white text-brand-primary border-[rgba(50,43,95,0.12)] hover:border-brand-secondary-500",
            )}
          >
            {t.title}
          </button>
        ))}
      </div>

      <p className="text-[12px] text-brand-primary/50 mb-3">
        {filtered.length} {filtered.length === 1 ? "term" : "terms"}
        {letters.length > 1 && <span className="ml-3 tracking-widest">{letters.join(" ")}</span>}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg bg-white border border-[rgba(50,43,95,0.08)] p-6 text-[14px] text-brand-primary/70">
          No terms match. Try a shorter search, or clear the topic filter. If a term is missing, it may
          not have been written yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((g) => {
            const id = termId(g.term);
            const isOpen = open === id;
            return (
              <li
                key={g.term}
                id={id}
                className={clsx(
                  "rounded-lg bg-white border transition-all scroll-mt-6",
                  isOpen ? "border-brand-secondary-500/40 shadow-sm" : "border-[rgba(50,43,95,0.08)]",
                )}
              >
                <button
                  type="button"
                  onClick={() => openTerm(id)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-5 py-3.5 cursor-pointer"
                >
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[15px] font-semibold text-brand-primary">{g.term}</span>
                    {g.expansion && <span className="text-[12.5px] text-brand-primary/50">{g.expansion}</span>}
                  </span>
                  <span className="block text-[13.5px] text-brand-primary/75 mt-0.5">{g.short}</span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-[rgba(50,43,95,0.06)] pt-4">
                    <p className="text-[14px] text-brand-primary/85 leading-relaxed mb-4">{g.explanation}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {g.topics.map((s) => (
                        <Link key={s} href={`/know-your-domain/${s}`}>
                          <TopicPill title={topicTitle(s)} className="hover:bg-brand-secondary-500 hover:text-white transition-colors" />
                        </Link>
                      ))}
                    </div>

                    {g.seeAlso && g.seeAlso.length > 0 && (
                      <p className="text-[13px] text-brand-primary/70 mb-4">
                        <span className="font-semibold text-brand-primary">See also: </span>
                        {g.seeAlso.map((t, i) => {
                          const exists = GLOSSARY.some((x) => x.term === t);
                          return (
                            <span key={t}>
                              {i > 0 && ", "}
                              {exists ? (
                                <a
                                  href={`#${termId(t)}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSearch("");
                                    setTopic("");
                                    openTerm(termId(t));
                                    setTimeout(() => document.getElementById(termId(t))?.scrollIntoView({ block: "center" }), 50);
                                  }}
                                  className="text-brand-secondary-600 hover:underline"
                                >
                                  {t}
                                </a>
                              ) : (
                                // Terms still to be written show as plain text, not a dead link.
                                <span>{t}</span>
                              )}
                            </span>
                          );
                        })}
                      </p>
                    )}

                    {g.sources.length > 0 && <ResourceList resources={g.sources} />}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
