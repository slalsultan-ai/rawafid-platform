import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { users, mentorProfiles, matches, sessions, tenants } from "@/server/db/schema";
import { eq, and, count } from "drizzle-orm";
import { StatsCard } from "@/components/admin/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Users, UserCheck, BookOpen, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function AdminPage({
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

  const tenant = db
    ? await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1).then((r) => r[0])
    : null;
  const tenantName = tenant ? (locale === "en" && tenant.nameEn ? tenant.nameEn : tenant.name) : "";

  const stats = db
    ? await Promise.all([
        db.select({ count: count() }).from(users).where(eq(users.tenantId, user.tenantId)).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ count: count() }).from(mentorProfiles).where(and(eq(mentorProfiles.tenantId, user.tenantId), eq(mentorProfiles.status, "approved"))).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ count: count() }).from(matches).where(and(eq(matches.tenantId, user.tenantId), eq(matches.status, "active"))).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ count: count() }).from(sessions).where(and(eq(sessions.tenantId, user.tenantId), eq(sessions.status, "completed"))).then((r) => Number(r[0]?.count ?? 0)),
        db.select({ count: count() }).from(mentorProfiles).where(and(eq(mentorProfiles.tenantId, user.tenantId), eq(mentorProfiles.status, "pending"))).then((r) => Number(r[0]?.count ?? 0)),
      ])
    : [0, 0, 0, 0, 0];

  const [totalUsers, activeMentors, activeMatches, completedSessions, pendingMentors] = stats;

  const pendingList = db
    ? await db
        .select({ profile: mentorProfiles, user: users })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(and(eq(mentorProfiles.tenantId, user.tenantId), eq(mentorProfiles.status, "pending")))
        .limit(5)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-slate-500 mt-1">{tenantName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatsCard title={t("totalUsers")} value={totalUsers} icon={Users} color="blue" />
        <StatsCard title={t("totalMentors")} value={activeMentors} icon={UserCheck} color="teal" />
        <StatsCard title={t("activeMatches")} value={activeMatches} icon={BookOpen} color="emerald" />
        <StatsCard title={t("completedSessions")} value={completedSessions} icon={CheckCircle} color="emerald" />
        <StatsCard title={t("pendingApprovals")} value={pendingMentors} icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("mentorApprovals")}</CardTitle>
              {pendingMentors > 0 && <Badge variant="warning">{pendingMentors}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {pendingList.length === 0 ? (
              <p className="text-sm text-slate-500">{t("noPending")}</p>
            ) : (
              <div className="space-y-3">
                {pendingList.map(({ profile, user: mentorUser }) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{getInitials(mentorUser.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{mentorUser.name}</p>
                        <p className="text-xs text-slate-500">{mentorUser.department}</p>
                      </div>
                    </div>
                    <Link href={`/${locale}/admin/mentors`}>
                      <Button size="sm" variant="outline">
                        {t("mentorApprovals")}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/${locale}/admin/reports`}>
              <Button variant="outline" className="w-full">
                {t("reports")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/users`}>
              <Button variant="outline" className="w-full">
                {t("manageUsers")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/settings`}>
              <Button variant="outline" className="w-full">
                {t("settings")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
