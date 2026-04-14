"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Sparkles } from "lucide-react";

interface Props {
  totalMentors?: number;
}

const STEP_MS = 850;
const STEPS = 4;

export function SearchingState({ totalMentors }: Props) {
  const t = useTranslations("mentee");
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current >= STEPS) return;
    const timer = setTimeout(() => setCurrent((c) => c + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [current]);

  const steps = [t("searchStep1"), t("searchStep2"), t("searchStep3"), t("searchStep4")];
  const progress = Math.min(100, Math.round((current / STEPS) * 100));

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-7">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-lg shadow-teal-200/50 mb-2 relative">
            <Sparkles className="w-7 h-7 text-white" />
            <div className="absolute inset-0 rounded-2xl border-2 border-teal-400/30 animate-ping" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t("searchingTitle")}</h2>
          <p className="text-sm text-slate-500">
            {t("searchingSubtitle", { total: totalMentors ?? 20 })}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-end font-mono tabular-nums">{progress}%</p>
        </div>

        {/* Steps */}
        <ul className="space-y-3">
          {steps.map((label, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li
                key={i}
                className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                  done
                    ? "text-slate-400"
                    : active
                    ? "text-slate-900 font-medium"
                    : "text-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    done
                      ? "bg-emerald-500"
                      : active
                      ? "bg-teal-500"
                      : "bg-slate-100 border border-slate-200"
                  }`}
                >
                  {done ? (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  ) : active ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : null}
                </div>
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
