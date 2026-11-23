import { Contrast, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { LANGUAGES } from "@/lib/i18n";
import { usePreferences, type TextSize } from "@/lib/preferences";
import { cn } from "@/lib/utils";

type Tone = "default" | "inverse";

const toneRing: Record<Tone, string> = {
  default: "border-border bg-card text-foreground",
  inverse: "border-navy-border bg-navy text-navy-foreground",
};

export function LanguageToggle({ tone = "default", className }: { tone?: Tone; className?: string }) {
  const { t } = useTranslation();
  const { language, update } = usePreferences();
  return (
    <div
      role="radiogroup"
      aria-label={t("a11y.language")}
      className={cn("inline-flex h-9 items-center rounded-full border p-0.5", toneRing[tone], className)}
    >
      {LANGUAGES.map((l) => {
        const active = language === l.code;
        return (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={active}
            lang={l.code}
            onClick={() => update({ language: l.code })}
            className={cn(
              "h-full rounded-full px-2.5 text-xs font-semibold transition-colors",
              active ? "bg-primary text-primary-foreground" : "opacity-80 hover:opacity-100",
            )}
          >
            {l.code === "en" ? "EN" : l.label}
          </button>
        );
      })}
    </div>
  );
}

export function HighContrastToggle({ tone = "default", className }: { tone?: Tone; className?: string }) {
  const { t } = useTranslation();
  const { highContrast, update } = usePreferences();
  return (
    <button
      type="button"
      aria-pressed={highContrast}
      aria-label={t("a11y.highContrast")}
      title={highContrast ? t("a11y.highContrastOn") : t("a11y.highContrastOff")}
      onClick={() => update({ highContrast: !highContrast })}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border transition-colors",
        highContrast ? "border-primary bg-primary text-primary-foreground" : toneRing[tone],
        className,
      )}
    >
      <Contrast className="size-4" aria-hidden="true" />
    </button>
  );
}

const SIZES: TextSize[] = ["s", "m", "l", "xl"];

export function TextSizeControl() {
  const { t } = useTranslation();
  const { textSize, update } = usePreferences();
  return (
    <div role="radiogroup" aria-label={t("a11y.textSize")} className="inline-flex rounded-md border p-0.5">
      {SIZES.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={textSize === s}
          onClick={() => update({ textSize: s })}
          className={cn(
            "min-w-9 rounded px-2 py-1 text-xs font-semibold",
            textSize === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`a11y.sizes.${s}`)}
        </button>
      ))}
    </div>
  );
}

export function ReducedMotionSwitch({ id = "reduced-motion" }: { id?: string }) {
  const { t } = useTranslation();
  const { reducedMotion, update } = usePreferences();
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id}>{t("a11y.reducedMotion")}</Label>
      <Switch id={id} checked={reducedMotion} onCheckedChange={(v) => update({ reducedMotion: v })} />
    </div>
  );
}

export function AccessibilityMenu({ tone = "default" }: { tone?: Tone }) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("a11y.accessibility")}
        className={cn("inline-flex size-9 items-center justify-center rounded-full border", toneRing[tone])}
      >
        <Settings2 className="size-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-4">
        <p className="font-display text-sm font-semibold">{t("a11y.accessibility")}</p>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("a11y.textSize")}</p>
          <TextSizeControl />
        </div>
        <ReducedMotionSwitch id="reduced-motion-popover" />
      </PopoverContent>
    </Popover>
  );
}

export function PreferenceToggles({ tone = "default", className }: { tone?: Tone; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <LanguageToggle tone={tone} />
      <HighContrastToggle tone={tone} />
      <AccessibilityMenu tone={tone} />
    </div>
  );
}
