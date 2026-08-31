export const dynamic = "force-dynamic";

import { Info, MessageSquare, Sparkles, ThumbsDown } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/people";
import { AskLogList, type AskRow } from "@/components/feedback-insights/AskLogList";
import type { Rating } from "@/components/ask/RateAnswer";

/** Enough history to be useful without loading a year of rows into one page. */
const LIMIT = 300;

async function loadAsks(showAskers: boolean) {
  const [rows, total] = await Promise.all([
    prisma.askLog.findMany({ orderBy: { createdAt: "desc" }, take: LIMIT }),
    prisma.askLog.count(),
  ]);

  // Every cited id in one query. The IN list is bounded by the size of the
  // insight corpus, not by the number of questions, so it stays small.
  const citedBy = new Map(rows.map((r) => [r.id, JSON.parse(r.sourceIds) as string[]]));
  const ids = [...new Set([...citedBy.values()].flat())];
  const insights = ids.length
    ? await prisma.insight.findMany({
        where: { id: { in: ids } },
        select: { id: true, oneLiner: true, client: true },
      })
    : [];
  const byId = new Map(insights.map((i) => [i.id, i]));

  const items: AskRow[] = rows.map((r) => ({
    id: r.id,
    // Withheld on the server rather than hidden in the UI: for everyone but the
    // owner, the name never reaches the browser at all.
    actor: showAskers ? r.actor : null,
    question: r.question,
    answer: r.answer,
    matchedCount: r.matchedCount,
    rating: r.rating as Rating,
    ratingNote: r.ratingNote,
    createdAt: r.createdAt.toISOString(),
    sources: (citedBy.get(r.id) ?? [])
      .map((id) => byId.get(id))
      .filter((i): i is { id: string; oneLiner: string; client: string | null } => !!i),
  }));

  const rated = rows.filter((r) => r.rating !== null).length;
  const bad = rows.filter((r) => r.rating === "down").length;

  return { items, total, rated, bad, missed: rows.filter((r) => r.matchedCount === 0).length };
}

export default async function FeedbackInsightsPage() {
  const session = await auth();
  const showAskers = isOwner(session?.user?.email);
  const { items, total, rated, bad, missed } = await loadAsks(showAskers);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold text-brand-primary mb-2">Feedback insights log</h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            Every question the team has asked of the feedback, and the answer it got — shared, so
            nobody has to re-ask what someone already answered. Rate the answers you read: a thumb
            with a reason is what tells us which questions the hub still answers badly, and it is how
            these answers get better over time.
          </p>
        </div>

        <div className="flex items-start gap-2.5 mb-6 rounded-lg border border-[rgba(50,43,95,0.1)] bg-[rgba(93,7,226,0.03)] px-4 py-3">
          <Info className="w-4 h-4 text-brand-secondary-600 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-brand-primary opacity-70 leading-relaxed">
            Questions and answers are visible to everyone signed in with a Navina account.
            {showAskers
              ? " You can see who asked each one — nobody else can."
              : " Who asked is not shown."}{" "}
            Anyone can rate any answer.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <Kpi value={total} label="Questions asked" sub={total > LIMIT ? `showing latest ${LIMIT}` : "all time"} Icon={MessageSquare} />
          <Kpi
            value={rated}
            label="Answers rated"
            sub={items.length ? `${Math.round((rated / items.length) * 100)}% of those shown` : "none yet"}
            Icon={Sparkles}
          />
          <Kpi value={bad} label="Rated bad" sub={`${missed} found no sources`} Icon={ThumbsDown} />
        </div>

        {/* Same gate as the asker names, and enforced again in the DELETE route. */}
        <AskLogList rows={items} showAskers={showAskers} canDelete={showAskers} />
      </div>
    </div>
  );
}

function Kpi({
  value,
  label,
  sub,
  Icon,
}: {
  value: number;
  label: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-4">
      <div className="flex items-start justify-between">
        <p className="text-[26px] font-extrabold text-brand-primary leading-none tabular-nums">
          {value.toLocaleString()}
        </p>
        <Icon className="w-4 h-4 text-brand-secondary-500 opacity-60" />
      </div>
      <p className="text-[13px] font-medium text-brand-primary mt-2">{label}</p>
      <p className="text-[11.5px] text-brand-primary opacity-40">{sub}</p>
    </div>
  );
}
