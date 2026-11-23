import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function useSignOut() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/", replace: true });
  };
}

export function AccountSummary({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user, profile, realRole, roles, isGuest, demoRole } = useAuth();
  const role = realRole;
  const pending =
    profile && profile.requested_role !== "commuter" && !roles.includes(profile.requested_role)
      ? profile.requested_role
      : null;
  return (
    <div className={cn("space-y-1", className)}>
      <p className="truncate text-sm font-semibold">
        {isGuest ? t("roles.guest") : profile?.display_name || user?.email}
      </p>
      <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
        {isGuest ? t("account.guestNote") : role ? t(`roles.${role}`) : ""}
      </p>
      {demoRole && (
        <p className="font-mono text-[0.7rem] uppercase tracking-wide text-amber-foreground">
          <span className="rounded bg-amber px-1.5 py-0.5">{t("demo.badge")}</span> {t(`roles.${demoRole}`)}
        </p>
      )}
      {pending && (
        <p className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
          {t("account.pending", { role: t(`roles.${pending}`) })}
        </p>
      )}
    </div>
  );
}

export function AccountMenu({ tone = "default" }: { tone?: "default" | "inverse" }) {
  const { t } = useTranslation();
  const { isGuest, exitGuest } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account.signedInAs")}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full border",
          tone === "inverse" ? "border-navy-border bg-navy text-navy-foreground" : "border-border bg-card",
        )}
      >
        <UserRound className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <AccountSummary />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isGuest ? (
          <>
            <DropdownMenuItem asChild>
              <Link to="/login">
                <LogIn /> {t("account.signIn")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                exitGuest();
                void navigate({ to: "/", replace: true });
              }}
            >
              <LogOut /> {t("account.exitGuest")}
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={() => void handleSignOut()}>
            <LogOut /> {t("account.signOut")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
