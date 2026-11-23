import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button, type ButtonProps } from "@/components/ui/button";
import type { Horizon } from "@/lib/sim/engine";
import type { Explanation } from "@/lib/sim/explain";
import type { JunctionId } from "@/lib/sim/junctions";
import type { Alert } from "@/lib/sim/store";
import { cn } from "@/lib/utils";
import { ExplainDrawer } from "./ExplainDrawer";

export type ExplainSubject =
  | { kind: "signal"; junctionId: JunctionId }
  | { kind: "prediction"; junctionId: JunctionId; horizon: Horizon }
  | { kind: "snapshot"; explanation: Explanation; label: string };

export function subjectForAlert(a: Alert): ExplainSubject {
  return a.kind === "severe" || a.kind === "forecast"
    ? { kind: "prediction", junctionId: a.junctionId, horizon: 15 }
    : { kind: "signal", junctionId: a.junctionId };
}

interface ExplainCtx {
  open: (s: ExplainSubject) => void;
}

const Ctx = createContext<ExplainCtx | null>(null);

export function ExplainProvider({ children }: { children: ReactNode }) {
  const [subject, setSubject] = useState<ExplainSubject | null>(null);
  const open = useCallback((s: ExplainSubject) => setSubject(s), []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <ExplainDrawer subject={subject} onClose={() => setSubject(null)} />
    </Ctx.Provider>
  );
}

export function useExplain() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useExplain must be used within ExplainProvider");
  return c;
}

export function ExplainButton({
  subject,
  className,
  label,
  ...props
}: { subject: ExplainSubject; label?: string } & Omit<ButtonProps, "onClick">) {
  const { t } = useTranslation();
  const { open } = useExplain();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => open(subject)}
      className={cn("gap-1.5", className)}
      {...props}
    >
      <Sparkles className="text-primary" aria-hidden="true" />
      {label ?? t("common.explain")}
    </Button>
  );
}
