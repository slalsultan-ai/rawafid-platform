import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { users, mentorProfiles, matches, sessions } from "@/server/db/schema";
import { eq, and, count } from "drizzle-orm";
import { StatsCard } from "@/components/admin/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, BookOpen, CheckCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as {
    id: string;
    name: string;
    role: string;
    tenantId: string;
  };

  const isRTL = locale === "ar";
  const isAdmin = user.role === "org_admin" || user.role === "super_admin";

  const t = {
    ar: {
      welcome: "مرحباً",
      overview: "نظرة عامة",
      totalUsers: "إجمالي المستخدمين",
      activeMentors: "المرشدون المعتمدون",
      activeMatches: "علاقات الإرشاد النشطة",
      completedSessions: "الجلسات المكتملة",
      pendingMentors: "طلبات اعتماد معلقة",
      reviewPending: "مراجعة الطلبات",
      requestMentoring: "طلب إرشاد",
      myMentor: "مرشدي الحالي",
      incomingRequests: "الطلبات الواردة",
      noMentor: "لا يوجد مرشد حالياً",
      findMentor: "ابحث عن مرشد",
      active: "نشط",
      pending: "بانتظار القبول",
    },
    en: {
      welcome: "Welcome",
      overview: "Overview",
      totalUsers: "Total Users",
      activeMentors: "Approved Mentors",
      activeMatches: "Active Mentoring",
      completedSessions: "Completed Sessions",
      pendingMentors: "Pending Approvals",
      reviewPending: "Review Applications",
      requestMentoring: "Request Mentoring",
      myMentor: "My Current Mentor",
      incomingRequests: "Incoming Requests",
      noMentor: "No mentor yet",
      findMentor: "Find a Mentor",
      active: "Active",
      pending: "Awaiting Acceptance",
    },
  }[locale as "ar" | "en"] ?? {
    welcome: "Welcome",
    overview: "Overview",
    totalUsers: "Total Users",
    activeMentors: "Approved Mentors",
    activeMatches: "Active Mentoring",
    completedSessions: "Completed Sessions",
    pendingMentors: "Pending Approvals",
    reviewPending: "Review Applications",
    requestMentoring: "Request Mentoring",
    myMentor: "My Current Mentor",
    incomingRequests: "Incoming Requests",
    noMentor: "No mentor yet",
    findMentor: "Find a Mentor",
    active: "Active",
    pending: "Awaiting Acceptance",
  };

  // Get stats
  const stats = db ? await Promise.all([
    db.select({ count: count() }).from(users).where(eq(users.tenantId, user.tenantId)).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(mentorProfiles).where(and(eq(mentorProfiles.tenantId, user.tenantId), eq(mentorProfiles.status, "approved"))).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(matches).where(and(eq(matches.tenantId, user.tenantId), eq(matches.status, "active"))).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(sessions).where(and(eq(sessions.tenantId, user.tenantId), eq(sessions.status, "completed"))).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(mentorProfiles).where(and(eq(mentorProfiles.tenantId, user.tenantId), eq(mentorProfiles.status, "pending"))).then((r) => Number(r[0]?.count ?? 0)),
  ]) : [0, 0, 0, 0, 0];

  const [totalUsers, activeMentors, activeMatches, completedSessions, pendingMentors] = stats;

  // For mentors: get incoming requests
  const incomingRequests = db && user.role === "mentor" ? await db
    .select({ match: matches, mentee: users })
    .from(matches)
    .innerJoin(users, eq(matches.menteeId, users.id))
    .where(and(eq(matches.mentorId, user.id), eq(matches.status, "proposed")))
    .limit(5) : [];

  // For mentees: get current match
  const currentMatch = db && (user.role === "mentee" || user.role === "employee") ? await db
    .select({ match: matches, mentor: users })
    .from(matches)
    .innerJoin(users, eq(matches.mentorId, users.id))
    .where(and(eq(matches.menteeId, user.id), eq(matches.status, "active")))
    .limit(1)
    .then((r) => r[0]) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t.welcome}، {user.name.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1">{t.overview}</p>
      </div>

      {/* Admin Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatsCard title={t.totalUsers} value={totalUsers} icon={Users} color="blue" />
          <StatsCard title={t.activeMentors} value={activeMentors} icon={UserCheck} color="teal" />
          <StatsCard title={t.activeMatches} value={activeMatches} icon={BookOpen} color="emerald" />
          <StatsCard title={t.completedSessions} value={completedSessions} icon={CheckCircle} color="emerald" />
          <StatsCard title={t.pendingMentors} value={pendingMentors} icon={Clock} color="amber" />
        </div>
      )}

      {/* Non-admin stats */}
      {!isAdmin && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard title={t.activeMentors} value={activeMentors} icon={UserCheck} color="teal" />
          <StatsCard title={t.activeMatches} value={activeMatches} icon={BookOpen} color="emerald" />
          <StatsCard title={t.completedSessions} value={completedSessions} icon={CheckCircle} color="emerald" />
          <StatsCard title={t.pendingMentors} value={pendingMentors} icon={Clock} color="amber" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending mentor approvals for admin */}
        {isAdmin && pendingMentors > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.pendingMentors}</CardTitle>
                <Badge variant="warning">{pendingMentors}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={`/${locale}/admin/mentors`}>
                <Button variant="outline" className="w-full gap-2">
                  {t.reviewPending}
                  <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Mentor: incoming requests */}
        {user.role === "mentor" && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.incomingRequests}</CardTitle>
                {incomingRequests.length > 0 && (
                  <Badge variant="warning">{incomingRequests.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {incomingRequests.length === 0 ? (
                <p className="text-sm text-slate-500">{locale === "ar" ? "لا توجد طلبات جديدة" : "No new requests"}</p>
              ) : (
                <div className="space-y-2">
                  {incomingRequests.map(({ match, mentee }) => (
                    <div key={match.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{mentee.name}</p>
                        <p className="text-xs text-slate-500">{mentee.department}</p>
                      </div>
                      <Link href={`/${locale}/mentoring`}>
                        <Button size="sm" variant="outline">
                          {locale === "ar" ? "عرض" : "View"}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mentee: my mentor */}
        {(user.role === "mentee" || user.role === "employee") && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t.myMentor}</CardTitle>
            </CardHeader>
            <CardContent>
              {!currentMatch ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">{t.noMentor}</p>
                  <Link href={`/${locale}/mentoring/request`}>
                    <Button className="gap-2">
                      {t.requestMentoring}
                      <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{currentMatch.mentor.name}</p>
                    <p className="text-sm text-slate-500">{currentMatch.mentor.jobTitle}</p>
                    <Badge variant="success" className="mt-1">{t.active}</Badge>
                  </div>
                  <Link href={`/${locale}/mentoring`}>
                    <Button size="sm" variant="outline">
                      {locale === "ar" ? "عرض" : "View"}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {locale === "ar" ? "روابط سريعة" : "Quick Links"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/${locale}/mentors`} className="flex items-center justify-between py-2 hover:bg-slate-50 rounded-lg px-2 transition-colors group">
              <span className="text-sm text-slate-700">{locale === "ar" ? "استعراض المرشدين" : "Browse Mentors"}</span>
              <ArrowRight className={`w-4 h-4 text-slate-400 group-hover:text-teal-600 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
            <Link href={`/${locale}/mentors/register`} className="flex items-center justify-between py-2 hover:bg-slate-50 rounded-lg px-2 transition-colors group">
              <span className="text-sm text-slate-700">{locale === "ar" ? "سجّل كمرشد" : "Register as Mentor"}</span>
              <ArrowRight className={`w-4 h-4 text-slate-400 group-hover:text-teal-600 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
            {(user.role === "mentee" || user.role === "employee") && (
              <Link href={`/${locale}/mentoring/request`} className="flex items-center justify-between py-2 hover:bg-slate-50 rounded-lg px-2 transition-colors group">
                <span className="text-sm text-slate-700">{t.requestMentoring}</span>
                <ArrowRight className={`w-4 h-4 text-slate-400 group-hover:text-teal-600 ${isRTL ? "rotate-180" : ""}`} />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
