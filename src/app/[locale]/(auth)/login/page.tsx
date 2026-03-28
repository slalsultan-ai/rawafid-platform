"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

function StarLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 4L27.5 14.5L38 11L31 20L41 24L31 28L38 37L27.5 33.5L24 44L20.5 33.5L10 37L17 28L7 24L17 20L10 11L20.5 14.5L24 4Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <circle cx="24" cy="24" r="6" fill="white" fillOpacity="0.95" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const t = {
    ar: {
      welcome: "مرحباً بك في روافد",
      subtitle: "منصة الإرشاد المهني الذكي",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      login: "دخول",
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      emailPlaceholder: "example@goid.gov.sa",
    },
    en: {
      welcome: "Welcome to Rawafid",
      subtitle: "Smart Professional Mentoring Platform",
      email: "Email",
      password: "Password",
      login: "Sign In",
      error: "Invalid email or password",
      emailPlaceholder: "example@goid.gov.sa",
    },
  }[locale] ?? {
    welcome: "Welcome to Rawafid",
    subtitle: "Smart Professional Mentoring Platform",
    email: "Email",
    password: "Password",
    login: "Sign In",
    error: "Invalid credentials",
    emailPlaceholder: "example@goid.gov.sa",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t.error);
    } else {
      router.push(`/${locale}`);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2837]/5 via-white to-amber-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0f2837] rounded-2xl mb-4 shadow-lg">
            <StarLogo className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{t.welcome}</h1>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t.email}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t.password}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.login}
            </Button>
          </form>
        </div>

        {/* Language switcher */}
        <div className="text-center mt-4">
          <button
            onClick={() => router.push(`/${locale === "ar" ? "en" : "ar"}/login`)}
            className="text-sm text-slate-500 hover:text-amber-600 transition-colors"
          >
            {locale === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </div>
    </div>
  );
}
