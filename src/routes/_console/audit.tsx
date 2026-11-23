
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ExplainButton } from "@/components/explain/ExplainProvider";
import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { verifyChain } from "@/lib/audit/local-audit";
import { pick } from "@/lib/i18n";
import { useAuditEntries } from "@/lib/sim/provider";

export const Route = createFileRoute("/_console/audit")({
  head: () => ({
    meta: [
      { title: "Immutable Audit Log — EthiFlow AI" },
      { name: "description", content: "Append-only, SHA-256 hash-chained record of every AI decision." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { t, i18n } = useTranslation();
  const entries = useAuditEntries();
  const [verifyState, setVerifyState] = useState<{ ok: boolean; brokenAt: number | null } | null>(null);

  const handleVerify = async () => {
    const res = await verifyChain(entries);
    setVerifyState(res);
  };

  return (
    <RoleGate navKey="audit">
      <PageHeader navKey="audit" title={t("modules.audit.title")} desc={t("modules.audit.desc")} />
      
      <div className="mb-6 flex items-center justify-between bg-card border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-8 text-primary opacity-80" />
          <div>
            <h3 className="font-semibold">SHA-256 Cryptographic Ledger</h3>
            <p className="text-sm text-muted-foreground">{entries.length} decisions logged</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {verifyState && (
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${verifyState.ok ? 'text-status-low' : 'text-status-severe'}`}>
              {verifyState.ok ? <CheckCircle2 className="size-4" /> : <ShieldAlert className="size-4" />}
              {verifyState.ok ? t("signals.verified", { n: entries.length }) : t("signals.broken", { seq: verifyState.brokenAt })}
            </span>
          )}
          <Button onClick={handleVerify} variant="outline">{t("signals.verify")}</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seq</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Row Hash</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {t("signals.logEmpty")}
                </TableCell>
              </TableRow>
            ) : (
              [...entries].reverse().map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.seq}</TableCell>
                  <TableCell className="whitespace-nowrap">{e.simTime}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-secondary-foreground">
                      {e.action.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{pick(e.summary, i18n.language)}</TableCell>
                  <TableCell className="text-xs">{e.actor} <span className="opacity-50">({e.role})</span></TableCell>
                  <TableCell className="font-mono text-[0.65rem] text-muted-foreground">
                    {e.row_hash.substring(0, 12)}...
                  </TableCell>
                  <TableCell className="text-right">
                    {e.explanation && (
                      <ExplainButton subject={{ kind: "snapshot", explanation: e.explanation, label: `Seq ${e.seq}` }} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </RoleGate>
  );
}