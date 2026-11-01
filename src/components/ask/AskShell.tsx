"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { History, X } from "lucide-react";
import { ConversationSidebar } from "@/components/ask/ConversationSidebar";
import type { ConversationListItem } from "@/lib/ask-conversation";

/**
 * History beside the chat from md up; below that, a bar with a "History" button
 * that opens the same list over the chat, closing again once a chat is picked.
 */
export function AskShell({
  conversations,
  children,
}: {
  conversations: ConversationListItem[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <div className="relative flex h-full min-h-0">
      <aside className="hidden w-64 shrink-0 border-r border-[rgba(50,43,95,0.08)] bg-[rgba(50,43,95,0.015)] md:block">
        <ConversationSidebar conversations={conversations} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center border-b border-[rgba(50,43,95,0.08)] px-3 py-2 md:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-expanded={open}
            className="flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-[13px] font-medium text-brand-primary/70 hover:bg-[rgba(50,43,95,0.05)]"
          >
            <History className="h-4 w-4" />
            History
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>

      {open && (
        <div className="absolute inset-0 z-20 flex md:hidden">
          <div className="w-72 max-w-[85%] bg-surface-app shadow-xl">
            <div className="flex justify-end px-2 pt-2">
              <button aria-label="Close history" onClick={() => setOpen(false)} className="p-2 text-brand-primary/60">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ConversationSidebar conversations={conversations} />
          </div>
          <button aria-label="Close history" className="flex-1 bg-black/30" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
