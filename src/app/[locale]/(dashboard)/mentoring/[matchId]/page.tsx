"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Target, CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

type GoalStatus = "not_started" | "in_progress" | "completed" | "deferred";

const statusColor: Record<GoalStatus, "default" | "warning" | "success" | "secondary"> = {
  not_started: "secondary",
  in_progress: "warning",
  completed: "success",
  deferred: "default",
};

const STATUS_KEY: Record<GoalStatus, "notStarted" | "inProgress" | "completed" | "deferred"> = {
  not_started: "notStarted",
  in_progress: "inProgress",
  completed: "completed",
  deferred: "deferred",
};

export default function DevelopmentPlanPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const locale = params.locale as string;

  const t = useTranslations("plan");
  const tCommon = useTranslations("common");
  const tMatch = useTranslations("match");

  const { data, isLoading, refetch } = trpc.developmentPlans.getForMatch.useQuery({ matchId });
  const create = trpc.developmentPlans.getOrCreateForMatch.useMutation({ onSuccess: () => refetch() });
  const addGoal = trpc.developmentPlans.addGoal.useMutation({ onSuccess: () => refetch() });
  const updateGoal = trpc.developmentPlans.updateGoalStatus.useMutation({ onSuccess: () => refetch() });
  const addMilestone = trpc.developmentPlans.addMilestone.useMutation({ onSuccess: () => refetch() });
  const updateMilestone = trpc.developmentPlans.updateMilestoneStatus.useMutation({ onSuccess: () => refetch() });

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [milestoneInput, setMilestoneInput] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <Target className="w-12 h-12 text-slate-300 mx-auto" />
        <p className="text-slate-500">{t("noPlan")}</p>
        <Button onClick={() => create.mutate({ matchId })} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("createPlan")}
        </Button>
      </div>
    );
  }

  const { goals, milestones } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/${locale}/mentoring`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600"
        >
          <ArrowRight className={`w-4 h-4 ${locale === "ar" ? "" : "rotate-180"}`} />
          {tMatch("myRelationships")}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-3">{t("title")}</h1>
        <p className="text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-slate-500 text-sm">
            {tCommon("noResults")}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {goals.map((goal) => {
          const goalMilestones = milestones[goal.id] ?? [];
          const completed = goalMilestones.filter((m) => m.status === "completed").length;
          const progress = goalMilestones.length === 0 ? 0 : Math.round((completed / goalMilestones.length) * 100);
          return (
            <Card key={goal.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                    {goal.description && (
                      <p className="text-sm text-slate-500 mt-1">{goal.description}</p>
                    )}
                  </div>
                  <Badge variant={statusColor[goal.status as GoalStatus]}>
                    {t(STATUS_KEY[goal.status as GoalStatus])}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {(["not_started", "in_progress", "completed", "deferred"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateGoal.mutate({ goalId: goal.id, status: s })}
                      className={`text-xs px-2 py-1 rounded ${goal.status === s ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      {t(STATUS_KEY[s])}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>{t("milestones")}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {goalMilestones.map((m) => {
                    const Icon =
                      m.status === "completed"
                        ? CheckCircle2
                        : m.status === "in_progress"
                        ? Clock
                        : Circle;
                    return (
                      <li key={m.id} className="flex items-center gap-2 text-sm">
                        <button
                          onClick={() =>
                            updateMilestone.mutate({
                              milestoneId: m.id,
                              status:
                                m.status === "completed"
                                  ? "in_progress"
                                  : m.status === "in_progress"
                                  ? "completed"
                                  : "in_progress",
                            })
                          }
                          className="text-slate-500 hover:text-teal-600"
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              m.status === "completed" ? "text-emerald-500" : ""
                            }`}
                          />
                        </button>
                        <span
                          className={
                            m.status === "completed"
                              ? "line-through text-slate-400"
                              : "text-slate-700"
                          }
                        >
                          {m.title}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex gap-2">
                  <Input
                    placeholder={t("milestoneTitle")}
                    value={milestoneInput[goal.id] ?? ""}
                    onChange={(e) =>
                      setMilestoneInput((prev) => ({ ...prev, [goal.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const title = milestoneInput[goal.id]?.trim();
                      if (!title) return;
                      addMilestone.mutate({ goalId: goal.id, title });
                      setMilestoneInput((prev) => ({ ...prev, [goal.id]: "" }));
                    }}
                  >
                    {tCommon("submit")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAddGoal ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder={t("goalTitle")}
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!newGoalTitle.trim()) return;
                  addGoal.mutate({ planId: data.plan.id, title: newGoalTitle.trim() });
                  setNewGoalTitle("");
                  setShowAddGoal(false);
                }}
              >
                {tCommon("submit")}
              </Button>
              <Button variant="outline" onClick={() => setShowAddGoal(false)}>
                {tCommon("cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowAddGoal(true)} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          {t("addGoal")}
        </Button>
      )}
    </div>
  );
}
