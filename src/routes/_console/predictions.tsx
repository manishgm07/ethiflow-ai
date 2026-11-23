
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { ConfidencePill, LevelBadge } from "@/components/traffic/badges";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { pick } from "@/lib/i18n";
import { forecast, HORIZONS, trendSeries } from "@/lib/sim/engine";
import { JUNCTION_IDS, JUNCTIONS, type JunctionId } from "@/lib/sim/junctions";
import { useSim } from "@/lib/sim/provider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/predictions")({
  head: () => ({
    meta: [
      { title: "Traffic Prediction — EthiFlow AI" },
      { name: "description", content: "Low, moderate and severe congestion forecasts at +15, +30 and +60 minutes." },
    ],
  }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const { t, i18n } = useTranslation();
  const tick = useSim((s) => s.tick);
  const [selectedJunction, setSelectedJunction] = useState<JunctionId>("silk-board");

  const trendData = trendSeries(selectedJunction, tick);

  return (
    <RoleGate navKey="predictions">
      <PageHeader navKey="predictions" title={t("modules.predictions.title")} desc={t("modules.predictions.desc")} />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card shadow-panel">
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold">{t("predictions.matrixTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("predictions.matrixHint")}</p>
          </div>
          <div className="overflow-x-auto p-5">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">{t("predictions.junction")}</th>
                  {HORIZONS.map((h) => (
                    <th key={h} className="pb-3 font-medium">+{h} min</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {JUNCTION_IDS.map((id) => {
                  const j = JUNCTIONS[id];
                  const active = selectedJunction === id;
                  return (
                    <tr 
                      key={id} 
                      className={cn("cursor-pointer transition-colors hover:bg-muted/50", active && "bg-muted/50")}
                      onClick={() => setSelectedJunction(id)}
                    >
                      <td className="py-3 font-medium">{pick(j.name, i18n.language)}</td>
                      {HORIZONS.map((h) => {
                        const f = forecast(id, tick, h);
                        return (
                          <td key={h} className="py-3 pr-2">
                            <div className="flex flex-col gap-1.5 items-start">
                              <LevelBadge level={f.level} score={f.score} />
                              <ConfidencePill value={f.confidence} />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border bg-card shadow-panel flex flex-col">
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold">{pick(JUNCTIONS[selectedJunction].name, i18n.language)} Trend</h2>
            <p className="text-sm text-muted-foreground">{t("predictions.trendTitle")}</p>
          </div>
          <div className="p-5 flex-1 min-h-[350px]">
            <ChartContainer config={{ 
              actual: { label: t("predictions.actual"), color: "var(--color-primary)" },
              forecast: { label: t("predictions.forecast"), color: "var(--color-amber)" },
              band: { label: t("predictions.band"), color: "var(--color-amber)" }
            }} className="h-full w-full">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={10} />
                <Tooltip content={<ChartTooltipContent />} />
                <ReferenceLine y={70} stroke="var(--color-status-severe)" strokeDasharray="3 3" opacity={0.5} label={{ value: t("predictions.severeZone"), position: 'insideTopLeft', fill: 'var(--color-status-severe)', fontSize: 10 }} />
                
                {/* Uncertainty band */}
                <Area type="monotone" dataKey="high" stroke="none" fill="var(--color-amber)" fillOpacity={0.1} />
                <Area type="monotone" dataKey="low" stroke="none" fill="var(--color-background)" fillOpacity={1} />
                
                {/* Lines */}
                <Line type="monotone" dataKey="actual" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="forecast" stroke="var(--color-amber)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ChartContainer>
          </div>
        </section>
      </div>
    </RoleGate>
  );
}