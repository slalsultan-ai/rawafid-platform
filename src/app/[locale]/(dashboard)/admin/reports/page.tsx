import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { users, mentorProfiles, matches, sessions, sessionReviews } from "@/server/db/schema";
import { eq, and, count, avg } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/admin/stats-card";
import { Users, UserCheck, BookOpen, Star, TrendingUp, Clock } from "lucide-react";

export default async function AdminReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as { id: string; role: string; tenantId: string };
  if (!["org_admin", "super_admin"].includes(user.role)) redirect(`/${locale}`);

  const isRTL = locale === "ar";

  const stats = db ? await Promise.all([
    db.select({ count: count() }).from(users).where(eq(users.tenantId, user.tenantId)).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(mentorProfiles).where(and(eq(mentorProfiles.tenantId, user.tenantId), eq(mentorProfiles.status, "approved"))).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(matches).where(and(eq(matches.tenantId, user.tenantId), eq(matches.status, "active"))).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(sessions).where(and(eq(sessions.tenantId, user.tenantId), eq(sessions.status, "completed"))).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(sessions).where(and(eq(sessions.tenantId, user.tenantId), eq(sessions.status, "scheduled"))).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(sessions).where(and(eq(sessions.tenantId, user.tenantId), eq(sessions.status, "cancelled"))).then((r) => Number(r[0]?.count ?? 0)),
  ]) : [0, 0, 0, 0, 0, 0];

  const [totalUsers, activeMentors, activeMatches, completedSessions, scheduledSessions, cancelledSessions] = stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isRTL ? "التقارير والإحصائيات" : "Reports & Analytics"}
        </h1>
        <p className="text-slate-500 mt-1">
          {isRTL ? "نظرة شاملة على أداء برنامج الإرشاد" : "Comprehensive view of the mentoring program performance"}
        </p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard title={isRTL ? "إجمالي المستخدمين" : "Total Users"} value={totalUsers} icon={Users} color="blue" />
        <StatsCard title={isRTL ? "مرشدون معتمدون" : "Approved Mentors"} value={activeMentors} icon={UserCheck} color="teal" />
        <StatsCard title={isRTL ? "علاقات إرشاد نشطة" : "Active Relationships"} value={activeMatches} icon={TrendingUp} color="emerald" />
        <StatsCard title={isRTL ? "جلسات مكتملة" : "Completed Sessions"} value={completedSessions} icon={BookOpen} color="emerald" />
        <StatsCard title={isRTL ? "جلسات مجدولة" : "Scheduled Sessions"} value={scheduledSessions} icon={Clock} color="amber" />
        <StatsCard title={isRTL ? "جلسات ملغاة" : "Cancelled Sessions"} value={cancelledSessions} icon={Clock} color="rose" />
      </div>

      {/* Summary table */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "ملخص البرنامج" : "Program Summary"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                label: isRTL ? "نسبة المرشدين من المستخدمين" : "Mentor participation rate",
                value: totalUsers > 0 ? `${Math.round((activeMentors / totalUsers) * 100)}%` : "0%",
              },
              {
                label: isRTL ? "معدل إتمام الجلسات" : "Session completion rate",
                value:
                  completedSessions + cancelledSessions > 0
                    ? `${Math.round((completedSessions / (completedSessions + cancelledSessions)) * 100)}%`
                    : "N/A",
              },
              {
                label: isRTL ? "متوسط جلسات لكل علاقة" : "Avg sessions per relationship",
                value: activeMatches > 0 ? (completedSessions / activeMatches).toFixed(1) : "0",
              },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{row.label}</span>
                <span className="text-sm font-semibold text-slate-900">{row.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
