"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [years, setYears] = useState("");
  const [tenantSlug, setTenantSlug] = useState("goid");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = trpc.auth.selfRegister.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => setError(err.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    register.mutate({
      tenantSlug,
      email,
      password,
      name,
      department: department || undefined,
      jobTitle: jobTitle || undefined,
      yearsOfExperience: years ? Number(years) : undefined,
    });
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-md text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">{t("registered")}</h1>
          <Button onClick={() => router.push(`/${locale}/login`)} className="mt-4 w-full">
            {t("loginButton")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{t("registerTitle")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("registerSubtitle")}</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-4"
        >
          <Field label={t("tenantSlug")}>
            <Input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} required />
          </Field>
          <Field label={t("fullName")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={t("email")}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
          </Field>
          <Field label={t("password")}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </Field>
          <Field label={t("department")}>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
          </Field>
          <Field label={t("jobTitle")}>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </Field>
          <Field label={t("yearsExperience")}>
            <Input
              type="number"
              min={0}
              max={60}
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </Field>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" disabled={register.isPending} className="w-full h-11">
            {register.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("registerButton")}
          </Button>

          <p className="text-center text-sm text-slate-500">
            {t("haveAccount")}{" "}
            <Link href={`/${locale}/login`} className="text-amber-600 hover:underline font-semibold">
              {t("login")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
