"use client";
import { useState } from "react";
import Link from "next/link";
import { Building2, Swords, BookOpen, Layers, Plug, ArrowRight, GraduationCap } from "lucide-react";
import { BriefModal, type BriefKind } from "@/components/home/BriefModal";

const BOX = "block w-full text-left bg-white rounded-lg border border-brand-secondary-500/25 shadow-sm p-5 h-full group hover:border-brand-secondary-500 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer";

function Box({ title, sub, Icon }: { title: string; sub: string; Icon: React.FC<{ className?: string }> }) {
  return (
    <>
      <div className="flex items-start justify-between mb-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-secondary-500/10 text-brand-secondary-600 group-hover:bg-brand-secondary-500 group-hover:text-white transition-colors">
          <Icon className="w-5 h-5" />
        </span>
        <ArrowRight className="w-4 h-4 text-brand-secondary-500 opacity-40 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-[15px] font-bold text-brand-primary">{title}</div>
      <div className="text-[12px] text-brand-primary opacity-60 mt-1">{sub}</div>
    </>
  );
}

const BRIEFS: { kind: BriefKind; title: string; sub: string; Icon: React.FC<{ className?: string }> }[] = [
  { kind: "client", title: "Generate client brief", sub: "Everything we know about one account", Icon: Building2 },
  { kind: "competitor", title: "Generate competitor brief", sub: "Positioning and claims, plus the latest from the web", Icon: Swords },
  { kind: "area", title: "Generate product area brief", sub: "Feedback and market view for one or more areas", Icon: Layers },
  { kind: "domain", title: "Know your domain brief", sub: "A plain-language brief on the topics you pick", Icon: GraduationCap },
];

export function QuickActions({ canSendToSlack = false }: { canSendToSlack?: boolean }) {
  const [open, setOpen] = useState<BriefKind | null>(null);
  const [client, competitor, area, domain] = BRIEFS;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <button type="button" className={BOX} onClick={() => setOpen(client.kind)}><Box {...client} /></button>
        <button type="button" className={BOX} onClick={() => setOpen(competitor.kind)}><Box {...competitor} /></button>
        <Link href="/discovery/generate" className={BOX}>
          <Box title="Generate discovery doc" sub="Questions and context for a discovery call" Icon={BookOpen} />
        </Link>
        <button type="button" className={BOX} onClick={() => setOpen(area.kind)}><Box {...area} /></button>
        <button type="button" className={BOX} onClick={() => setOpen(domain.kind)}><Box {...domain} /></button>
        <Link href="/connect-claude" className={BOX}>
          <Box title="Use hub data in my Claude" sub="Connect your personal Claude to the raw data" Icon={Plug} />
        </Link>
      </div>
      {open && <BriefModal key={open} kind={open} canSendToSlack={canSendToSlack} onClose={() => setOpen(null)} />}
    </>
  );
}
