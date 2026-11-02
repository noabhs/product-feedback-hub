import Link from "next/link";
import { StartChatBox } from "@/components/ask/StartChatBox";
import type { ConversationListItem } from "@/lib/ask-conversation";

/** How many earlier chats to hint at; the rest are behind "All chats". */
const RECENT = 3;

/**
 * The home page's way into "Q" — over the whole hub (feedback, competitors,
 * feature requests, the client table, the domain notes). Asking creates a chat
 * and opens it on /ask/[id], where the answer can be followed up. Kept to one
 * input and a line of earlier chats: this is the first thing on the page, and
 * the quick actions below it already offer plenty to look at.
 */
export function QAsk({ recent = [] }: { recent?: ConversationListItem[] }) {
  const shown = recent.slice(0, RECENT);
  return (
    <div>
      <StartChatBox compact />

      {shown.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-6 text-[12.5px] text-brand-primary/50">
          {shown.map((c) => (
            <Link
              key={c.id}
              href={`/ask/${c.id}`}
              title={c.title}
              className="max-w-[16rem] truncate transition-colors hover:text-brand-secondary-600"
            >
              {c.title}
            </Link>
          ))}
          <Link href="/ask" className="font-medium text-brand-secondary-600 hover:text-brand-secondary-500">
            All chats →
          </Link>
        </p>
      )}
    </div>
  );
}
