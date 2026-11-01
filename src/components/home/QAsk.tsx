import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StartChatBox } from "@/components/ask/StartChatBox";
import { QAvatar } from "@/components/home/QAvatar";
import type { ConversationListItem } from "@/lib/ask-conversation";

/**
 * The home page's way into "Q" — over the whole hub (feedback, competitors,
 * feature requests, the client table, the domain notes). It no longer answers
 * in place: asking creates a chat and opens it on /ask/[id], where the answer
 * can be followed up. The person's most recent chats sit underneath, so picking
 * one back up is a click from here.
 */
export function QAsk({ recent = [] }: { recent?: ConversationListItem[] }) {
  return (
    <div className="rounded-lg border border-[rgba(50,43,95,0.08)] bg-white p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <QAvatar />
        <h2 className="text-[14px] font-semibold leading-tight text-brand-primary">Ask Q</h2>
      </div>

      <StartChatBox examples={false} />

      {recent.length > 0 && (
        <div className="mt-4 border-t border-[rgba(50,43,95,0.08)] pt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-brand-primary/40">Recent chats</p>
            <Link
              href="/ask"
              className="flex items-center gap-1 text-[12px] font-medium text-brand-secondary-600 hover:text-brand-secondary-500"
            >
              All chats
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col">
            {recent.map((c) => (
              <Link
                key={c.id}
                href={`/ask/${c.id}`}
                className="flex items-center gap-3 rounded-sm px-1 py-1.5 text-[13px] text-brand-primary/80 transition-colors hover:text-brand-secondary-600"
              >
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <span className="shrink-0 text-[11.5px] text-brand-primary/40">
                  {new Date(c.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
