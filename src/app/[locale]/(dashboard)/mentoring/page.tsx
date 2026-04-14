import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { matches, users, menteeRequests } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import {
  Plus,
  Target,
  BookOpen,
  Video,
  MapPin,
  MonitorSmartphone,
  CalendarPlus,
  Sparkles,
} from "lucide-react";
import { MatchActions } from "@/components/mentoring/match-actions";

const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  proposed: "warning",
  active: "success",
  completed: "secondary",
  rejected: "destructive",
  cancelled: "destructive",
  accepted: "success",
};

export default async function MentoringPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as { id: string; role: string; tenantId: string };
  const isRTL = locale === "ar";
  const t = await getTranslations("match");
  const tCommon = await getTranslations("common");
  const tSession = await getTranslations("session");
  const tMentee = await getTranslations("mentee");

  const asMentee = db
    ? await db
        .select({ match: matches, mentor: users })
        .from(matches)
        .innerJoin(users, eq(matches.mentorId, users.id))
        .where(and(eq(matches.menteeId, user.id), eq(matches.tenantId, user.tenantId)))
    : [];

  const asMentor = db
    ? await db
        .select({ match: matches, mentee: users, request: menteeRequests })
        .from(matches)
        .innerJoin(users, eq(matches.menteeId, users.id))
        .leftJoin(menteeRequests, eq(matches.requestId, menteeRequests.id))
        .where(and(eq(matches.mentorId, user.id), eq(matches.tenantId, user.tenantId)))
    : [];

  const statusLabel = (status: string) => {
    if (status === "proposed") return t("proposed");
    if (status === "active") return t("active");
    if (status === "completed") return t("completed");
    if (status === "rejected") return t("rejected");
    if (status === "cancelled") return t("cancelled");
    return status;
  };

  const sessionPrefMeta = (pref: string | null) => {
    if (!pref) return null;
    if (pref === "virtual") return { label: tSession("virtual"), icon: Video };
    if (pref === "in_person") return { label: tSession("inPerson"), icon: MapPin };
    return { label: `${tSession("virtual")} & ${tSession("inPerson")}`, icon: MonitorSmartphone };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t("myRelationships")}</h1>
        <Link href={`/${locale}/mentoring/request`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {tMentee("requestMentoring")}
          </Button>
        </Link>
      </div>

      {asMentee.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">{t("asMentee")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {asMentee.map(({ match, mentor }) => (
              <Card key={match.id}>
                <CardContent className="p-5 space-y-3">
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
                      {match.matchingScore != null && (
                        <p className="text-xs text-teal-600 mt-1 font-medium">
                          {tCommon("matchingScore")}: {Math.round(match.matchingScore)}%
                        </p>
                      )}
                    </div>
                  </div>
                  {match.status === "active" && (
                    <div className="flex gap-2 pt-1">
                      <Link href={`/${locale}/mentoring/${match.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          {t("openPlan")}
                        </Button>
                      </Link>
                      <Link href={`/${locale}/sessions/new?matchId=${match.id}`} className="flex-1">
                        <Button size="sm" className="w-full gap-1.5">
                          <CalendarPlus className="w-3.5 h-3.5" />
                          {t("newSession")}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {asMentor.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">{t("asMentor")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {asMentor.map(({ match, mentee, request }) => {
              const pref = sessionPrefMeta(request?.sessionPreference ?? null);
              const PrefIcon = pref?.icon;
              return (
                <Card
                  key={match.id}
                  className={match.status === "proposed" ? "border-amber-200 bg-amber-50/30" : ""}
                >
                  <CardContent className="p-5 space-y-4">
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
                        {match.matchingScore != null && (
                          <p className="text-xs text-teal-600 mt-1 font-medium">
                            {tCommon("matchingScore")}: {Math.round(match.matchingScore)}%
                          </p>
                        )}
                      </div>
                    </div>

                    {request && (
                      <div className="border-t border-slate-100 pt-3 space-y-2.5">
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-slate-400 leading-none mb-0.5">
                              {tMentee("desiredArea")}
                            </p>
                            <p className="text-sm font-medium text-slate-800">
                              {isRTL ? request.desiredArea : request.desiredAreaEn ?? request.desiredArea}
                            </p>
                          </div>
                        </div>

                        {request.goals && (
                          <div className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-slate-400 leading-none mb-0.5">
                                {tMentee("goals")}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">{request.goals}</p>
                            </div>
                          </div>
                        )}

                        {request.description && (
                          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 leading-relaxed">
                            {request.description}
                          </p>
                        )}

                        {pref && PrefIcon && (
                          <div className="flex items-center gap-1.5">
                            <PrefIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500">{pref.label}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {match.status === "active" && (
                      <div className="flex gap-2 pt-1">
                        <Link href={`/${locale}/mentoring/${match.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {t("openPlan")}
                          </Button>
                        </Link>
                        <Link href={`/${locale}/sessions/new?matchId=${match.id}`} className="flex-1">
                          <Button size="sm" className="w-full gap-1.5">
                            <CalendarPlus className="w-3.5 h-3.5" />
                            {t("newSession")}
                          </Button>
                        </Link>
                      </div>
                    )}

                    {match.status === "proposed" && (
                      <MatchActions matchId={match.id} isRTL={isRTL} />
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
          <p className="text-slate-500 text-lg mb-4">{t("noRelationships")}</p>
          <Link href={`/${locale}/mentoring/request`}>
            <Button>{tMentee("requestMentoring")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
