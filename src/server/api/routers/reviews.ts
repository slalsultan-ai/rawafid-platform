import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  sessionReviews,
  sessions,
  matches,
  mentorProfiles,
} from "@/server/db/schema";
import { and, eq, avg, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logAudit } from "@/server/services/audit";

export const reviewsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        revieweeId: z.string(),
        overallRating: z.number().int().min(1).max(5),
        ratingBenefit: z.number().int().min(1).max(5).optional(),
        ratingPreparation: z.number().int().min(1).max(5).optional(),
        ratingPunctuality: z.number().int().min(1).max(5).optional(),
        ratingCommunication: z.number().int().min(1).max(5).optional(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sess = await ctx.db
        .select({ session: sessions, match: matches })
        .from(sessions)
        .innerJoin(matches, eq(sessions.matchId, matches.id))
        .where(
          and(
            eq(sessions.id, input.sessionId),
            eq(sessions.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);

      if (!sess) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        sess.match.mentorId !== ctx.user.id &&
        sess.match.menteeId !== ctx.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const validReviewee =
        input.revieweeId === sess.match.mentorId ||
        input.revieweeId === sess.match.menteeId;
      if (!validReviewee || input.revieweeId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid reviewee" });
      }

      // Prevent duplicate reviews per reviewer/session
      const existing = await ctx.db
        .select()
        .from(sessionReviews)
        .where(
          and(
            eq(sessionReviews.sessionId, input.sessionId),
            eq(sessionReviews.reviewerId, ctx.user.id)
          )
        )
        .limit(1)
        .then((r) => r[0]);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already reviewed this session",
        });
      }

      const created = await ctx.db
        .insert(sessionReviews)
        .values({
          sessionId: input.sessionId,
          tenantId: ctx.user.tenantId,
          reviewerId: ctx.user.id,
          revieweeId: input.revieweeId,
          overallRating: input.overallRating,
          ratingBenefit: input.ratingBenefit,
          ratingPreparation: input.ratingPreparation,
          ratingPunctuality: input.ratingPunctuality,
          ratingCommunication: input.ratingCommunication,
          comments: input.comments,
        })
        .returning()
        .then((r) => r[0]);

      // If reviewee is the mentor, recompute mentor average rating
      if (input.revieweeId === sess.match.mentorId) {
        const stats = await ctx.db
          .select({
            avg: avg(sessionReviews.overallRating),
            cnt: count(),
          })
          .from(sessionReviews)
          .where(eq(sessionReviews.revieweeId, input.revieweeId))
          .then((r) => r[0]);

        await ctx.db
          .update(mentorProfiles)
          .set({
            averageRating: Number(stats?.avg ?? 0),
            totalRatings: Number(stats?.cnt ?? 0),
            updatedAt: new Date(),
          })
          .where(eq(mentorProfiles.userId, input.revieweeId));
      }

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "review.create",
        entityType: "session_review",
        entityId: created.id,
      });

      return created;
    }),

  listForSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(sessionReviews)
        .where(
          and(
            eq(sessionReviews.sessionId, input.sessionId),
            eq(sessionReviews.tenantId, ctx.user.tenantId)
          )
        );
    }),
});
