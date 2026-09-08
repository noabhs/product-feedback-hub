export const dynamic = "force-dynamic";

import { Tabs } from "@/components/analytics/Tabs";
import { DataAnalyticsTab } from "@/components/analytics/DataAnalyticsTab";
import { UsageAnalyticsTab } from "@/components/analytics/UsageAnalyticsTab";

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold text-brand-primary mb-2">Analytics</h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            What clients are telling us, and how the team is using the hub to act on it.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "data", label: "Data analytics", content: <DataAnalyticsTab /> },
            { id: "usage", label: "Usage analytics", content: <UsageAnalyticsTab /> },
          ]}
        />
      </div>
    </div>
  );
}
