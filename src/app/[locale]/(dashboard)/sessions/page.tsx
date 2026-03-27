import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { sessions, matches, users } from "@/server/db/schema";
import { eq, and, or, desc, inArray } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import {
  Plus,
  CalendarDays,
  Clock,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const statusConfig: Record<string, { color: "warning" | "success" | "secondary" | "destructive" | "default"; arLabel: string; enLabel: string }> = {
  scheduled: { color: "default", arLabel: "مجدولة", enLabel: "Scheduled" },
  preparing: { color: "warning", arLabel: "قيد التحضير", enLabel: "Preparing" },
  completed: { color: "success", arLabel: "مكتملة", enLabel: "Completed" },
  cancelled: { color: "destructive", arLabel: "ملغاة", enLabel: "Cancelled" },
};

export default async function SessionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as { id: string; role: string; tenantId: string };
  const isRTL = locale === "ar";

  // Get all matches for this user
  const myMatches = db
    ? await db
        .select({ id: matches.id })
        .from(matches)
        .where(
          and(
            or(eq(matches.mentorId, user.id), eq(matches.menteeId, user.id)),
            eq(matches.tenantId, user.tenantId)
          )
        )
    : [];

  const matchIds = myMatches.map((m) => m.id);

  const allSessions =
    matchIds.length > 0 && db
      ? await db
          .select({ session: sessions, match: matches })
          .from(sessions)
          .innerJoin(matches, eq(sessions.matchId, matches.id))
          .where(inArray(sessions.matchId, matchIds))
          .orderBy(desc(sessions.scheduledAt))
      : [];

  // Batch fetch all user info
  const userIds = [
    ...new Set(allSessions.flatMap((s) => [s.match.mentorId, s.match.menteeId])),
  ];
  const matchUsers =
    userIds.length > 0 && db
      ? await db
          .select({ id: users.id, name: users.name, jobTitle: users.jobTitle })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];
  const userMap = Object.fromEntries(matchUsers.map((u) => [u.id, u]));

  const enriched = allSessions.map(({ session: s, match }) => {
    const otherUserId = match.mentorId === user.id ? match.menteeId : match.mentorId;
    const isMentor = match.mentorId === user.id;
    return { session: s, match, otherUser: userMap[otherUserId], isMentor };
  });

  const upcoming = enriched.filter(
    (e) => e.session.status === "scheduled" || e.session.status === "preparing"
  );
  const past = enriched.filter(
    (e) => e.session.status === "completed" || e.session.status === "cancelled"
  );

  const ArrowIcon = isRTL ? ChevronRight : ChevronLeft;

  function SessionCard({ session: s, otherUser, isMentor }: (typeof enriched)[0]) {
    const cfg = statusConfig[s.status];
    const dt = new Date(s.scheduledAt);
    const dateStr = dt.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
    });
    const timeStr = dt.toLocaleTimeString(isRTL ? "ar-SA" : "en-US", {
      hour: "2-digit", minute: "2-digit",
    });

    return (
      <Link href={`/${locale}/sessions/${s.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              {/* Date block */}
              <div className="shrink-0 w-14 text-center">
                <div className="text-2xl font-bold text-teal-600 leading-none">
                  {dt.getDate()}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {dt.toLocaleDateString(isRTL ? "ar-SA" : "en-US", { month: "short" })}
                </div>
                <div className="text-xs text-slate-400">
                  {dt.getFullYear()}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">{getInitials(otherUser?.name ?? "?")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate text-sm">{otherUser?.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {isMentor
                          ? isRTL ? "متدرب" : "Mentee"
                          : isRTL ? "مرشد" : "Mentor"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={cfg.color} className="shrink-0">
                    {isRTL ? cfg.arLabel : cfg.enLabel}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {timeStr} — {s.durationMinutes} {isRTL ? "د" : "min"}
                  </span>
                  <span className="flex items-center gap-1">
                    {s.type === "virtual"
                      ? <><Video className="w-3.5 h-3.5 text-teal-500" />{isRTL ? "افتراضية" : "Virtual"}</>
                      : <><MapPin className="w-3.5 h-3.5 text-violet-500" />{isRTL ? "حضورية" : "In-Person"}</>}
                  </span>
                  {s.locationOrLink && (
                    <span className="truncate max-w-[160px] text-teal-600">{s.locationOrLink}</span>
                  )}
                </div>
              </div>

              <ArrowIcon className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRTL ? "الجلسات" : "Sessions"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isRTL ? "تابع جلساتك القادمة والسابقة" : "Track your upcoming and past sessions"}
          </p>
        </div>
        <Link href={`/${locale}/sessions/new`}>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {isRTL ? "جدولة جلسة" : "Schedule Session"}
          </Button>
        </Link>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-teal-500" />
          {isRTL ? "القادمة" : "Upcoming"}
          {upcoming.length > 0 && (
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {upcoming.length}
            </span>
          )}
        </h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-4">
              {isRTL ? "لا توجد جلسات قادمة" : "No upcoming sessions"}
            </p>
            <Link href={`/${locale}/sessions/new`}>
              <Button size="sm" variant="outline">
                {isRTL ? "جدولة جلسة الآن" : "Schedule a Session"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => <SessionCard key={e.session.id} {...e} />)}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            {isRTL ? "السابقة" : "Past Sessions"}
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
              {past.length}
            </span>
          </h2>
          <div className="space-y-3">
            {past.map((e) => <SessionCard key={e.session.id} {...e} />)}
          </div>
        </section>
      )}
    </div>
  );
}
