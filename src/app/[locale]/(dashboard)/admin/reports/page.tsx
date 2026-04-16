import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import {
  users,
  mentorProfiles,
  matches,
  sessions,
  sessionReviews,
  developmentGoals,
  menteeRequests,
} from "@/server/db/schema";
import { eq, and, count, avg, sql, desc, inArray } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/admin/stats-card";
import { ExportReportButton } from "@/components/admin/export-report-button";
import {
  Users,
  UserCheck,
  BookOpen,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as { id: string; role: string; tenantId: string };
  if (!["org_admin", "super_admin"].includes(user.role)) redirect(`/${locale}`);

  const t = await getTranslations("admin");
  const tenantId = user.tenantId;

  const [
    totalUsers,
    activeMentors,
    activeMatches,
    completedSessions,
    scheduledSessions,
    cancelledSessions,
    avgRatingRow,
    topAreas,
    topMentorsRows,
    goalCompletion,
  ] = db
    ? await Promise.all([
        db.select({ count: count() }).from(users).where(eq(users.tenantId, tenantId)).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ count: count() }).from(mentorProfiles).where(and(eq(mentorProfiles.tenantId, tenantId), eq(mentorProfiles.status, "approved"))).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ count: count() }).from(matches).where(and(eq(matches.tenantId, tenantId), eq(matches.status, "active"))).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ count: count() }).from(sessions).where(and(eq(sessions.tenantId, tenantId), eq(sessions.status, "completed"))).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ count: count() }).from(sessions).where(and(eq(sessions.tenantId, tenantId), eq(sessions.status, "scheduled"))).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ count: count() }).from(sessions).where(and(eq(sessions.tenantId, tenantId), eq(sessions.status, "cancelled"))).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ avg: avg(sessionReviews.overallRating) }).from(sessionReviews).where(eq(sessionReviews.tenantId, tenantId)).then((r) => Number(r[0]?.avg ?? 0)),
        db
          .select({ area: menteeRequests.desiredArea, count: count() })
          .from(menteeRequests)
          .where(eq(menteeRequests.tenantId, tenantId))
          .groupBy(menteeRequests.desiredArea)
          .orderBy(desc(count()))
          .limit(5),
        db
          .select({ mentorId: matches.mentorId, count: count() })
          .from(matches)
          .where(eq(matches.tenantId, tenantId))
          .groupBy(matches.mentorId)
          .orderBy(desc(count()))
          .limit(5),
        db
          .select({
            total: count(),
            completed: sql<number>`SUM(CASE WHEN ${developmentGoals.status} = 'completed' THEN 1 ELSE 0 END)`,
          })
          .from(developmentGoals)
          .where(eq(developmentGoals.tenantId, tenantId))
          .then((r) => r[0] ?? { total: 0, completed: 0 }),
      ])
    : [0, 0, 0, 0, 0, 0, 0, [], [], { total: 0, completed: 0 }];

  const dbRef = db;
  const mentorRows = topMentorsRows as Array<{ mentorId: string; count: number }>;
  const mentorIds = mentorRows.map((r) => r.mentorId);
  const mentorUsers = dbRef && mentorIds.length > 0
    ? await dbRef
        .select({ id: users.id, name: users.name, jobTitle: users.jobTitle })
        .from(users)
        .where(inArray(users.id, mentorIds))
    : [];
  const mentorUserMap = new Map(mentorUsers.map((u) => [u.id, u]));
  const topMentors = mentorRows.map((row) => ({
    ...mentorUserMap.get(row.mentorId),
    count: Number(row.count),
  }));

  const goalTotal = Number((goalCompletion as { total: number }).total ?? 0);
  const goalDone = Number((goalCompletion as { completed: number }).completed ?? 0);
  const goalRate = goalTotal === 0 ? 0 : Math.round((goalDone / goalTotal) * 100);
  const completionRate =
    completedSessions + cancelledSessions === 0
      ? "—"
      : `${Math.round((completedSessions / (completedSessions + cancelledSessions)) * 100)}%`;
  const mentorParticipation = totalUsers === 0 ? "0%" : `${Math.round((activeMentors / totalUsers) * 100)}%`;
  const avgPerRelationship = activeMatches === 0 ? "0" : (completedSessions / activeMatches).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("reports")}</h1>
          <p className="text-slate-500 mt-1">{t("kpiTitle")}</p>
        </div>
        <ExportReportButton label={t("exportExcel")} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title={t("totalUsers")} value={totalUsers as number} icon={Users} color="blue" />
        <StatsCard title={t("totalMentors")} value={activeMentors as number} icon={UserCheck} color="teal" />
        <StatsCard title={t("activeMatches")} value={activeMatches as number} icon={TrendingUp} color="emerald" />
        <StatsCard title={t("completedSessions")} value={completedSessions as number} icon={BookOpen} color="emerald" />
        <StatsCard title={t("scheduled")} value={scheduledSessions as number} icon={Clock} color="amber" />
        <StatsCard title={t("cancelled")} value={cancelledSessions as number} icon={Clock} color="rose" />
        <StatsCard title={t("avgRating")} value={(avgRatingRow as number).toFixed(2)} icon={Star} color="amber" />
        <StatsCard title={t("goalCompletion")} value={`${goalRate}%`} icon={TrendingUp} color="teal" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("topAreas")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(topAreas as Array<{ area: string; count: number }>).length === 0 ? (
              <p className="text-sm text-slate-500">—</p>
            ) : (
              <ul className="space-y-2">
                {(topAreas as Array<{ area: string; count: number }>).map((row, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{row.area}</span>
                    <span className="text-slate-400 font-mono">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("topMentors")}</CardTitle>
          </CardHeader>
          <CardContent>
            {topMentors.length === 0 ? (
              <p className="text-sm text-slate-500">—</p>
            ) : (
              <ul className="space-y-2">
                {topMentors.map((m) => (
                  <li key={m?.id ?? Math.random()} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-900 font-medium">{m?.name}</p>
                      <p className="text-xs text-slate-500">{m?.jobTitle}</p>
                    </div>
                    <span className="text-slate-400 font-mono">{m?.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("kpiTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Row label={t("totalUsers")} value={String(totalUsers)} />
            <Row label={t("totalMentors")} value={mentorParticipation} />
            <Row label={t("completedSessions")} value={completionRate} />
            <Row label={t("activeMatches")} value={avgPerRelationship} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
