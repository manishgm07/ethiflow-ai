
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { JunctionCard } from "@/components/traffic/JunctionCard";
import { JUNCTION_IDS } from "@/lib/sim/junctions";

export const Route = createFileRoute("/_console/signals/")({
  head: () => ({
    meta: [{ title: "Signals — EthiFlow AI" }],
  }),
  component: SignalsPage,
});

function SignalsPage() {
  const { t } = useTranslation();
  return (
    <RoleGate navKey="signals">
      <PageHeader navKey="signals" title={t("modules.signals.title")} desc={t("modules.signals.desc")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {JUNCTION_IDS.map((id) => (
          <JunctionCard key={id} id={id} />
        ))}
      </div>
    </RoleGate>
  );
}