import Link from "next/link";
import { ArrowRight, BookA } from "lucide-react";
import { TOPICS } from "@/lib/domain/topics";
import { GLOSSARY } from "@/lib/domain/glossary";
import { DraftNotice, SectionLabel } from "@/components/domain/parts";

export const metadata = { title: "Know your domain · Navina Product Insights Hub" };

export default function KnowYourDomainPage() {
  const ready = TOPICS.filter((t) => t.status === "ready");
  const planned = TOPICS.filter((t) => t.status === "planned");

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="text-[30px] font-extrabold text-brand-primary mb-2 leading-tight">Know your domain</h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            The healthcare vocabulary and concepts behind Navina&apos;s work: value-based care, risk adjustment,
            quality, Star Ratings and more. Each topic has a short overview, a deeper dive, and links to
            internal and external material.
          </p>
        </div>

        <DraftNotice />

        <Link
          href="/know-your-domain/glossary"
          className="group flex items-center justify-between gap-4 rounded-lg bg-white border border-[rgba(50,43,95,0.08)] p-5 mb-8 hover:border-brand-secondary-500/30 hover:shadow-sm transition-all"
        >
          <span className="flex items-center gap-4">
            <span className="w-10 h-10 rounded-sm bg-lavender flex items-center justify-center shrink-0">
              <BookA className="w-5 h-5 text-brand-primary" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold text-brand-primary">Glossary</span>
              <span className="block text-[13px] text-brand-primary/60">
                Search {GLOSSARY.length} terms so far, with plain-language explanations. More are added topic by topic.
              </span>
            </span>
          </span>
          <ArrowRight className="w-4 h-4 text-brand-secondary-500 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>

        <SectionLabel>Start here</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {ready.map((t) => (
            <Link
              key={t.slug}
              href={`/know-your-domain/${t.slug}`}
              className="group rounded-lg bg-white border border-[rgba(50,43,95,0.08)] p-5 hover:border-brand-secondary-500/30 hover:shadow-sm transition-all"
            >
              <h3 className="text-[16px] font-semibold text-brand-primary mb-1 group-hover:text-brand-secondary-500">
                {t.title}
              </h3>
              <p className="text-[13.5px] text-brand-primary/70 mb-3">{t.tagline}</p>
              <p className="text-[12px] text-brand-primary/50">
                {t.concepts.length} key concepts · {t.deepDive.length} deep-dive sections · {t.resources.length} links
              </p>
            </Link>
          ))}
        </div>

        <SectionLabel>Coming next</SectionLabel>
        <div className="grid gap-3 md:grid-cols-3">
          {planned.map((t) => (
            <Link
              key={t.slug}
              href={`/know-your-domain/${t.slug}`}
              className="rounded-lg bg-white/60 border border-dashed border-[rgba(50,43,95,0.18)] p-4 hover:border-brand-secondary-500/40 transition-all"
            >
              <h3 className="text-[14px] font-semibold text-brand-primary mb-1">{t.title}</h3>
              <p className="text-[12.5px] text-brand-primary/60">{t.tagline}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
