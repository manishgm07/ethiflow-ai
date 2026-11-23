import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AccountSummary } from "@/components/shell/AccountMenu";
import { PageHeader } from "@/components/shell/ModulePage";
import { LanguageToggle, TextSizeControl } from "@/components/shell/PreferenceToggles";
import { Switch } from "@/components/ui/switch";
import { usePreferences } from "@/lib/preferences";

export const Route = createFileRoute("/_console/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EthiFlow AI" },
      { name: "description", content: "Language, high-contrast, text size and motion preferences." },
      { property: "og:title", content: "Settings — EthiFlow AI" },
      { property: "og:description", content: "Language and accessibility preferences for EthiFlow AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { highContrast, reducedMotion, update } = usePreferences();

  return (
    <>
      <PageHeader navKey="settings" title={t("settings.title")} desc={t("settings.desc")} />
      <div className="grid max-w-3xl gap-6">
        <section className="rounded-xl border bg-card shadow-panel">
          <h2 className="border-b px-5 py-4 text-base font-semibold">{t("settings.appearance")}</h2>
          <div className="divide-y">
            <Row title={t("a11y.language")} desc={t("settings.languageDesc")}>
              <LanguageToggle />
            </Row>
            <Row title={t("a11y.highContrast")} desc={t("settings.highContrastDesc")} htmlFor="hc-switch">
              <Switch id="hc-switch" checked={highContrast} onCheckedChange={(v) => update({ highContrast: v })} />
            </Row>
            <Row title={t("a11y.textSize")} desc={t("settings.textSizeDesc")}>
              <TextSizeControl />
            </Row>
            <Row title={t("a11y.reducedMotion")} desc={t("settings.reducedMotionDesc")} htmlFor="rm-switch">
              <Switch id="rm-switch" checked={reducedMotion} onCheckedChange={(v) => update({ reducedMotion: v })} />
            </Row>
          </div>
        </section>
        <section className="rounded-xl border bg-card shadow-panel">
          <h2 className="border-b px-5 py-4 text-base font-semibold">{t("settings.account")}</h2>
          <AccountSummary className="px-5 py-4" />
        </section>
      </div>
    </>
  );
}

function Row({
  title,
  desc,
  htmlFor,
  children,
}: {
  title: string;
  desc: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <label htmlFor={htmlFor} className="font-medium">
          {title}
        </label>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
