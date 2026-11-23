import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Ambulance, Car, ChevronRight, ShieldCheck, TowerControl } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BrandWordmark } from "@/components/brand/BrandMark";
import { JunctionGraphic } from "@/components/brand/JunctionGraphic";
import { HeaderChips } from "@/components/shell/HeaderChips";
import { PreferenceToggles } from "@/components/shell/PreferenceToggles";
import { useAuth } from "@/lib/auth";
import { homeFor, type AppRole } from "@/lib/navigation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EthiFlow AI — Choose how you enter" },
      {
        name: "description",
        content:
          "Responsible AI traffic management for Silk Board, Hebbal, KR Puram and MG Road. Enter as operator, supervisor, emergency driver or guest commuter.",
      },
      { property: "og:title", content: "EthiFlow AI — Responsible AI Traffic Management" },
      {
        property: "og:description",
        content: "Explainable signals, pedestrian safety locks and a tamper-proof audit trail for Bengaluru junctions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});

const ROLE_CARDS: { role: AppRole; icon: typeof Car }[] = [
  { role: "operator", icon: TowerControl },
  { role: "supervisor", icon: ShieldCheck },
  { role: "emergency_driver", icon: Ambulance },
  { role: "commuter", icon: Car },
];

const PILLARS = ["safety", "privacy", "accountable", "transparent", "inclusive", "explainable", "reproducible"] as const;
const JUNCTIONS = ["Silk Board", "Hebbal", "KR Puram", "MG Road"];

function Splash() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, loading, enterGuest } = useAuth();

  const continueAsGuest = () => {
    enterGuest();
    void navigate({ to: "/commuter" });
  };

  return (
    <div className="min-h-dvh bg-background">
      <section className="relative overflow-hidden bg-hero text-navy-foreground">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <BrandWordmark tone="inverse" />
            <PreferenceToggles tone="inverse" />
          </div>
          <HeaderChips tone="inverse" className="flex-wrap pb-2" />

          <div className="grid items-center gap-8 pb-14 pt-6 lg:grid-cols-[1.15fr_1fr] lg:pb-20 lg:pt-10">
            <div className="animate-rise">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber">{t("splash.eyebrow")}</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
                {t("splash.title")}
              </h1>
              <p className="mt-5 max-w-xl text-base text-navy-muted sm:text-lg">{t("splash.subtitle")}</p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Junctions">
                {JUNCTIONS.map((j) => (
                  <li
                    key={j}
                    className="rounded-md border border-navy-border bg-navy/60 px-2.5 py-1 font-mono text-xs text-navy-foreground"
                  >
                    {j}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mx-auto w-full max-w-sm lg:max-w-md">
              <JunctionGraphic />
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto -mt-8 max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border bg-card p-5 shadow-lift sm:p-8">
          {!loading && role ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary p-4">
              <p className="font-medium text-secondary-foreground">{t(`roles.${role}`)}</p>
              <Link
                to={homeFor(role)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                {t("splash.continueCta")} <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : null}

          <h2 className="text-xl font-bold sm:text-2xl">{t("splash.chooseRole")}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {ROLE_CARDS.map(({ role: r, icon: Icon }) => (
              <li key={r}>
                <Link
                  to="/login"
                  search={{ role: r }}
                  className="group flex h-full items-start gap-4 rounded-xl border bg-background p-4 transition-colors hover:border-primary hover:bg-secondary"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-navy text-amber">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-semibold">{t(`splash.roleCards.${r}.title`)}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{t(`splash.roleCards.${r}.desc`)}</span>
                  </span>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col items-stretch gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                type="button"
                onClick={continueAsGuest}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-amber px-6 font-display font-semibold text-amber-foreground transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                {t("splash.guestCta")} <ArrowRight className="size-4" />
              </button>
              <p className="mt-1.5 text-center text-xs text-muted-foreground sm:text-left">{t("splash.guestHint")}</p>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {t("splash.haveAccount")}{" "}
              <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                {t("account.signIn")}
              </Link>
              {" · "}
              <Link to="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
                {t("account.signUp")}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-center font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t("splash.pillarsTitle")}
          </h2>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {PILLARS.map((p, i) => (
              <li
                key={p}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm font-medium"
              >
                <span className="font-mono text-[0.7rem] text-primary">{i + 1}</span>
                {t(`splash.pillars.${p}`)}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-xs text-muted-foreground">{t("splash.disclaimer")}</p>
        </div>
      </section>
    </div>
  );
}
