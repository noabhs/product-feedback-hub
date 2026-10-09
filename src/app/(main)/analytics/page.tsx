export const dynamic = "force-dynamic";

import { Tabs } from "@/components/analytics/Tabs";
import { DataAnalyticsTab } from "@/components/analytics/DataAnalyticsTab";
import { UsageAnalyticsTab } from "@/components/analytics/UsageAnalyticsTab";
import { AskLogTab } from "@/components/analytics/AskLogTab";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold text-brand-primary mb-2">Analytics</h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            What clients are telling us, how the team is using the hub to act on it, and the questions it has been asked.
          </p>
        </div>

        <Tabs
          initialTab={tab}
          tabs={[
            { id: "data", label: "Data analytics", content: <DataAnalyticsTab /> },
            { id: "usage", label: "Usage analytics", content: <UsageAnalyticsTab /> },
            { id: "asks", label: "Asks log", content: <AskLogTab /> },
          ]}
        />
      </div>
    </div>
  );
}
