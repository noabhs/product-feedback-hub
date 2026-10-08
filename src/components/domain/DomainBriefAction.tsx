"use client";
import { useState } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";
import { BriefModal } from "@/components/home/BriefModal";

/**
 * The home page's "Know your domain brief" action, offered here too: the person
 * reading the topics is the one most likely to want a brief on a few of them.
 * Same modal, same endpoint, so the two entry points can't drift apart.
 */
export function DomainBriefAction({ canSendToSlack = false }: { canSendToSlack?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-full w-full flex-col justify-between rounded-lg border border-brand-secondary-500/25 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-secondary-500 hover:shadow-md cursor-pointer"
      >
        <span className="mb-3 flex items-start justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-secondary-500/10 text-brand-secondary-600 transition-colors group-hover:bg-brand-secondary-500 group-hover:text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <ArrowRight className="h-4 w-4 text-brand-secondary-500 opacity-40 transition-opacity group-hover:opacity-100" />
        </span>
        <span>
          <span className="block text-[15px] font-bold text-brand-primary">Generate a brief</span>
          <span className="mt-1 block text-[12.5px] text-brand-primary/60">
            Pick up to four topics and get a plain-language brief to read, copy or send.
          </span>
        </span>
      </button>
      {open && <BriefModal kind="domain" canSendToSlack={canSendToSlack} onClose={() => setOpen(false)} />}
    </>
  );
}
