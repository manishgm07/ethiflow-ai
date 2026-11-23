import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, MoreHorizontal, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BrandMark, BrandWordmark } from "@/components/brand/BrandMark";
import { AccountMenu, AccountSummary, useSignOut } from "@/components/shell/AccountMenu";
import { HeaderChips } from "@/components/shell/HeaderChips";
import { RoleSwitcher } from "@/components/shell/RoleSwitcher";
import { SimClock } from "@/components/shell/SimClock";
import { NAV_ICONS } from "@/components/shell/nav-icons";
import {
  HighContrastToggle,
  LanguageToggle,
  PreferenceToggles,
  ReducedMotionSwitch,
  TextSizeControl,
} from "@/components/shell/PreferenceToggles";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { NAV_PATHS, ROLE_NAV, type EffectiveRole, type NavKey } from "@/lib/navigation";
import { usePreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

export function AppShell({ role, children }: { role: EffectiveRole; children: ReactNode }) {
  const { sidebarCollapsed } = usePreferences();
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar role={role} />
      <div className={cn("flex min-h-dvh flex-col transition-[padding] duration-300", sidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <TopBar />
        <main id="main" className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>
      <BottomTabs role={role} />
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="lg:hidden" aria-label="EthiFlow AI">
          <BrandWordmark />
        </Link>
        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <HeaderChips />
          <SimClock className="hidden xl:inline-flex" />
        </div>
        <div className="flex items-center gap-1.5">
          <SimClock className="hidden md:inline-flex xl:hidden" />
          <RoleSwitcher className="hidden md:inline-flex" />
          <LanguageToggle />
          <HighContrastToggle />
          <AccountMenu />
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto border-t px-4 py-2 md:hidden">
        <RoleSwitcher />
        <HeaderChips />
        <SimClock />
      </div>
    </header>
  );
}

function Sidebar({ role }: { role: EffectiveRole }) {
  const { t } = useTranslation();
  const { sidebarCollapsed: collapsed, update } = usePreferences();
  const nav = ROLE_NAV[role];

  return (
    <aside
      aria-label={t("nav.menu")}
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 lg:flex",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-sidebar-border", collapsed ? "justify-center" : "px-5")}>
        <Link to="/" aria-label="EthiFlow AI">
          {collapsed ? <BrandMark /> : <BrandWordmark tone="inverse" />}
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <NavGroup items={nav.primary} collapsed={collapsed} />
        <div className="border-t border-sidebar-border" />
        <NavGroup items={nav.secondary} collapsed={collapsed} />
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => update({ sidebarCollapsed: !collapsed })}
          aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          {!collapsed && t("nav.collapse")}
        </button>
      </div>
    </aside>
  );
}

function NavGroup({ items, collapsed }: { items: NavKey[]; collapsed: boolean }) {
  const { t } = useTranslation();
  return (
    <ul className="space-y-1">
      {items.map((key) => {
        const Icon = NAV_ICONS[key];
        return (
          <li key={key}>
            <Link
              to={NAV_PATHS[key]}
              title={collapsed ? t(`nav.${key}`) : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0",
              )}
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-sidebar-primary",
                "aria-current": "page",
              }}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className={cn(collapsed && "sr-only")}>{t(`nav.${key}`)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function BottomTabs({ role }: { role: EffectiveRole }) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const nav = ROLE_NAV[role];

  return (
    <>
      <nav
        aria-label={t("nav.menu")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar pb-safe text-sidebar-foreground lg:hidden"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {nav.primary.map((key) => {
            const Icon = NAV_ICONS[key];
            return (
              <li key={key}>
                <Link
                  to={NAV_PATHS[key]}
                  className="group flex h-16 flex-col items-center justify-center gap-1 px-1 text-[0.68rem] font-medium text-sidebar-foreground/70"
                  activeProps={{ className: "text-sidebar-primary", "aria-current": "page" }}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="max-w-full truncate">{t(`nav.${key}`)}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.68rem] font-medium text-sidebar-foreground/70"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
              {t("nav.more")}
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} items={nav.secondary} />
    </>
  );
}

function MoreSheet({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: NavKey[];
}) {
  const { t } = useTranslation();
  const { isGuest, exitGuest } = useAuth();
  const handleSignOut = useSignOut();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl pb-safe">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display">{t("nav.more")}</SheetTitle>
          <SheetDescription className="sr-only">{t("nav.menu")}</SheetDescription>
        </SheetHeader>
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {items.map((key) => {
            const Icon = NAV_ICONS[key];
            return (
              <li key={key}>
                <Link
                  to={NAV_PATHS[key]}
                  onClick={() => onOpenChange(false)}
                  className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border bg-card p-2 text-center text-xs font-medium"
                  activeProps={{ className: "border-primary text-primary", "aria-current": "page" }}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="leading-tight">{t(`nav.${key}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <RoleSwitcher variant="segmented" className="mt-6 rounded-lg border p-4" />

        <div className="mt-4 space-y-4 rounded-lg border bg-muted/50 p-4">
          <p className="font-display text-sm font-semibold">{t("a11y.accessibility")}</p>
          <PreferenceToggles className="flex-wrap" />
          <TextSizeControl />
          <ReducedMotionSwitch id="reduced-motion-sheet" />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border p-4">
          <AccountSummary className="min-w-0" />
          {isGuest ? (
            <div className="flex shrink-0 flex-col gap-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <LogIn className="size-4" /> {t("account.signIn")}
              </Link>
              <button type="button" onClick={exitGuest} className="text-left text-xs text-muted-foreground underline">
                {t("account.exitGuest")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-destructive"
            >
              <LogOut className="size-4" /> {t("account.signOut")}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
