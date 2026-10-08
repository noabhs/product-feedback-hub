"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BriefModal } from "@/components/home/BriefModal";

/**
 * The home page's "Know your domain brief" action, offered here too: the person
 * reading the topics is the one most likely to want a brief on a few of them.
 * Same modal, same endpoint, so the two entry points can't drift apart.
 *
 * Drawn as a header button rather than a card, to match the brief actions on
 * Clients and Competitors — one kind of control for one kind of thing.
 */
export function DomainBriefAction({ canSendToSlack = false }: { canSendToSlack?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="w-4 h-4" />
        Generate domain brief
      </Button>
      {open && <BriefModal kind="domain" canSendToSlack={canSendToSlack} onClose={() => setOpen(false)} />}
    </>
  );
}
