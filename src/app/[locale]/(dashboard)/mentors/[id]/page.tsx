import { auth } from "@/server/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/server/db";
import { mentorProfiles, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { Briefcase, Building, Star, Clock, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const isRTL = locale === "ar";

  const result = db ? await db
    .select({ profile: mentorProfiles, user: users })
    .from(mentorProfiles)
    .innerJoin(users, eq(mentorProfiles.userId, users.id))
    .where(eq(mentorProfiles.userId, id))
    .limit(1)
    .then((r) => r[0]) : null;

  if (!result) notFound();

  const { profile, user } = result;
  const areas = (profile.areasOfExpertise as Array<{ id: string; nameAr: string; nameEn: string }>) ?? [];
  const skills = (profile.skills as Array<{ id: string; nameAr: string; nameEn: string }>) ?? [];
  const availability = (profile.availability as Array<{ day: string; from: string; to: string }>) ?? [];

  const dayLabels: Record<string, { ar: string; en: string }> = {
    sunday: { ar: "الأحد", en: "Sunday" },
    monday: { ar: "الاثنين", en: "Monday" },
    tuesday: { ar: "الثلاثاء", en: "Tuesday" },
    wednesday: { ar: "الأربعاء", en: "Wednesday" },
    thursday: { ar: "الخميس", en: "Thursday" },
    friday: { ar: "الجمعة", en: "Friday" },
    saturday: { ar: "السبت", en: "Saturday" },
  };

  const getLabel = (item: { nameAr: string; nameEn: string }) =>
    isRTL ? item.nameAr : item.nameEn;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/${locale}/mentors`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors">
        <ArrowRight className={`w-4 h-4 ${isRTL ? "" : "rotate-180"}`} />
        {isRTL ? "العودة للمرشدين" : "Back to Mentors"}
      </Link>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-7">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className="text-2xl font-bold">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                  {user.nameEn && <p className="text-slate-400 text-sm mt-0.5">{user.nameEn}</p>}
                </div>
                <Badge variant={profile.status === "approved" ? "success" : "warning"}>
                  {isRTL ? (profile.status === "approved" ? "معتمد" : "قيد المراجعة") : (profile.status === "approved" ? "Approved" : "Pending")}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 mt-3">
                {user.jobTitle && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {user.jobTitle}
                  </span>
                )}
                {user.department && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Building className="w-4 h-4 text-slate-400" />
                    {user.department}
                  </span>
                )}
                {user.yearsOfExperience && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Star className="w-4 h-4 text-slate-400" />
                    {user.yearsOfExperience} {isRTL ? "سنة خبرة" : "years exp."}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Users className="w-4 h-4 text-slate-400" />
                  {isRTL ? `يقبل حتى ${profile.maxMentees} متدربين` : `Up to ${profile.maxMentees} mentees`}
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                <Badge variant={profile.sessionPreference === "virtual" ? "default" : profile.sessionPreference === "in_person" ? "secondary" : "outline"}>
                  {profile.sessionPreference === "virtual"
                    ? isRTL ? "جلسات افتراضية" : "Virtual Sessions"
                    : profile.sessionPreference === "in_person"
                    ? isRTL ? "جلسات حضورية" : "In-Person Sessions"
                    : isRTL ? "افتراضي وحضوري" : "Both"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Motivation */}
          {profile.motivation && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {isRTL ? "دافع الإرشاد" : "Mentoring Motivation"}
              </p>
              <p className="text-slate-700 leading-relaxed">{profile.motivation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Areas of Expertise */}
      {areas.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-slate-700 mb-4">
              {isRTL ? "مجالات الخبرة" : "Areas of Expertise"}
            </p>
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <Badge key={area.id} variant="default" className="px-3 py-1 text-sm">
                  {getLabel(area)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-slate-700 mb-4">
              {isRTL ? "المهارات" : "Skills"}
            </p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="text-sm text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full"
                >
                  {getLabel(skill)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability */}
      {availability.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-slate-700 mb-4">
              {isRTL ? "أوقات التوفر" : "Availability"}
            </p>
            <div className="flex flex-wrap gap-2">
              {availability.map((slot, i) => (
                <span key={i} className="flex items-center gap-1.5 text-sm bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {isRTL ? dayLabels[slot.day]?.ar : dayLabels[slot.day]?.en} — {slot.from} إلى {slot.to}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="flex gap-3">
        <Link href={`/${locale}/mentoring/request`} className="flex-1">
          <Button className="w-full h-12 text-base gap-2">
            {isRTL ? "طلب إرشاد من هذا المرشد" : "Request Mentoring from This Mentor"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
