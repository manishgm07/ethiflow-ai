import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ShieldCheck, Scale, Eye, Activity, Cpu, RotateCcw } from "lucide-react";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";

export const Route = createFileRoute("/_console/responsible-ai")({
  component: ResponsibleAiPage,
});

function ResponsibleAiPage() {
  const { t } = useTranslation();
  
  const pillars = [
    { id: "safety", icon: ShieldCheck, title: "Safety", desc: "Pedestrian minimums are hard-locked in the physics engine. AI cannot override physical safety." },
    { id: "privacy", icon: Eye, title: "Privacy", desc: "Simulation uses abstract numeric lane counts. No cameras, no PII, no plate recognition." },
    { id: "accountable", icon: Scale, title: "Accountable", desc: "SHA-256 ledger records every AI decision and human override. Immutable audit trail." },
    { id: "transparent", icon: Activity, title: "Transparent", desc: "Clear indicators for Confidence < 70%. Dashboard explains fallback reasoning." },
    { id: "inclusive", icon: CheckCircle2, title: "Inclusive", desc: "Bilingual interface (EN/KN), High Contrast mode, and Accessible Senior extensions." },
    { id: "explainable", icon: Cpu, title: "Explainable", desc: "Every decision is broken down into feature weights and natural language narratives." },
    { id: "reproducible", icon: RotateCcw, title: "Reproducible", desc: "Deterministic Mulberry32 PRNG ensures identical seeds yield identical traffic scenarios." }
  ];

  return (
    <RoleGate navKey="responsibleAi">
      <PageHeader navKey="responsibleAi" title={t("modules.responsibleAi.title")} desc={t("modules.responsibleAi.desc")} />
      
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pillars.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-5 shadow-sm hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2 bg-primary/10 rounded-lg text-primary">
                <p.icon className="size-5" />
              </span>
              <h3 className="font-semibold text-lg">{p.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-4 pt-4 border-t text-[0.7rem] uppercase tracking-wider font-semibold text-status-low flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Compliant
            </div>
          </div>
        ))}
      </div>
    </RoleGate>
  );
}