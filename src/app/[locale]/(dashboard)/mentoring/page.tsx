import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { matches, users } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";

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

  const allMatches = db ? await db
    .select({
      match: matches,
      mentor: users,
    })
    .from(matches)
    .innerJoin(users, eq(matches.mentorId, users.id))
    .where(
      and(
        eq(matches.tenantId, user.tenantId),
        or(eq(matches.menteeId, user.id), eq(matches.mentorId, user.id))
      )
    ) : [];

  const asMentee = allMatches.filter((m) => m.match.menteeId === user.id);

  // For mentors, get mentees
  const asMentor = db ? await db
    .select({ match: matches, mentee: users })
    .from(matches)
    .innerJoin(users, eq(matches.menteeId, users.id))
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

      {/* As Mentee */}
      {asMentee.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            {isRTL ? "مرشدوي" : "My Mentors"}
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

      {/* As Mentor */}
      {asMentor.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            {isRTL ? "متدربوي" : "My Mentees"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {asMentor.map(({ match, mentee }) => (
              <Card key={match.id}>
                <CardContent className="p-5">
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
                      {match.status === "proposed" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                            {isRTL ? "رفض" : "Reject"}
                          </Button>
                          <Button size="sm" className="flex-1">
                            {isRTL ? "قبول" : "Accept"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
