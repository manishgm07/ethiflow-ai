import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Info, Loader2, MailCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/shell/AuthLayout";
import { GuestDivider } from "@/components/shell/GuestDivider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { GUEST_KEY } from "@/lib/auth";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { homeFor, REQUESTABLE_ROLES, type AppRole } from "@/lib/navigation";
import { usePreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { role?: AppRole } => {
    const r = search["role"];
    return typeof r === "string" && (REQUESTABLE_ROLES as string[]).includes(r) ? { role: r as AppRole } : {};
  },
  head: () => ({
    meta: [
      { title: "Create account — EthiFlow AI" },
      { name: "description", content: "Create an EthiFlow AI account. Everyone starts with commuter access." },
      { property: "og:title", content: "Create account — EthiFlow AI" },
      { property: "og:description", content: "Join EthiFlow AI as a commuter and request operator or emergency access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  displayName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

type FieldErrors = {
  displayName?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
  form?: string | undefined;
};

function SignupPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const prefs = usePreferences();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<AppRole>(search.role ?? "commuter");
  const [language, setLanguage] = useState<Language>(prefs.language);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({
        displayName: f.displayName ? t("auth.errors.nameRequired") : undefined,
        email: f.email ? t("auth.errors.invalidEmail") : undefined,
        password: f.password ? t("auth.errors.shortPassword") : undefined,
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: parsed.data.displayName,
          requested_role: requestedRole,
          preferred_language: language,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      setErrors({ form: error.message });
      return;
    }
    prefs.update({ language });
    if (data.session) {
      window.localStorage.removeItem(GUEST_KEY);
      toast.success(t("auth.accountCreated"));
      // New accounts always start as commuters; elevated roles are granted later.
      void navigate({ to: homeFor("commuter"), replace: true });
    } else {
      setSentTo(parsed.data.email);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout title={t("auth.checkEmailTitle")} subtitle={t("auth.checkEmailBody", { email: sentTo })}>
        <div className="flex items-center gap-4 rounded-xl border bg-secondary p-5">
          <MailCheck className="size-8 shrink-0 text-primary" aria-hidden="true" />
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("account.signIn")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("auth.signupTitle")} subtitle={t("auth.signupSubtitle")}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field id="displayName" label={t("auth.displayName")} error={errors.displayName}>
          <Input
            id="displayName"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            aria-invalid={!!errors.displayName}
            maxLength={80}
            className="h-11"
          />
        </Field>
        <Field id="email" label={t("auth.email")} error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            className="h-11"
          />
        </Field>
        <Field id="password" label={t("auth.password")} error={errors.password} hint={t("auth.passwordHint")}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            className="h-11"
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("auth.requestedRole")}</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {REQUESTABLE_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={requestedRole === r}
                onClick={() => setRequestedRole(r)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  requestedRole === r ? "border-primary bg-secondary text-secondary-foreground" : "bg-card hover:border-primary/50",
                )}
              >
                {t(`roles.${r}`)}
              </button>
            ))}
          </div>
          {requestedRole !== "commuter" && (
            <p className="flex gap-2 rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {t("auth.roleReviewNote")}
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("auth.preferredLanguage")}</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="radio"
                lang={l.code}
                aria-checked={language === l.code}
                onClick={() => setLanguage(l.code)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-sm font-medium",
                  language === l.code ? "border-primary bg-secondary text-secondary-foreground" : "bg-card",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </fieldset>

        {errors.form && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.form}
          </p>
        )}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          {t("auth.submitSignup")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("account.signIn")}
          </Link>
        </p>
        <GuestDivider />
      </form>
    </AuthLayout>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
