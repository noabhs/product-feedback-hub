"use client";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { fmtDay } from "@/lib/format";
import type { AccountDetail } from "@/lib/types";

interface AccountRowProps {
  account: AccountDetail;
  /** Opens the detail panel, where the rest of the report data lives. */
  onOpen: (account: AccountDetail) => void;
}

const Empty = () => <span className="text-[13px] text-brand-primary opacity-25">—</span>;

export function AccountRow({ account, onOpen }: AccountRowProps) {
  const live = fmtDay(account.liveDate);

  return (
    <tr
      onClick={() => onOpen(account)}
      className="group border-b border-[rgba(50,43,95,0.07)] hover:bg-[rgba(93,7,226,0.03)] transition-colors cursor-pointer"
    >
      <td className="py-3 px-4 align-top">
        <span className="text-[14px] font-semibold text-brand-primary group-hover:text-brand-secondary-600 transition-colors leading-snug">
          {account.name}
        </span>
      </td>
      <td className="py-3 px-4 align-top">
        {account.health ? <Badge type="health" value={account.health} /> : <Empty />}
      </td>
      <td className="py-3 px-4 align-top">
        {account.products.length ? (
          <span className="flex flex-wrap gap-1">
            {account.products.map((p) => (
              <span
                key={p}
                className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-medium bg-secondary-50 text-brand-secondary-600"
              >
                {p}
              </span>
            ))}
          </span>
        ) : (
          <Empty />
        )}
      </td>
      <td className="py-3 px-4 align-top whitespace-nowrap text-[13px] text-brand-primary opacity-70">
        {account.ehr ?? <Empty />}
      </td>
      <td className="py-3 px-4 align-top whitespace-nowrap text-[13px] text-brand-primary opacity-70">
        {account.segment ?? <Empty />}
      </td>
      <td className="py-3 px-4 align-top whitespace-nowrap text-[13px] text-brand-primary opacity-70">
        {live ?? <Empty />}
      </td>
      <td className="py-3 px-4 align-top whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 text-[12px] ${
            account.feedbackCount ? "text-brand-secondary-600 opacity-80" : "text-brand-primary opacity-25"
          }`}
          title={
            account.feedbackCount
              ? `${account.feedbackCount} feedback ${account.feedbackCount === 1 ? "entry" : "entries"}`
              : "No feedback filed against this account yet"
          }
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {account.feedbackCount}
        </span>
      </td>
    </tr>
  );
}
