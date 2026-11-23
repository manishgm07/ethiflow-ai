import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/shell/AuthLayout";
import { GuestDivider } from "@/components/shell/GuestDivider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchRoles, GUEST_KEY, useAuth } from "@/lib/auth";
import { effectiveRole, homeFor, REQUESTABLE_ROLES, type AppRole } from "@/lib/navigation";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { role?: AppRole } => {
    const r = search["role"];
    return typeof r === "string" && (REQUESTABLE_ROLES as string[]).includes(r) ? { role: r as AppRole } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — EthiFlow AI" },
      { name: "description", content: "Sign in to the EthiFlow AI traffic control room." },
      { property: "og:title", content: "Sign in — EthiFlow AI" },
      { property: "og:description", content: "Operators, supervisors, emergency drivers and commuters sign in here." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

function LoginPage() {
  const { t } = useTranslation();
  const { role: hintRole } = Route.useSearch();
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string | undefined; password?: string | undefined; form?: string | undefined }>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({
        email: f.email ? t("auth.errors.invalidEmail") : undefined,
        password: f.password ? t("auth.errors.shortPassword") : undefined,
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      setSubmitting(false);
      setErrors({ form: error?.message ?? t("auth.errors.generic") });
      return;
    }
    window.localStorage.removeItem(GUEST_KEY);
    const roles = await fetchRoles(data.user.id);
    toast.success(t("auth.welcome"));
    void navigate({ to: homeFor(effectiveRole(roles, false) ?? "commuter"), replace: true });
  };

  return (
    <AuthLayout title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      {!loading && session && role ? (
        <div className="rounded-xl border bg-secondary p-5">
          <p className="font-medium text-secondary-foreground">{t("auth.alreadySignedIn")}</p>
          <Button asChild className="mt-4">
            <Link to={homeFor(role)}>
              {t("auth.goToConsole")} <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {hintRole && (
            <p className="rounded-md border border-primary/30 bg-secondary px-3 py-2 font-mono text-xs uppercase tracking-wide text-secondary-foreground">
              {t("auth.signingAs", { role: t(`roles.${hintRole}`) })}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="h-11"
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="h-11"
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
          </div>
          {errors.form && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.form}
            </p>
          )}
          <Button type="submit" size="lg" className="h-11 w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {t("auth.submitLogin")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link to="/signup" search={hintRole ? { role: hintRole } : {}} className="font-semibold text-primary hover:underline">
              {t("account.signUp")}
            </Link>
          </p>
          <GuestDivider />
        </form>
      )}
    </AuthLayout>
  );
}
