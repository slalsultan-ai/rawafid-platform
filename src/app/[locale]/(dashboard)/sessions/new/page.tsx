import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { matches, users } from "@/server/db/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, CalendarPlus } from "lucide-react";
import { ScheduleForm } from "@/components/sessions/schedule-form";

export default async function NewSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ matchId?: string }>;
}) {
  const { locale } = await params;
  const { matchId: preselectedMatchId } = await searchParams;

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as { id: string; role: string; tenantId: string };
  const isRTL = locale === "ar";

  const t = await getTranslations("session");
  const tMatch = await getTranslations("match");

  const activeMatches = db
    ? await db
        .select()
        .from(matches)
        .where(
          and(
            or(eq(matches.mentorId, user.id), eq(matches.menteeId, user.id)),
            eq(matches.tenantId, user.tenantId),
            eq(matches.status, "active")
          )
        )
    : [];

  const otherUserIds = activeMatches.map((m) =>
    m.mentorId === user.id ? m.menteeId : m.mentorId
  );

  const otherUsers =
    otherUserIds.length > 0 && db
      ? await db.select().from(users).where(inArray(users.id, otherUserIds))
      : [];

  const userMap = Object.fromEntries(otherUsers.map((u) => [u.id, u]));

  const matchOptions = activeMatches
    .map((m) => {
      const otherId = m.mentorId === user.id ? m.menteeId : m.mentorId;
      const other = userMap[otherId];
      if (!other) return null;
      return {
        id: m.id,
        otherPersonName: other.name,
        otherPersonTitle: other.jobTitle,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href={`/${locale}/sessions`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowRight className={`w-4 h-4 ${isRTL ? "" : "rotate-180"}`} />
        {t("back")}
      </Link>

      <Card>
        <CardContent className="p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{t("schedule")}</h1>
            </div>
          </div>

          {matchOptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-3">{tMatch("noRelationships")}</p>
              <Link
                href={`/${locale}/mentoring`}
                className="text-teal-600 text-sm hover:underline"
              >
                {tMatch("myRelationships")}
              </Link>
            </div>
          ) : (
            <ScheduleForm
              matches={matchOptions}
              locale={locale}
              preselectedMatchId={preselectedMatchId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
