import Link from "next/link";
import {
  ArrowRight, BookA, Scale, Network, Wallet, Gauge, Star, Hospital, Landmark,
  Stethoscope, Share2,
} from "lucide-react";
import { TOPICS } from "@/lib/domain/topics";
import { GLOSSARY, termId } from "@/lib/domain/glossary";
import { DraftNotice, SectionLabel } from "@/components/domain/parts";
import { DomainBriefAction } from "@/components/domain/DomainBriefAction";
import { auth } from "@/auth";
import { isOwner } from "@/lib/people";

export const metadata = { title: "Know your domain · Navina Product Insights Hub" };

/**
 * A face per topic, so the grid reads as a map of the domain rather than nine
 * identical boxes. Keyed by slug and kept here rather than on the Topic type:
 * it is presentation, and the content files stay about content.
 */
const TOPIC_STYLE: Record<string, { Icon: typeof Scale; tint: string }> = {
  "vbc-fundamentals": { Icon: Scale, tint: "bg-violet-100 text-violet-700" },
  "care-organizations": { Icon: Network, tint: "bg-sky-100 text-sky-700" },
  "insurance-models": { Icon: Wallet, tint: "bg-emerald-100 text-emerald-700" },
  "risk-adjustment": { Icon: Gauge, tint: "bg-amber-100 text-amber-700" },
  "quality-and-stars": { Icon: Star, tint: "bg-rose-100 text-rose-700" },
  "utilization-and-cost": { Icon: Hospital, tint: "bg-teal-100 text-teal-700" },
  "cms-and-regulation": { Icon: Landmark, tint: "bg-indigo-100 text-indigo-700" },
  "clinic-roles": { Icon: Stethoscope, tint: "bg-orange-100 text-orange-700" },
  "data-and-interoperability": { Icon: Share2, tint: "bg-cyan-100 text-cyan-700" },
};

const FALLBACK = { Icon: BookA, tint: "bg-lavender text-brand-primary" };

/** The terms people actually arrive looking for — a way in that isn't a search box. */
const POPULAR = ["RAF score", "HCC", "ACO", "MSO", "Star Ratings", "Care gap", "PMPM", "MEAT"];

export default async function KnowYourDomainPage() {
  const session = await auth();
  const ready = TOPICS.filter((t) => t.status === "ready");
  const planned = TOPICS.filter((t) => t.status === "planned");
  const links = TOPICS.reduce((n, t) => n + t.resources.length, 0);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-extrabold text-brand-primary mb-2 leading-tight">Know your domain</h1>
            <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
              The healthcare vocabulary and concepts behind Navina&apos;s work: value-based care, risk adjustment,
              quality, Star Ratings and more. Each topic has a short overview, a deeper dive, and links to
              internal and external material.
            </p>
            {/* What's actually in here, before anyone has to scroll to find out. */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {[
                `${ready.length} topics`,
                `${GLOSSARY.length} glossary terms`,
                `${links} linked sources`,
              ].map((stat) => (
                <span
                  key={stat}
                  className="rounded-pill bg-white border border-[rgba(50,43,95,0.1)] px-3 py-1 text-[12px] font-medium text-brand-primary/70"
                >
                  {stat}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0">
            <DomainBriefAction canSendToSlack={isOwner(session?.user?.email)} />
          </div>
        </div>

        <DraftNotice />

        <div className="rounded-lg bg-white border border-[rgba(50,43,95,0.08)] p-5 mb-8">
          <Link href="/know-your-domain/glossary" className="group flex items-center justify-between gap-4">
            <span className="flex items-center gap-4">
              <span className="w-10 h-10 rounded-sm bg-lavender flex items-center justify-center shrink-0">
                <BookA className="w-5 h-5 text-brand-primary" />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-brand-primary group-hover:text-brand-secondary-500">
                  Glossary
                </span>
                <span className="block text-[13px] text-brand-primary/60">
                  Search {GLOSSARY.length} terms with plain-language explanations, sources and links to related terms.
                </span>
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-brand-secondary-500 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
          {/* Straight to a definition: the glossary opens with this term expanded. */}
          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[rgba(50,43,95,0.06)]">
            {POPULAR.map((term) => (
              <Link
                key={term}
                href={`/know-your-domain/glossary#${termId(term)}`}
                className="rounded-pill border border-[rgba(50,43,95,0.12)] px-2.5 py-1 text-[12px] text-brand-primary/70 hover:border-brand-secondary-500 hover:text-brand-secondary-600 transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>

        <SectionLabel>Topics</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-8">
          {ready.map((t) => {
            const { Icon, tint } = TOPIC_STYLE[t.slug] ?? FALLBACK;
            return (
              <Link
                key={t.slug}
                href={`/know-your-domain/${t.slug}`}
                className="group flex flex-col rounded-lg bg-white border border-[rgba(50,43,95,0.08)] p-5 hover:border-brand-secondary-500/30 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <ArrowRight className="w-4 h-4 text-brand-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-[16px] font-semibold text-brand-primary mb-1 group-hover:text-brand-secondary-500">
                  {t.title}
                </h3>
                <p className="text-[13.5px] text-brand-primary/70 mb-3">{t.tagline}</p>
                {/* Three concept titles, so a card says what is inside it rather
                    than only how much is inside it. */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {t.concepts.slice(0, 3).map((c) => (
                    <span
                      key={c.title}
                      className="rounded-pill bg-[rgba(50,43,95,0.04)] px-2 py-0.5 text-[11.5px] text-brand-primary/60"
                    >
                      {c.title}
                    </span>
                  ))}
                </div>
                <p className="text-[12px] text-brand-primary/50 mt-auto">
                  {t.concepts.length} key concepts · {t.deepDive.length} deep-dive sections · {t.resources.length} links
                </p>
              </Link>
            );
          })}
        </div>

        {planned.length > 0 && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
