"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MentorCard } from "@/components/mentors/mentor-card";
import { SearchingState } from "@/components/mentors/searching-state";
import { EXPERTISE_AREAS, SKILLS } from "@/lib/constants";
import { Loader2, Search } from "lucide-react";

const MIN_SEARCH_MS = 3600;

export default function MentoringRequestPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  const t = useTranslations("mentee");
  const tCommon = useTranslations("common");
  const tMentor = useTranslations("mentor");

  const [step, setStep] = useState<"form" | "searching" | "results">("form");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [desiredArea, setDesiredArea] = useState("");
  const [desiredSkills, setDesiredSkills] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [goals, setGoals] = useState("");
  const [sessionPref, setSessionPref] = useState<"virtual" | "in_person" | "both">("both");
  const [searchStartedAt, setSearchStartedAt] = useState<number | null>(null);

  const createRequest = trpc.mentees.createRequest.useMutation({
    onSuccess: (data) => {
      setRequestId(data.id);
      setStep("searching");
      setSearchStartedAt(Date.now());
    },
    onError: (err) => alert(err.message),
  });

  const { data: suggestions, isLoading: loadingSuggestions } = trpc.matching.getSuggestions.useQuery(
    { requestId: requestId! },
    { enabled: !!requestId }
  );

  // Hold on the searching animation for at least MIN_SEARCH_MS,
  // then reveal results once both the fake delay and the real query are done.
  useEffect(() => {
    if (step !== "searching") return;
    if (loadingSuggestions || searchStartedAt == null) return;
    const elapsed = Date.now() - searchStartedAt;
    const remaining = Math.max(0, MIN_SEARCH_MS - elapsed);
    const timer = setTimeout(() => setStep("results"), remaining);
    return () => clearTimeout(timer);
  }, [step, loadingSuggestions, searchStartedAt]);

  const sendRequest = trpc.matching.sendRequest.useMutation({
    onSuccess: () => {
      alert(t("requestSent"));
      router.push(`/${locale}/mentoring`);
    },
    onError: (err) => alert(err.message),
  });

  const getName = (item: { nameAr: string; nameEn: string }) =>
    isRTL ? item.nameAr : item.nameEn;

  const toggleSkill = (id: string) => {
    setDesiredSkills((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSubmitForm = () => {
    if (!desiredArea) return;
    createRequest.mutate({
      desiredArea,
      desiredSkills,
      description,
      goals,
      sessionPreference: sessionPref,
    });
  };

  if (step === "searching") {
    return <SearchingState />;
  }

  if (step === "results") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("suggestedMentors")}</h1>
          <p className="text-slate-500 mt-1">{t("matchingResults")}</p>
        </div>

        {suggestions?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">{t("noResults")}</p>
          </div>
        )}

        {!loadingSuggestions && suggestions && suggestions.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {suggestions.map((s) =>
              s.mentor ? (
                <MentorCard
                  key={s.mentorUserId}
                  user={s.mentor.user}
                  profile={s.mentor.profile}
                  score={s.score}
                  locale={locale}
                  actionLabel={tMentor("sendRequest")}
                  viewLabel={tMentor("viewProfile")}
                  yearsLabel={tCommon("yearsExp")}
                  prefVirtual={tMentor("virtual")}
                  prefInPerson={tMentor("inPerson")}
                  prefBoth={tMentor("both")}
                  onSelect={() =>
                    sendRequest.mutate({
                      requestId: requestId!,
                      mentorUserId: s.mentorUserId,
                    })
                  }
                />
              ) : null
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("requestTitle")}</h1>
        <p className="text-slate-500 mt-1">{t("requestSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("desiredArea")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">{t("desiredArea")} *</p>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_AREAS.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setDesiredArea(area.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    desiredArea === area.id
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-slate-600 border-slate-300 hover:border-teal-400"
                  }`}
                >
                  {getName(area)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">{t("desiredSkills")}</p>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    desiredSkills.includes(skill.id)
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"
                  }`}
                >
                  {getName(skill)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">{t("description")}</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("descriptionPlaceholder")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">{t("goals")}</p>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
              placeholder={t("goalsPlaceholder")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">{tMentor("sessionPreference")}</p>
            <div className="flex gap-2">
              {(["virtual", "in_person", "both"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSessionPref(v)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    sessionPref === v
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-slate-600 border-slate-300"
                  }`}
                >
                  {v === "virtual" ? tMentor("virtual") : v === "in_person" ? tMentor("inPerson") : tMentor("both")}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmitForm}
            disabled={!desiredArea || createRequest.isPending}
            className="w-full gap-2"
          >
            {createRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {t("submitRequest")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
