import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth";

export function GuestDivider() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enterGuest } = useAuth();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("auth.orGuest")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={() => {
          enterGuest();
          void navigate({ to: "/commuter" });
        }}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-amber px-4 font-display font-semibold text-amber-foreground"
      >
        {t("splash.guestCta")} <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
