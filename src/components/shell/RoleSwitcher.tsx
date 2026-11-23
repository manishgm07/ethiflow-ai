import { useLocation, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Drama } from "lucide-react";
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
import { canAccess, DEMO_ROLES, homeFor, keyForPath, type EffectiveRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Compact pill that switches the UI role instantly (demo only, never database privileges). */
export function RoleSwitcher({ className, variant = "pill" }: { className?: string; variant?: "pill" | "segmented" }) {
  const { t } = useTranslation();
  const { role, realRole, demoRole, setDemoRole } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!role || !realRole) return null;

  const switchTo = (next: EffectiveRole, demo: typeof demoRole) => {
    setDemoRole(demo);
    const key = keyForPath(pathname);
    if (key && !canAccess(key, next)) void navigate({ to: homeFor(next) });
  };

  if (variant === "segmented") {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Drama className="size-3.5" aria-hidden="true" /> {t("demo.label")}
        </p>
        <div role="radiogroup" aria-label={t("demo.label")} className="grid grid-cols-2 gap-1.5">
          {DEMO_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              onClick={() => switchTo(r, r)}
              className={cn(
                "rounded-md border px-2 py-2 text-xs font-semibold",
                role === r ? "border-primary bg-primary text-primary-foreground" : "bg-card",
              )}
            >
              {t(`roles.${r}`)}
            </button>
          ))}
        </div>
        {demoRole && (
          <button type="button" onClick={() => switchTo(realRole, null)} className="text-xs text-primary underline">
            {t("demo.reset", { role: t(`roles.${realRole}`) })}
          </button>
        )}
        <p className="text-[0.7rem] text-muted-foreground">{t("demo.hint")}</p>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold",
          demoRole ? "border-amber bg-amber text-amber-foreground" : "border-border bg-card",
          className,
        )}
        aria-label={`${t("demo.label")}: ${t(`roles.${role}`)}`}
      >
        <Drama className="size-3.5" aria-hidden="true" />
        {demoRole && <span className="font-mono text-[0.6rem] uppercase">{t("demo.badge")}</span>}
        {t(`roles.${role}`)}
        <ChevronDown className="size-3.5 opacity-70" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">{t("demo.label")}</DropdownMenuLabel>
        {DEMO_ROLES.map((r) => (
          <DropdownMenuItem key={r} onSelect={() => switchTo(r, r)}>
            <Check className={cn("size-4", role === r ? "opacity-100" : "opacity-0")} />
            {t(`roles.${r}`)}
          </DropdownMenuItem>
        ))}
        {demoRole && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => switchTo(realRole, null)}>
              {t("demo.reset", { role: t(`roles.${realRole}`) })}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[0.7rem] leading-snug text-muted-foreground">{t("demo.hint")}</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
