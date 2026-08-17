export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/Badge";
import { Comments } from "@/components/insights/Comments";
import { ExternalLink, ArrowLeft } from "lucide-react";

export default async function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [insight, session] = await Promise.all([
    prisma.insight.findUnique({ where: { id } }),
    auth(),
  ]);
  if (!insight) notFound();

  const dateStr = insight.date
    ? new Date(insight.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  const addedStr = insight.createdAt.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/insights" className="inline-flex items-center gap-1.5 text-[13px] text-brand-primary opacity-50 hover:opacity-100 mb-6 transition-opacity">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to feedback
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-wrap gap-2 mb-5">
          <Badge type="area" value={insight.productArea} />
          <Badge type="theme" value={insight.theme} />
        </div>

        <h1 className="text-[22px] font-bold text-brand-primary mb-6 leading-snug">{insight.oneLiner}</h1>

        <div className="prose prose-sm max-w-none text-brand-primary/80 text-[15px] leading-relaxed mb-8 whitespace-pre-wrap">
          {insight.content}
        </div>

        <div className="border-t border-[rgba(50,43,95,0.08)] pt-5 grid grid-cols-2 gap-4">
          {insight.client && (
            <div>
              <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1">Client</p>
              <p className="text-[14px] font-semibold text-brand-secondary-600">{insight.client}</p>
            </div>
          )}
          {insight.persona && (
            <div>
              <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1">Persona</p>
              <p className="text-[14px] text-brand-primary">{insight.persona}</p>
            </div>
          )}
          {dateStr && (
            <div>
              <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1">Date</p>
              <p className="text-[14px] text-brand-primary">{dateStr}</p>
            </div>
          )}
          {insight.sourceName && (
            <div>
              <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1">Source</p>
              {insight.sourceUrl ? (
                <a href={insight.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[14px] text-brand-secondary-600 hover:underline">
                  {insight.sourceName} <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-[14px] text-brand-primary">{insight.sourceName}</p>
              )}
            </div>
          )}
          {insight.wtp && (
            <div>
              <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1">WTP</p>
              <p className="text-[14px] text-brand-primary">{insight.wtp}</p>
            </div>
          )}
        </div>

        {/* Provenance — who logged this and when it landed in the hub */}
        <div className="border-t border-[rgba(50,43,95,0.08)] mt-5 pt-4">
          <p className="text-[12px] text-brand-primary opacity-40">
            {insight.createdBy ? `Added by ${insight.createdBy}` : "Imported"} · {addedStr}
          </p>
        </div>
      </div>

      <Comments insightId={insight.id} currentUser={session?.user?.email ?? null} />
    </div>
  );
}
