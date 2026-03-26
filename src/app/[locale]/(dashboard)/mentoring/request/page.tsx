"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MentorCard } from "@/components/mentors/mentor-card";
import { EXPERTISE_AREAS, SKILLS } from "@/lib/constants";
import { Loader2, Search } from "lucide-react";

export default function MentoringRequestPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  const [step, setStep] = useState<"form" | "results">("form");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [desiredArea, setDesiredArea] = useState("");
  const [desiredSkills, setDesiredSkills] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [goals, setGoals] = useState("");
  const [sessionPref, setSessionPref] = useState<"virtual" | "in_person" | "both">("both");

  const createRequest = trpc.mentees.createRequest.useMutation({
    onSuccess: (data) => {
      setRequestId(data.id);
      setStep("results");
    },
    onError: (err) => alert(err.message),
  });

  const { data: suggestions, isLoading: loadingSuggestions } = trpc.matching.getSuggestions.useQuery(
    { requestId: requestId! },
    { enabled: !!requestId }
  );

  const sendRequest = trpc.matching.sendRequest.useMutation({
    onSuccess: () => {
      alert(isRTL ? "تم إرسال الطلب بنجاح! سيتم إشعارك عند قبول المرشد." : "Request sent! You'll be notified when the mentor responds.");
      router.push(`/${locale}/mentoring`);
    },
  });

  const getAreaName = (area: { nameAr: string; nameEn: string }) =>
    isRTL ? area.nameAr : area.nameEn;

  const toggleSkill = (id: string) => {
    setDesiredSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
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

  if (step === "results") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRTL ? "المرشدون المقترحون" : "Suggested Mentors"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? "مرتبون حسب نسبة التوافق مع احتياجك" : "Ranked by compatibility with your needs"}
          </p>
        </div>

        {loadingSuggestions && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        )}

        {!loadingSuggestions && suggestions?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">{isRTL ? "لا توجد نتائج مطابقة حالياً" : "No matching mentors found at this time"}</p>
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
                  actionLabel={isRTL ? "إرسال طلب" : "Send Request"}
                  onSelect={() =>
                    sendRequest.mutate({
                      requestId: requestId!,
                      mentorUserId: s.mentorUserId,
                      matchingScore: s.score,
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
        <h1 className="text-2xl font-bold text-slate-900">
          {isRTL ? "طلب برنامج إرشاد" : "Request Mentoring Program"}
        </h1>
        <p className="text-slate-500 mt-1">
          {isRTL
            ? "حدد احتياجاتك وسنقترح لك أنسب المرشدين"
            : "Define your needs and we'll suggest the best mentors for you"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "تفاصيل الطلب" : "Request Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Area */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              {isRTL ? "مجال الإرشاد المطلوب *" : "Desired Mentoring Area *"}
            </p>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_AREAS.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setDesiredArea(area.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${desiredArea === area.id ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-300 hover:border-teal-400"}`}
                >
                  {getAreaName(area)}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              {isRTL ? "المهارات المطلوبة (اختياري)" : "Desired Skills (optional)"}
            </p>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${desiredSkills.includes(skill.id) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"}`}
                >
                  {getAreaName(skill)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {isRTL ? "وصف الاحتياج" : "Need Description"}
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={isRTL ? "صف التحديات التي تواجهها..." : "Describe the challenges you're facing..."}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Goals */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {isRTL ? "الأهداف المرجوة" : "Expected Goals"}
            </p>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
              placeholder={isRTL ? "ما الذي تريد تحقيقه؟" : "What do you want to achieve?"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Session Preference */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              {isRTL ? "تفضيل نوع الجلسة" : "Session Preference"}
            </p>
            <div className="flex gap-2">
              {[
                { v: "virtual", ar: "افتراضية", en: "Virtual" },
                { v: "in_person", ar: "حضورية", en: "In Person" },
                { v: "both", ar: "كلاهما", en: "Both" },
              ].map(({ v, ar, en }) => (
                <button
                  key={v}
                  onClick={() => setSessionPref(v as typeof sessionPref)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${sessionPref === v ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-300"}`}
                >
                  {isRTL ? ar : en}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmitForm}
            disabled={!desiredArea || createRequest.isPending}
            className="w-full gap-2"
          >
            {createRequest.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {isRTL ? "ابحث عن مرشد مناسب" : "Find Matching Mentor"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
