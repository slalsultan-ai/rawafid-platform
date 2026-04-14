"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Weights = {
  domain: number;
  skills: number;
  experience: number;
  availability: number;
  rating: number;
};

const DEFAULT_WEIGHTS: Weights = {
  domain: 0.3,
  skills: 0.25,
  experience: 0.2,
  availability: 0.15,
  rating: 0.1,
};

export default function AdminSettingsPage() {
  const { data, isLoading, refetch } = trpc.admin.getSettings.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const initial = (data ?? {}) as {
    allowSameDepartmentMatch?: boolean;
    maxMenteesPerMentor?: number;
    matchingWeights?: Weights;
  };

  return (
    <SettingsForm
      initialAllowSameDept={initial.allowSameDepartmentMatch ?? true}
      initialMaxMentees={initial.maxMenteesPerMentor ?? 5}
      initialWeights={initial.matchingWeights ?? DEFAULT_WEIGHTS}
      onSaved={() => refetch()}
    />
  );
}

function SettingsForm({
  initialAllowSameDept,
  initialMaxMentees,
  initialWeights,
  onSaved,
}: {
  initialAllowSameDept: boolean;
  initialMaxMentees: number;
  initialWeights: Weights;
  onSaved: () => void;
}) {
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === "ar";
  const t = useTranslations("admin");

  const [allowSameDept, setAllowSameDept] = useState(initialAllowSameDept);
  const [maxMentees, setMaxMentees] = useState(initialMaxMentees);
  const [weights, setWeights] = useState<Weights>(initialWeights);

  const update = trpc.admin.updateSettings.useMutation({ onSuccess: onSaved });

  const sum = Object.values(weights).reduce((a, b) => a + b, 0);

  function save() {
    update.mutate({
      allowSameDepartmentMatch: allowSameDept,
      maxMenteesPerMentor: maxMentees,
      matchingWeights: weights,
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("settingsTitle")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-700">{t("allowSameDept")}</span>
            <input
              type="checkbox"
              checked={allowSameDept}
              onChange={(e) => setAllowSameDept(e.target.checked)}
              className="w-4 h-4"
            />
          </label>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-700">{t("maxMenteesGlobal")}</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={maxMentees}
              onChange={(e) => setMaxMentees(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("weights")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["domain", t("weightDomain")],
              ["skills", t("weightSkills")],
              ["experience", t("weightExperience")],
              ["availability", t("weightAvailability")],
              ["rating", t("weightRating")],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-32">{label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={weights[key]}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))
                }
                className="flex-1"
                dir={isRTL ? "rtl" : "ltr"}
              />
              <span className="text-sm font-mono text-slate-500 w-12 text-end">
                {Math.round(weights[key] * 100)}%
              </span>
            </div>
          ))}
          <p className="text-xs text-slate-400">{Math.round(sum * 100)}%</p>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={update.isPending}>
        {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("saveSettings")}
      </Button>
    </div>
  );
}
