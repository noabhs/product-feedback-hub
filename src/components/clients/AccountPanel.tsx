"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { X, MessageSquare, AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { renewalWindow, renewalPhrase, atRenewalRisk, REPORT_AS_OF } from "@/lib/accounts";
import { fmtDay, money, moneyExact, members, dateInputValue } from "@/lib/format";
import type { AccountDetail } from "@/lib/types";

/**
 * Mounted with `key={account.id}` by the page, so switching accounts remounts
 * rather than needing an effect to reset the live-date draft — and so saving a
 * date doesn't clear the "Saved" confirmation it just set.
 */
interface AccountPanelProps {
  account: AccountDetail;
  /** Called with the saved live date so the row behind the panel updates too. */
  onLiveDateSaved: (id: string, liveDate: string | null) => void;
  onClose: () => void;
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1">{label}</p>
      {children}
    </div>
  );
}

/** A value, or a dash when the report had nothing for this account. */
function Value({ children }: { children: string | null }) {
  return children ? (
    <p className="text-[14px] text-brand-primary">{children}</p>
  ) : (
    <p className="text-[14px] text-brand-primary opacity-30">—</p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
      <h3 className="text-[13px] font-bold text-brand-primary mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function AccountPanel({ account, onLiveDateSaved, onClose }: AccountPanelProps) {
  const [liveDraft, setLiveDraft] = useState(dateInputValue(account.liveDate));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function saveLiveDate() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveDate: liveDraft || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save that date");
      onLiveDateSaved(account.id, data.liveDate);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Same thresholds as the table, from the same helper — the panel used to
  // compute its own and the two could drift apart.
  const phrase = renewalPhrase(account.renewalDate);
  const window = renewalWindow(account.renewalDate);
  const flagged = atRenewalRisk(account);
  const liveDirty = liveDraft !== dateInputValue(account.liveDate);
  // Only meaningful as a gap: CARR above ARR is contracted revenue not yet live.
  const carrGap =
    account.arr !== null && account.carr !== null && account.carr > account.arr
      ? account.carr - account.arr
      : null;
  const hasReportData = account.health !== null || account.arr !== null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />

      <aside
        role="dialog"
        aria-label={`${account.name} detail`}
        className="relative w-full max-w-[36rem] h-full bg-surface-app shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 px-6 py-4 bg-white border-b border-[rgba(50,43,95,0.1)]">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-brand-primary leading-snug">{account.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {account.health && <Badge type="health" value={account.health} />}
              {account.segment && (
                <span className="text-[12px] text-brand-primary opacity-50">{account.segment}</span>
              )}
              {account.ehr && (
                <span className="text-[12px] text-brand-primary opacity-50">· {account.ehr}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {!hasReportData && (
            <div className="rounded-md border border-[rgba(50,43,95,0.12)] bg-white px-4 py-3">
              <p className="text-[13px] text-brand-primary opacity-60">
                No account data for this one. The {REPORT_AS_OF} report covered active direct
                accounts only, so anything outside that — churned, indirect, or the internal
                advisory panel — shows up here as a name and nothing more.
              </p>
            </div>
          )}

          <Section title="Products">
            {account.products.length ? (
              <div className="flex flex-wrap gap-1.5">
                {account.products.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium bg-secondary-50 text-brand-secondary-600"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-brand-primary opacity-30">—</p>
            )}

            <div className="border-t border-[rgba(50,43,95,0.08)] mt-4 pt-4 grid grid-cols-3 gap-x-4">
              <Prop label="Risk members"><Value>{members(account.riskMembers)}</Value></Prop>
              <Prop label="Quality members"><Value>{members(account.qualityMembers)}</Value></Prop>
              <Prop label="HIE members"><Value>{members(account.hieMembers)}</Value></Prop>
            </div>
          </Section>

          <Section title="Contract">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Prop label="Current ARR">
                {account.arr !== null ? (
                  <p className="text-[18px] font-bold text-brand-primary tabular-nums" title={moneyExact(account.arr) ?? undefined}>
                    {money(account.arr)}
                  </p>
                ) : (
                  <p className="text-[14px] text-brand-primary opacity-30">—</p>
                )}
              </Prop>

              <Prop label="CARR">
                {account.carr !== null ? (
                  <>
                    <p className="text-[18px] font-bold text-brand-primary tabular-nums" title={moneyExact(account.carr) ?? undefined}>
                      {money(account.carr)}
                    </p>
                    {carrGap !== null && (
                      <p className="text-[11px] text-brand-secondary-600 opacity-80 mt-0.5">
                        {money(carrGap)} contracted, not yet live
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[14px] text-brand-primary opacity-30">—</p>
                )}
              </Prop>

              <Prop label="Renewal">
                <Value>{fmtDay(account.renewalDate)}</Value>
                {phrase && (
                  <p
                    className={`text-[11px] mt-0.5 inline-flex items-center gap-1 ${
                      flagged
                        ? window === "soon" ? "text-amber-700" : "text-red-700"
                        : "text-brand-primary opacity-40"
                    }`}
                  >
                    {flagged && <AlertTriangle className="w-3 h-3 shrink-0" />}
                    {phrase}
                  </p>
                )}
              </Prop>

              <Prop label="First closed won"><Value>{fmtDay(account.firstClosedWon)}</Value></Prop>
            </div>
          </Section>

          <Section title="Who owns it">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Prop label="Account owner"><Value>{account.accountOwner}</Value></Prop>
              <Prop label="CSM"><Value>{account.csmName}</Value></Prop>
              <Prop label="Billing state"><Value>{account.billingState}</Value></Prop>
              <Prop label="Last activity">
                <Value>{fmtDay(account.lastActivityAt)}</Value>
              </Prop>
            </div>
          </Section>

          <Section title="Live date">
            <p className="text-[12px] text-brand-primary opacity-50 mb-3">
              Not on the accounts report — set it here and it shows in the table.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={liveDraft}
                onChange={(e) => { setLiveDraft(e.target.value); setSaved(false); }}
                className="h-10 rounded-sm bg-white border border-black/15 px-3 text-sm text-brand-primary focus:outline-none focus:border-brand-secondary-500"
              />
              <Button size="sm" loading={saving} disabled={!liveDirty} onClick={saveLiveDate}>
                Save
              </Button>
              {saved && !liveDirty && (
                <span className="inline-flex items-center gap-1 text-[12px] text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
            </div>
            {error && <p className="text-[13px] text-red-700 mt-2">{error}</p>}
          </Section>

          <Section title="Feedback">
            {account.feedbackCount ? (
              <Link
                href={`/insights?client=${encodeURIComponent(account.name)}`}
                className="inline-flex items-center gap-2 text-[14px] text-brand-secondary-600 hover:underline font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                {account.feedbackCount} {account.feedbackCount === 1 ? "entry" : "entries"} from this client
              </Link>
            ) : (
              <p className="text-[13px] text-brand-primary opacity-40">
                Nothing filed against this client yet.
              </p>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}
