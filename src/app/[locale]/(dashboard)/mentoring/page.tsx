import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { matches, users, menteeRequests } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { Plus, Target, BookOpen, Video, MapPin, MonitorSmartphone, CalendarPlus } from "lucide-react";

const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  proposed: "warning",
  active: "success",
  completed: "secondary",
  rejected: "destructive",
  cancelled: "destructive",
  accepted: "success",
};

export default async function MentoringPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as { id: string; role: string; tenantId: string };
  const isRTL = locale === "ar";

  const asMentee = db ? await db
    .select({ match: matches, mentor: users })
    .from(matches)
    .innerJoin(users, eq(matches.mentorId, users.id))
    .where(and(eq(matches.menteeId, user.id), eq(matches.tenantId, user.tenantId))) : [];

  const asMentor = db ? await db
    .select({ match: matches, mentee: users, request: menteeRequests })
    .from(matches)
    .innerJoin(users, eq(matches.menteeId, users.id))
    .leftJoin(menteeRequests, eq(matches.requestId, menteeRequests.id))
    .where(and(eq(matches.mentorId, user.id), eq(matches.tenantId, user.tenantId))) : [];

  const statusLabel = (status: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      proposed: { ar: "بانتظار القبول", en: "Awaiting Response" },
      active: { ar: "نشط", en: "Active" },
      completed: { ar: "مكتمل", en: "Completed" },
      rejected: { ar: "مرفوض", en: "Rejected" },
      cancelled: { ar: "ملغى", en: "Cancelled" },
    };
    return isRTL ? (map[status]?.ar ?? status) : (map[status]?.en ?? status);
  };

  const sessionPrefLabel = (pref: string | null) => {
    if (!pref) return null;
    const map: Record<string, { ar: string; en: string; icon: typeof Video }> = {
      virtual: { ar: "افتراضي", en: "Virtual", icon: Video },
      in_person: { ar: "حضوري", en: "In-Person", icon: MapPin },
      both: { ar: "افتراضي وحضوري", en: "Virtual & In-Person", icon: MonitorSmartphone },
    };
    return map[pref] ?? null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {isRTL ? "الإرشاد" : "Mentoring"}
        </h1>
        <Link href={`/${locale}/mentoring/request`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {isRTL ? "طلب إرشاد" : "Request Mentoring"}
          </Button>
        </Link>
      </div>

      {/* As Mentee — my mentors */}
      {asMentee.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            {isRTL ? "مرشديّ" : "My Mentors"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {asMentee.map(({ match, mentor }) => (
              <Card key={match.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{mentor.name}</p>
                          <p className="text-sm text-slate-500">{mentor.jobTitle}</p>
                        </div>
                        <Badge variant={statusColors[match.status] ?? "secondary"}>
                          {statusLabel(match.status)}
                        </Badge>
                      </div>
                      {match.matchingScore && (
                        <p className="text-xs text-teal-600 mt-1 font-medium">
                          {isRTL ? "نسبة التوافق:" : "Match Score:"} {Math.round(match.matchingScore)}%
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* As Mentor — incoming requests */}
      {asMentor.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            {isRTL ? "متدربيّ" : "My Mentees"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {asMentor.map(({ match, mentee, request }) => {
              const pref = sessionPrefLabel(request?.sessionPreference ?? null);
              const PrefIcon = pref?.icon;
              return (
                <Card key={match.id} className={match.status === "proposed" ? "border-amber-200 bg-amber-50/30" : ""}>
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback>{getInitials(mentee.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{mentee.name}</p>
                            <p className="text-sm text-slate-500">{mentee.department}</p>
                          </div>
                          <Badge variant={statusColors[match.status] ?? "secondary"}>
                            {statusLabel(match.status)}
                          </Badge>
                        </div>
                        {match.matchingScore && (
                          <p className="text-xs text-teal-600 mt-1 font-medium">
                            {isRTL ? "نسبة التوافق:" : "Match Score:"} {Math.round(match.matchingScore)}%
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Request details */}
                    {request && (
                      <div className="border-t border-slate-100 pt-3 space-y-2.5">
                        {/* Area */}
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-slate-400 leading-none mb-0.5">
                              {isRTL ? "المجال المطلوب" : "Requested Area"}
                            </p>
                            <p className="text-sm font-medium text-slate-800">
                              {isRTL ? request.desiredArea : (request.desiredAreaEn ?? request.desiredArea)}
                            </p>
                          </div>
                        </div>

                        {/* Goals */}
                        {request.goals && (
                          <div className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-slate-400 leading-none mb-0.5">
                                {isRTL ? "الأهداف" : "Goals"}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">{request.goals}</p>
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {request.description && (
                          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 leading-relaxed">
                            {request.description}
                          </p>
                        )}

                        {/* Session preference */}
                        {pref && PrefIcon && (
                          <div className="flex items-center gap-1.5">
                            <PrefIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {isRTL ? pref.ar : pref.en}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Schedule session button for active matches */}
                    {match.status === "active" && (
                      <Link href={`/${locale}/sessions/new?matchId=${match.id}`} className="block pt-1">
                        <Button size="sm" variant="outline" className="w-full gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50">
                          <CalendarPlus className="w-3.5 h-3.5" />
                          {isRTL ? "جدولة جلسة" : "Schedule Session"}
                        </Button>
                      </Link>
                    )}

                    {/* Accept / Reject */}
                    {match.status === "proposed" && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                          {isRTL ? "رفض" : "Reject"}
                        </Button>
                        <Button size="sm" className="flex-1">
                          {isRTL ? "قبول" : "Accept"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {asMentee.length === 0 && asMentor.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg mb-4">
            {isRTL ? "لا توجد علاقات إرشاد بعد" : "No mentoring relationships yet"}
          </p>
          <Link href={`/${locale}/mentoring/request`}>
            <Button>{isRTL ? "ابدأ بطلب إرشاد" : "Start by Requesting Mentoring"}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
