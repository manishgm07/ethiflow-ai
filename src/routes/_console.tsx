import { createFileRoute, Navigate, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AppShell } from "@/components/shell/AppShell";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { supabase } from "@/integrations/supabase/client";
import { isGuestStored, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_console")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session && !isGuestStored()) throw redirect({ to: "/", replace: true });
  },
  component: ConsoleLayout,
});

function ConsoleLayout() {
  const { t } = useTranslation();
  const { loading, role, session, isGuest } = useAuth();

  if (!loading && !session && !isGuest) return <Navigate to="/" replace />;

  if (loading || !role) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3 bg-background text-muted-foreground" role="status">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        {t("shell.loading")}
      </div>
    );
  }

  return (
    <AppShell role={role}>
      <Outlet />
      <VoiceAssistant />
    </AppShell>
  );
}