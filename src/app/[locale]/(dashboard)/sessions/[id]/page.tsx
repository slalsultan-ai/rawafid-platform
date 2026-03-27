import { auth } from "@/server/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/server/db";
import {
  sessions,
  sessionAgendaItems,
  sessionNotes,
  sessionSummaries,
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
} from "lucide-react";
import { AgendaClient } from "@/components/sessions/agenda-client";
import { NotesClient } from "@/components/sessions/notes-client";
import { SummaryClient } from "@/components/sessions/summary-client";
import { StatusActions } from "@/components/sessions/status-actions";

const statusConfig: Record<string, { color: "warning" | "success" | "secondary" | "destructive" | "default"; arLabel: string; enLabel: string }> = {
  scheduled: { color: "default", arLabel: "مجدولة", enLabel: "Scheduled" },
  preparing: { color: "warning", arLabel: "قيد التحضير", enLabel: "Preparing" },
  completed: { color: "success", arLabel: "مكتملة", enLabel: "Completed" },
  cancelled: { color: "destructive", arLabel: "ملغاة", enLabel: "Cancelled" },
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

  if (!db) notFound();

  // Fetch session + match
  const rows = await db
    .select({ session: sessions, match: matches })
    .from(sessions)
    .innerJoin(matches, eq(sessions.matchId, matches.id))
    .where(and(eq(sessions.id, id), eq(sessions.tenantId, user.tenantId)));

  if (!rows[0]) notFound();
  const { session: sessionData, match } = rows[0];

  // Check access
  if (match.mentorId !== user.id && match.menteeId !== user.id) notFound();

  const isMentor = match.mentorId === user.id;

  // Fetch mentor and mentee user info
  const [mentorUser, menteeUser] = await Promise.all([
    db.select().from(users).where(eq(users.id, match.mentorId)).then((r) => r[0]),
    db.select().from(users).where(eq(users.id, match.menteeId)).then((r) => r[0]),
  ]);

  const otherUser = isMentor ? menteeUser : mentorUser;

  // Fetch agenda, notes (visible), summary in parallel
  const [agenda, notes, summaryRows] = await Promise.all([
    db
      .select()
      .from(sessionAgendaItems)
      .where(eq(sessionAgendaItems.sessionId, id))
      .orderBy(asc(sessionAgendaItems.order)),
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
  ]);

  const summary = summaryRows[0] ?? null;
  const cfg = statusConfig[sessionData.status];

  const dt = new Date(sessionData.scheduledAt);
  const dateStr = dt.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = dt.toLocaleTimeString(isRTL ? "ar-SA" : "en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  const isActive = sessionData.status === "scheduled" || sessionData.status === "preparing";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={`/${locale}/sessions`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowRight className={`w-4 h-4 ${isRTL ? "" : "rotate-180"}`} />
        {isRTL ? "الجلسات" : "Back to Sessions"}
      </Link>

      {/* Session header card */}
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
                  {isMentor
                    ? isRTL ? "متدرب" : "Mentee"
                    : isRTL ? "مرشد" : "Mentor"}
                  {otherUser?.jobTitle ? ` • ${otherUser.jobTitle}` : ""}
                </p>
              </div>
            </div>
            <Badge variant={cfg.color}>
              {isRTL ? cfg.arLabel : cfg.enLabel}
            </Badge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{timeStr} ({sessionData.durationMinutes} {isRTL ? "د" : "min"})</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              {sessionData.type === "virtual"
                ? <><Video className="w-4 h-4 text-teal-500 shrink-0" />{isRTL ? "افتراضية" : "Virtual"}</>
                : <><MapPin className="w-4 h-4 text-violet-500 shrink-0" />{isRTL ? "حضورية" : "In-Person"}</>}
            </div>
            {sessionData.locationOrLink && (
              <div className="flex items-center gap-2 text-sm text-teal-600 col-span-2 sm:col-span-1">
                <a
                  href={sessionData.locationOrLink.startsWith("http") ? sessionData.locationOrLink : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline"
                >
                  {sessionData.locationOrLink}
                </a>
              </div>
            )}
          </div>

          {/* Status actions */}
          {isActive && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">
                {isRTL ? "تحديث حالة الجلسة:" : "Update session status:"}
              </p>
              <StatusActions
                sessionId={sessionData.id}
                currentStatus={sessionData.status}
                isRTL={isRTL}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda */}
      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
            <ListChecks className="w-5 h-5 text-teal-500" />
            {isRTL ? "أجندة الجلسة" : "Session Agenda"}
          </h2>
          <AgendaClient
            sessionId={sessionData.id}
            initialItems={agenda.map((a) => ({
              id: a.id,
              content: a.content,
              addedBy: a.addedBy,
            }))}
            currentUserId={user.id}
            isRTL={isRTL}
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
            <StickyNote className="w-5 h-5 text-amber-500" />
            {isRTL ? "الملاحظات" : "Notes"}
            <span className="text-xs text-slate-400 font-normal">
              {isRTL ? "(الخاصة لك فقط، المشتركة تظهر للطرفين)" : "(Private: only you see them; Shared: visible to both)"}
            </span>
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
            isRTL={isRTL}
          />
        </CardContent>
      </Card>

      {/* Summary — show for all statuses, but hint that it's for post-session */}
      <Card className={sessionData.status === "scheduled" ? "opacity-60" : ""}>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
            <FileText className="w-5 h-5 text-violet-500" />
            {isRTL ? "ملخص الجلسة" : "Session Summary"}
          </h2>
          {sessionData.status === "scheduled" && (
            <p className="text-xs text-slate-400 mb-4">
              {isRTL ? "يُملأ بعد انتهاء الجلسة" : "Fill this after the session is completed"}
            </p>
          )}
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
            isRTL={isRTL}
          />
        </CardContent>
      </Card>
    </div>
  );
}
