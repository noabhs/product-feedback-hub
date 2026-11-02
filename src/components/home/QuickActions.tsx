"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Swords, BookOpen, Layers, Plug, ArrowRight, GraduationCap, CalendarClock, Wrench, Network, FileText } from "lucide-react";
import { BriefModal, type BriefKind } from "@/components/home/BriefModal";
import { BriefTypeModal, type BriefType } from "@/components/home/BriefTypeModal";
import { SkillsModal } from "@/components/home/SkillsModal";

const BOX = "block w-full text-left bg-white rounded-lg border border-brand-secondary-500/25 shadow-sm p-4 h-full group hover:border-brand-secondary-500 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer";

/** Icon and title on one line, description under them — a row shorter than
 *  stacking the icon above the title, which is what made these cards tall. */
function Box({ title, sub, Icon, tint }: { title: string; sub: string; Icon: React.FC<{ className?: string }>; tint: string }) {
  return (
    <div className="flex items-start gap-3">
      {/* A colour per action rather than eight lavender squares: the grid then
          reads at a glance as eight different things, which is what it is. */}
      <span className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors ${tint}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[14.5px] font-bold text-brand-primary leading-snug">{title}</span>
          <ArrowRight className="w-4 h-4 mt-0.5 shrink-0 text-brand-secondary-500 opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="text-[12px] text-brand-primary opacity-60 mt-1 leading-snug">{sub}</div>
      </div>
    </div>
  );
}

const BRIEF_TYPES: BriefType[] = [
  { id: "client", title: "Client brief", sub: "Everything we know about one account", Icon: Building2, tint: "bg-sky-100 text-sky-700" },
  { id: "competitor", title: "Competitor brief", sub: "Positioning and claims, plus the latest from the web", Icon: Swords, tint: "bg-rose-100 text-rose-700" },
  { id: "area", title: "Product area brief", sub: "Feedback and market view for one or more areas", Icon: Layers, tint: "bg-violet-100 text-violet-700" },
  { id: "domain", title: "Know your domain brief", sub: "A plain-language brief on the topics you pick", Icon: GraduationCap, tint: "bg-indigo-100 text-indigo-700" },
  { id: "discovery", title: "Discovery doc", sub: "Questions and context for a discovery call", Icon: BookOpen, tint: "bg-emerald-100 text-emerald-700" },
];

/** The R&D map is a published Claude artifact, kept up to date from the Product & R&D Map sheet. */
const RND_MAP_URL = "https://claude.ai/artifact/2Q3AhdGpmqQSBrXSDJRtyS?sk=WJzqHnk9S5sGB5heJ9jK1w";

export function QuickActions({ canSendToSlack = false }: { canSendToSlack?: boolean }) {
  const router = useRouter();
  const [choosing, setChoosing] = useState(false);
  const [open, setOpen] = useState<BriefKind | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);

  function pick(t: BriefType) {
    setChoosing(false);
    if (t.id === "discovery") router.push("/discovery/generate");
    else setOpen(t.id);
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button type="button" className={BOX} onClick={() => setChoosing(true)}>
          <Box title="Generate brief" sub="Client, competitor, product area, domain or discovery doc" Icon={FileText} tint="bg-violet-100 text-violet-700" />
        </button>
        <Link href="/connect-claude" className={BOX}>
          <Box title="Use hub data in my Claude" sub="Connect your personal Claude to the raw data" Icon={Plug} tint="bg-amber-100 text-amber-700" />
        </Link>
        <Link href="/daily-briefs" className={BOX}>
          <Box title="Daily client briefs in Slack" sub="Get a brief before each external meeting. Set up in 5 minutes" Icon={CalendarClock} tint="bg-teal-100 text-teal-700" />
        </Link>
        <button type="button" className={BOX} onClick={() => setSkillsOpen(true)}>
          <Box title="Useful skills for PMs" sub="Claude skills for specs, handoffs, ideas and announcements" Icon={Wrench} tint="bg-orange-100 text-orange-700" />
        </button>
        <a href={RND_MAP_URL} target="_blank" rel="noreferrer" className={BOX}>
          <Box title="Product R&D working map" sub="Teams, squads and who owns what. Opens in Claude" Icon={Network} tint="bg-lime-100 text-lime-700" />
        </a>
      </div>
      {choosing && <BriefTypeModal types={BRIEF_TYPES} onPick={pick} onClose={() => setChoosing(false)} />}
      {skillsOpen && <SkillsModal onClose={() => setSkillsOpen(false)} />}
      {open && <BriefModal
          key={open}
          kind={open}
          canSendToSlack={canSendToSlack}
          onBack={() => { setOpen(null); setChoosing(true); }}
          onClose={() => setOpen(null)}
        />}
    </>
  );
}
