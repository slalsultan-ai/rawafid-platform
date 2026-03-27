import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { matches, users } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm";
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

  // Get active matches for this user (must be active to schedule sessions)
  const activeMatches = db
    ? await db
        .select({ match: matches, other: users })
        .from(matches)
        .innerJoin(
          users,
          eq(
            users.id,
            // We'll fetch both mentor and mentee, filter in JS
            matches.menteeId
          )
        )
        .where(
          and(
            or(eq(matches.mentorId, user.id), eq(matches.menteeId, user.id)),
            eq(matches.tenantId, user.tenantId),
            eq(matches.status, "active")
          )
        )
    : [];

  // Build match options with the "other person" resolved
  const matchOptions: { id: string; otherPersonName: string; otherPersonTitle: string | null }[] = [];

  for (const row of activeMatches) {
    const otherId = row.match.mentorId === user.id ? row.match.menteeId : row.match.mentorId;
    if (db) {
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherId));
      if (otherUser) {
        matchOptions.push({
          id: row.match.id,
          otherPersonName: otherUser.name,
          otherPersonTitle: otherUser.jobTitle,
        });
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={`/${locale}/sessions`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowRight className={`w-4 h-4 ${isRTL ? "" : "rotate-180"}`} />
        {isRTL ? "الجلسات" : "Back to Sessions"}
      </Link>

      <Card>
        <CardContent className="p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {isRTL ? "جدولة جلسة جديدة" : "Schedule New Session"}
              </h1>
              <p className="text-sm text-slate-500">
                {isRTL ? "حدد موعد الجلسة وتفاصيلها" : "Set the session date, time, and details"}
              </p>
            </div>
          </div>

          {matchOptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-3">
                {isRTL
                  ? "لا توجد علاقات إرشاد نشطة. يجب قبول طلب إرشاد أولاً قبل جدولة جلسة."
                  : "No active mentoring relationships. A mentoring request must be accepted before scheduling."}
              </p>
              <Link href={`/${locale}/mentoring`} className="text-teal-600 text-sm hover:underline">
                {isRTL ? "عرض طلبات الإرشاد" : "View Mentoring Requests"}
              </Link>
            </div>
          ) : (
            <ScheduleForm
              matches={matchOptions}
              locale={locale}
              isRTL={isRTL}
              preselectedMatchId={preselectedMatchId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
