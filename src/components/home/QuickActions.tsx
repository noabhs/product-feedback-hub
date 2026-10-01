"use client";
import { useState } from "react";
import Link from "next/link";
import { Building2, Swords, BookOpen, Layers, ArrowRight } from "lucide-react";
import { BriefModal, type BriefKind } from "@/components/home/BriefModal";

const BOX = "block w-full text-left bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5 h-full group hover:border-brand-secondary-500/30 hover:shadow-sm transition-all cursor-pointer";

function Box({ title, sub, Icon }: { title: string; sub: string; Icon: React.FC<{ className?: string }> }) {
  return (
    <>
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-5 h-5 text-brand-primary opacity-30 group-hover:opacity-60 transition-opacity" />
        <ArrowRight className="w-3.5 h-3.5 text-brand-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-[14px] font-semibold text-brand-primary">{title}</div>
      <div className="text-[11.5px] text-brand-primary opacity-40 mt-0.5">{sub}</div>
    </>
  );
}

const BRIEFS: { kind: BriefKind; title: string; sub: string; Icon: React.FC<{ className?: string }> }[] = [
  { kind: "client", title: "Generate client brief", sub: "Everything we know about one account", Icon: Building2 },
  { kind: "competitor", title: "Generate competitor brief", sub: "Positioning and claims, plus the latest from the web", Icon: Swords },
  { kind: "area", title: "Generate product area brief", sub: "Feedback and market view for one or more areas", Icon: Layers },
];

export function QuickActions() {
  const [open, setOpen] = useState<BriefKind | null>(null);
  const [client, competitor, area] = BRIEFS;

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <button type="button" className={BOX} onClick={() => setOpen(client.kind)}><Box {...client} /></button>
        <button type="button" className={BOX} onClick={() => setOpen(competitor.kind)}><Box {...competitor} /></button>
        <Link href="/discovery/generate" className={BOX}>
          <Box title="Generate discovery doc" sub="Questions and context for a discovery call" Icon={BookOpen} />
        </Link>
        <button type="button" className={BOX} onClick={() => setOpen(area.kind)}><Box {...area} /></button>
      </div>
      {open && <BriefModal key={open} kind={open} onClose={() => setOpen(null)} />}
    </>
  );
}
