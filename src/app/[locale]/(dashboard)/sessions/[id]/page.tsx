import { auth } from "@/server/auth";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import {
  sessions,
  sessionAgendaItems,
  sessionNotes,
  sessionSummaries,
  sessionReviews,
  matches,
  users,
} from "@/server/db/schema";
import { eq, and, or, asc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  Video,
  MapPin,
  ListChecks,
  StickyNote,
  FileText,
  Star,
} from "lucide-react";
import { AgendaClient } from "@/components/sessions/agenda-client";
import { NotesClient } from "@/components/sessions/notes-client";
import { SummaryClient } from "@/components/sessions/summary-client";
import { StatusActions } from "@/components/sessions/status-actions";
import { ReviewForm } from "@/components/sessions/review-form";

const statusConfig: Record<
  string,
  { color: "warning" | "success" | "secondary" | "destructive" | "default"; key: "scheduled" | "preparing" | "completed" | "cancelled" }
> = {
  scheduled: { color: "default", key: "scheduled" },
  preparing: { color: "warning", key: "preparing" },
  completed: { color: "success", key: "completed" },
  cancelled: { color: "destructive", key: "cancelled" },
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as { id: string; role: string; tenantId: string };
  const isRTL = locale === "ar";

  const t = await getTranslations("session");
  const tCommon = await getTranslations("common");

  if (!db) notFound();

  const rows = await db
    .select({ session: sessions, match: matches })
    .from(sessions)
    .innerJoin(matches, eq(sessions.matchId, matches.id))
    .where(and(eq(sessions.id, id), eq(sessions.tenantId, user.tenantId)));

  if (!rows[0]) notFound();
  const { session: sessionData, match } = rows[0];

  if (match.mentorId !== user.id && match.menteeId !== user.id) notFound();

  const isMentor = match.mentorId === user.id;

  const [mentorUser, menteeUser] = await Promise.all([
    db.select().from(users).where(eq(users.id, match.mentorId)).then((r) => r[0]),
    db.select().from(users).where(eq(users.id, match.menteeId)).then((r) => r[0]),
  ]);

  const otherUser = isMentor ? menteeUser : mentorUser;

  const [agenda, notes, summaryRows, reviews] = await Promise.all([
    db
      .select()
      .from(sessionAgendaItems)
      .where(eq(sessionAgendaItems.sessionId, id))
      .orderBy(asc(sessionAgendaItems.position)),
    db
      .select()
      .from(sessionNotes)
      .where(
        and(
          eq(sessionNotes.sessionId, id),
          or(eq(sessionNotes.authorId, user.id), eq(sessionNotes.isPrivate, false))
        )
      )
      .orderBy(asc(sessionNotes.createdAt)),
    db
      .select()
      .from(sessionSummaries)
      .where(eq(sessionSummaries.sessionId, id)),
    db
      .select()
      .from(sessionReviews)
      .where(eq(sessionReviews.sessionId, id)),
  ]);

  const summary = summaryRows[0] ?? null;
  const cfg = statusConfig[sessionData.status];

  const dt = new Date(sessionData.scheduledAt);
  const dateStr = dt.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = dt.toLocaleTimeString(isRTL ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isActive = sessionData.status === "scheduled" || sessionData.status === "preparing";
  const myReview = reviews.find((r) => r.reviewerId === user.id);
  const revieweeId = isMentor ? match.menteeId : match.mentorId;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/${locale}/sessions`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowRight className={`w-4 h-4 ${isRTL ? "" : "rotate-180"}`} />
        {t("back")}
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="text-base font-bold">
                  {getInitials(otherUser?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-slate-900 text-lg">{otherUser?.name}</p>
                <p className="text-sm text-slate-500">
                  {isMentor ? tCommon("mentee") : tCommon("mentor")}
                  {otherUser?.jobTitle ? ` • ${otherUser.jobTitle}` : ""}
                </p>
              </div>
            </div>
            <Badge variant={cfg.color}>{t(cfg.key)}</Badge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {timeStr} ({sessionData.durationMinutes} {tCommon("minutes")})
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              {sessionData.type === "virtual" ? (
                <>
                  <Video className="w-4 h-4 text-teal-500 shrink-0" />
                  {t("virtual")}
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-violet-500 shrink-0" />
                  {t("inPerson")}
                </>
              )}
            </div>
            {sessionData.locationOrLink && (
              <div className="flex items-center gap-2 text-sm text-teal-600 col-span-2 sm:col-span-1">
                <a
                  href={
                    sessionData.locationOrLink.startsWith("http")
                      ? sessionData.locationOrLink
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline"
                >
                  {sessionData.locationOrLink}
                </a>
              </div>
            )}
          </div>

          {isActive && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <StatusActions sessionId={sessionData.id} currentStatus={sessionData.status} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
            <ListChecks className="w-5 h-5 text-teal-500" />
            {t("agenda")}
          </h2>
          <AgendaClient
            sessionId={sessionData.id}
            initialItems={agenda.map((a) => ({
              id: a.id,
              content: a.content,
              addedBy: a.addedBy,
            }))}
            currentUserId={user.id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
            <StickyNote className="w-5 h-5 text-amber-500" />
            {t("notes")}
          </h2>
          <NotesClient
            sessionId={sessionData.id}
            initialNotes={notes.map((n) => ({
              id: n.id,
              content: n.content,
              isPrivate: n.isPrivate,
              authorId: n.authorId,
              createdAt: n.createdAt,
            }))}
            currentUserId={user.id}
          />
        </CardContent>
      </Card>

      <Card className={sessionData.status === "scheduled" ? "opacity-60" : ""}>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
            <FileText className="w-5 h-5 text-violet-500" />
            {t("summary")}
          </h2>
          <SummaryClient
            sessionId={sessionData.id}
            initialSummary={
              summary
                ? {
                    discussedPoints: summary.discussedPoints,
                    decisions: summary.decisions,
                    actionItems: summary.actionItems,
                  }
                : null
            }
          />
        </CardContent>
      </Card>

      {sessionData.status === "completed" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              {t("addReview")}
            </h2>
            <ReviewForm
              sessionId={sessionData.id}
              revieweeId={revieweeId}
              alreadyReviewed={!!myReview}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
