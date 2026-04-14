import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  sessions,
  sessionAgendaItems,
  sessionNotes,
  sessionSummaries,
  matches,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { logAudit } from "@/server/services/audit";
import { notify } from "@/server/services/notify";

type DbType = NonNullable<typeof import("@/server/db").db>;

async function assertSessionAccess(
  db: DbType,
  sessionId: string,
  userId: string,
  tenantId: string
) {
  const rows = await db
    .select({ mentorId: matches.mentorId, menteeId: matches.menteeId })
    .from(sessions)
    .innerJoin(matches, eq(sessions.matchId, matches.id))
    .where(and(eq(sessions.id, sessionId), eq(sessions.tenantId, tenantId)));

  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
  const { mentorId, menteeId } = rows[0];
  if (mentorId !== userId && menteeId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return rows[0];
}

export const sessionsRouter = createTRPCRouter({
  schedule: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        scheduledAt: z.string(),
        type: z.enum(["virtual", "in_person"]),
        durationMinutes: z.number().min(15).max(240).default(60),
        locationOrLink: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [match] = await ctx.db
        .select()
        .from(matches)
        .where(
          and(eq(matches.id, input.matchId), eq(matches.tenantId, ctx.user.tenantId))
        );

      if (!match) throw new TRPCError({ code: "NOT_FOUND" });
      if (match.mentorId !== ctx.user.id && match.menteeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [created] = await ctx.db
        .insert(sessions)
        .values({
          matchId: input.matchId,
          tenantId: ctx.user.tenantId,
          type: input.type,
          locationOrLink: input.locationOrLink,
          scheduledAt: new Date(input.scheduledAt),
          durationMinutes: input.durationMinutes,
          status: "scheduled",
        })
        .returning();

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "session.schedule",
        entityType: "session",
        entityId: created.id,
      });

      const otherUserId =
        match.mentorId === ctx.user.id ? match.menteeId : match.mentorId;
      await notify({
        tenantId: ctx.user.tenantId,
        userId: otherUserId,
        type: "session_scheduled",
        title: "جلسة إرشاد جديدة",
        body: `تمت جدولة جلسة في ${new Date(input.scheduledAt).toLocaleString("ar")}.`,
        relatedEntityType: "session",
        relatedEntityId: created.id,
      });

      return created;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        status: z.enum(["scheduled", "preparing", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
await assertSessionAccess(ctx.db, input.sessionId, ctx.user.id, ctx.user.tenantId);

      await ctx.db
        .update(sessions)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(sessions.id, input.sessionId));

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "session.update_status",
        entityType: "session",
        entityId: input.sessionId,
        details: { status: input.status },
      });

      return { success: true };
    }),

  addAgendaItem: protectedProcedure
    .input(z.object({ sessionId: z.string(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
await assertSessionAccess(ctx.db, input.sessionId, ctx.user.id, ctx.user.tenantId);

      const [item] = await ctx.db
        .insert(sessionAgendaItems)
        .values({
          sessionId: input.sessionId,
          tenantId: ctx.user.tenantId,
          addedBy: ctx.user.id,
          content: input.content,
          position: Date.now(),
        })
        .returning();

      return item;
    }),

  removeAgendaItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.db
        .delete(sessionAgendaItems)
        .where(
          and(
            eq(sessionAgendaItems.id, input.itemId),
            eq(sessionAgendaItems.addedBy, ctx.user.id),
            eq(sessionAgendaItems.tenantId, ctx.user.tenantId)
          )
        );

      return { success: true };
    }),

  addNote: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1),
        isPrivate: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
await assertSessionAccess(ctx.db, input.sessionId, ctx.user.id, ctx.user.tenantId);

      const [note] = await ctx.db
        .insert(sessionNotes)
        .values({
          sessionId: input.sessionId,
          tenantId: ctx.user.tenantId,
          authorId: ctx.user.id,
          content: input.content,
          isPrivate: input.isPrivate,
        })
        .returning();

      return note;
    }),

  saveSummary: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        discussedPoints: z.string().optional(),
        decisions: z.string().optional(),
        actionItems: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
await assertSessionAccess(ctx.db, input.sessionId, ctx.user.id, ctx.user.tenantId);

      const existing = await ctx.db
        .select()
        .from(sessionSummaries)
        .where(eq(sessionSummaries.sessionId, input.sessionId))
        .then((r) => r[0]);

      if (existing) {
        const [updated] = await ctx.db
          .update(sessionSummaries)
          .set({
            discussedPoints: input.discussedPoints,
            decisions: input.decisions,
            actionItems: input.actionItems,
            updatedAt: new Date(),
          })
          .where(eq(sessionSummaries.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await ctx.db
        .insert(sessionSummaries)
        .values({
          sessionId: input.sessionId,
          tenantId: ctx.user.tenantId,
          authorId: ctx.user.id,
          discussedPoints: input.discussedPoints,
          decisions: input.decisions,
          actionItems: input.actionItems,
        })
        .returning();

      return created;
    }),

  deleteNote: protectedProcedure
    .input(z.object({ noteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.db
        .delete(sessionNotes)
        .where(
          and(
            eq(sessionNotes.id, input.noteId),
            eq(sessionNotes.authorId, ctx.user.id),
            eq(sessionNotes.tenantId, ctx.user.tenantId)
          )
        );

      return { success: true };
    }),
});
