import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { ImpactStrip } from "@/components/traffic/ImpactStrip";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export const Route = createFileRoute("/_console/impact")({
  component: ImpactPage,
});

function ImpactPage() {
  const { t } = useTranslation();
  
  const mockData = [
    { day: "Mon", aiWait: 450, fixedWait: 620 },
    { day: "Tue", aiWait: 480, fixedWait: 650 },
    { day: "Wed", aiWait: 420, fixedWait: 590 },
    { day: "Thu", aiWait: 510, fixedWait: 700 },
    { day: "Fri", aiWait: 580, fixedWait: 780 },
  ];

  return (
    <RoleGate navKey="impact">
      <PageHeader navKey="impact" title={t("modules.impact.title")} desc={t("modules.impact.desc")} />
      
      <div className="mb-8">
        <ImpactStrip />
      </div>

      <div className="rounded-xl border bg-card shadow-panel p-6">
        <h3 className="font-semibold mb-6">Weekly Wait Time Comparison (Hours)</h3>
        <div className="h-80 w-full">
          <ChartContainer config={{ 
            aiWait: { label: "AI Adaptive", color: "var(--color-primary)" },
            fixedWait: { label: "Fixed Baseline", color: "var(--color-muted-foreground)" }
          }} className="h-full w-full">
            <BarChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="fixedWait" fill="var(--color-muted-foreground)" opacity={0.4} radius={[4, 4, 0, 0]} />
              <Bar dataKey="aiWait" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </RoleGate>
  );
}