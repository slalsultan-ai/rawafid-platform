"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EXPERTISE_AREAS, SKILLS, WEEKDAYS } from "@/lib/constants";
import { Plus, X, Loader2, Check } from "lucide-react";

export default function MentorRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  const [step, setStep] = useState(1);
  const [areas, setAreas] = useState<Array<{ id: string; nameAr: string; nameEn: string }>>([]);
  const [skills, setSkills] = useState<Array<{ id: string; nameAr: string; nameEn: string }>>([]);
  const [availability, setAvailability] = useState<Array<{ day: string; from: string; to: string }>>([]);
  const [maxMentees, setMaxMentees] = useState(3);
  const [sessionPref, setSessionPref] = useState<"virtual" | "in_person" | "both">("both");
  const [motivation, setMotivation] = useState("");
  const [success, setSuccess] = useState(false);

  const register = trpc.mentors.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => alert(err.message),
  });

  const getName = (item: { nameAr: string; nameEn: string }) =>
    isRTL ? item.nameAr : item.nameEn;

  const toggleArea = (area: (typeof EXPERTISE_AREAS)[0]) => {
    setAreas((prev) =>
      prev.find((a) => a.id === area.id)
        ? prev.filter((a) => a.id !== area.id)
        : [...prev, area]
    );
  };

  const toggleSkill = (skill: (typeof SKILLS)[0]) => {
    setSkills((prev) =>
      prev.find((s) => s.id === skill.id)
        ? prev.filter((s) => s.id !== skill.id)
        : [...prev, skill]
    );
  };

  const addAvailability = () => {
    setAvailability((prev) => [...prev, { day: "sunday", from: "09:00", to: "17:00" }]);
  };

  const removeAvailability = (idx: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    register.mutate({
      areasOfExpertise: areas,
      skills,
      availability,
      maxMentees,
      sessionPreference: sessionPref,
      motivation,
    });
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          {isRTL ? "تم إرسال طلبك بنجاح!" : "Application Submitted!"}
        </h2>
        <p className="text-slate-500">
          {isRTL
            ? "سيتم مراجعة طلبك من قبل مسؤول الجهة وإشعارك بالنتيجة."
            : "Your application will be reviewed by the organization admin and you'll be notified."}
        </p>
        <Button onClick={() => router.push(`/${locale}`)}>
          {isRTL ? "العودة للرئيسية" : "Back to Dashboard"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isRTL ? "التسجيل كمرشد" : "Mentor Registration"}
        </h1>
        <p className="text-slate-500 mt-1">
          {isRTL ? "شارك خبرتك وساعد زملاءك في التطوير المهني" : "Share your expertise and help colleagues grow professionally"}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"}`}>
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`h-0.5 w-12 transition-colors ${step > s ? "bg-teal-600" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Expertise & Skills */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "مجالات الخبرة والمهارات" : "Expertise & Skills"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                {isRTL ? "مجالات الخبرة (اختر 1-3)" : "Areas of Expertise (choose 1-3)"}
              </p>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_AREAS.map((area) => {
                  const selected = areas.find((a) => a.id === area.id);
                  return (
                    <button
                      key={area.id}
                      onClick={() => toggleArea(area)}
                      disabled={!selected && areas.length >= 3}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${selected ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-300 hover:border-teal-400 disabled:opacity-40"}`}
                    >
                      {getName(area)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                {isRTL ? "المهارات (اختر ما ينطبق)" : "Skills (select all that apply)"}
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => {
                  const selected = skills.find((s) => s.id === skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${selected ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"}`}
                    >
                      {getName(skill)}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button onClick={() => setStep(2)} disabled={areas.length === 0} className="w-full">
              {isRTL ? "التالي" : "Next"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Availability */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "التوفر والتفضيلات" : "Availability & Preferences"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                {isRTL ? "أوقات التوفر" : "Available Times"}
              </p>
              <div className="space-y-3">
                {availability.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <select
                      value={slot.day}
                      onChange={(e) => {
                        const updated = [...availability];
                        updated[idx] = { ...slot, day: e.target.value };
                        setAvailability(updated);
                      }}
                      className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm"
                    >
                      {WEEKDAYS.map((d) => (
                        <option key={d.id} value={d.id}>{isRTL ? d.nameAr : d.nameEn}</option>
                      ))}
                    </select>
                    <Input
                      type="time"
                      value={slot.from}
                      onChange={(e) => {
                        const updated = [...availability];
                        updated[idx] = { ...slot, from: e.target.value };
                        setAvailability(updated);
                      }}
                      className="w-28"
                    />
                    <span className="text-slate-400">—</span>
                    <Input
                      type="time"
                      value={slot.to}
                      onChange={(e) => {
                        const updated = [...availability];
                        updated[idx] = { ...slot, to: e.target.value };
                        setAvailability(updated);
                      }}
                      className="w-28"
                    />
                    <button onClick={() => removeAvailability(idx)} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addAvailability} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {isRTL ? "أضف وقت" : "Add slot"}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                {isRTL ? "أقصى عدد متدربين" : "Max Mentees"}
              </p>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMaxMentees(n)}
                    className={`w-12 h-10 rounded-lg border text-sm font-bold transition-colors ${maxMentees === n ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-300"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

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

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                {isRTL ? "رجوع" : "Back"}
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                {isRTL ? "التالي" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Motivation */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "دافع الإرشاد" : "Mentoring Motivation"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-slate-500 mb-3">
                {isRTL
                  ? "أخبرنا ما الذي يدفعك لتقديم الإرشاد وماذا تأمل أن يحقق المتدربون معك"
                  : "Tell us what drives you to mentor and what you hope mentees achieve with you"}
              </p>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={5}
                placeholder={isRTL
                  ? "مثال: أؤمن بأهمية مشاركة الخبرة لبناء جيل مهني قادر..."
                  : "e.g., I believe in the importance of sharing expertise to build capable professionals..."}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-slate-400 mt-1">{motivation.length}/500</p>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-slate-700">{isRTL ? "ملخص التسجيل" : "Registration Summary"}</p>
              <div className="flex flex-wrap gap-1">
                {areas.map((a) => <Badge key={a.id} variant="default">{getName(a)}</Badge>)}
              </div>
              <div className="flex flex-wrap gap-1">
                {skills.map((s) => <Badge key={s.id} variant="secondary">{getName(s)}</Badge>)}
              </div>
              <p className="text-xs text-slate-500">
                {isRTL ? `أقصى ${maxMentees} متدربين` : `Max ${maxMentees} mentees`} •{" "}
                {sessionPref === "virtual" ? (isRTL ? "افتراضي" : "Virtual")
                  : sessionPref === "in_person" ? (isRTL ? "حضوري" : "In Person")
                  : isRTL ? "كلاهما" : "Both"}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                {isRTL ? "رجوع" : "Back"}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={motivation.length < 10 || register.isPending}
                className="flex-1"
              >
                {register.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRTL ? "إرسال الطلب" : "Submit Application")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
