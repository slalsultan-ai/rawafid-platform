import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { mentorProfiles, users, matches, menteeRequests } from "@/server/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { rankMentors, DEFAULT_WEIGHTS } from "@/server/services/matching-algorithm";

export const matchingRouter = createTRPCRouter({
  // Get mentor suggestions for a mentee request
  getSuggestions: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const request = await ctx.db
        .select()
        .from(menteeRequests)
        .where(
          and(
            eq(menteeRequests.id, input.requestId),
            eq(menteeRequests.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);

      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      // Get the mentee's years of experience
      const menteeUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1)
        .then((r) => r[0]);

      // Get all approved mentors in this tenant
      const approvedMentors = await ctx.db
        .select({ profile: mentorProfiles, user: users })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(
          and(
            eq(mentorProfiles.tenantId, ctx.user.tenantId),
            eq(mentorProfiles.status, "approved")
          )
        );

      // Get current mentee counts for each mentor
      const activeCounts = await ctx.db
        .select({
          mentorId: matches.mentorId,
          count: count(),
        })
        .from(matches)
        .where(
          and(
            eq(matches.tenantId, ctx.user.tenantId),
            eq(matches.status, "active")
          )
        )
        .groupBy(matches.mentorId);

      const countMap = new Map(activeCounts.map((c) => [c.mentorId, Number(c.count)]));

      // Build mentor data for ranking
      const mentorData = approvedMentors.map(({ profile, user }) => ({
        userId: user.id,
        profileId: profile.id,
        profile: {
          areasOfExpertise: (profile.areasOfExpertise as Array<{ id: string; nameAr: string; nameEn: string }>) ?? [],
          skills: (profile.skills as Array<{ id: string; nameAr: string; nameEn: string }>) ?? [],
          availability: (profile.availability as Array<{ day: string; from: string; to: string }>) ?? [],
          yearsOfExperience: user.yearsOfExperience ?? 0,
          maxMentees: profile.maxMentees ?? 3,
          currentMenteeCount: countMap.get(user.id) ?? 0,
          averageRating: profile.averageRating ?? undefined,
          totalRatings: profile.totalRatings ?? 0,
        },
      }));

      const menteeData = {
        desiredArea: request.desiredArea,
        desiredSkills: (request.desiredSkills as string[]) ?? [],
        yearsOfExperience: menteeUser?.yearsOfExperience ?? 0,
      };

      const ranked = rankMentors(menteeData, mentorData, DEFAULT_WEIGHTS, 10);

      // Fetch full details for ranked mentors
      const rankedWithDetails = await Promise.all(
        ranked.map(async (r) => {
          const mentor = approvedMentors.find((m) => m.user.id === r.mentorUserId);
          return {
            ...r,
            mentor: mentor ?? null,
          };
        })
      );

      return rankedWithDetails.filter((r) => r.mentor !== null);
    }),

  // Send mentoring request to specific mentor
  sendRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        mentorUserId: z.string(),
        matchingScore: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify request belongs to this user
      const request = await ctx.db
        .select()
        .from(menteeRequests)
        .where(
          and(
            eq(menteeRequests.id, input.requestId),
            eq(menteeRequests.userId, ctx.user.id)
          )
        )
        .limit(1)
        .then((r) => r[0]);

      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      const match = await ctx.db
        .insert(matches)
        .values({
          id: nanoid(),
          tenantId: ctx.user.tenantId,
          mentorId: input.mentorUserId,
          menteeId: ctx.user.id,
          requestId: input.requestId,
          matchingScore: input.matchingScore,
          status: "proposed",
        })
        .returning()
        .then((r) => r[0]);

      // Mark request as matched
      await ctx.db
        .update(menteeRequests)
        .set({ status: "matched", updatedAt: new Date() })
        .where(eq(menteeRequests.id, input.requestId));

      return match;
    }),

  // Get my matches (as mentor or mentee)
  getMyMatches: protectedProcedure.query(async ({ ctx }) => {
    const asmentor = await ctx.db
      .select({ match: matches, mentee: users })
      .from(matches)
      .innerJoin(users, eq(matches.menteeId, users.id))
      .where(
        and(
          eq(matches.mentorId, ctx.user.id),
          eq(matches.tenantId, ctx.user.tenantId)
        )
      );

    const asMentee = await ctx.db
      .select({ match: matches, mentor: users })
      .from(matches)
      .innerJoin(users, eq(matches.mentorId, users.id))
      .where(
        and(
          eq(matches.menteeId, ctx.user.id),
          eq(matches.tenantId, ctx.user.tenantId)
        )
      );

    return { asmentor, asMentee };
  }),

  // Accept/reject a match (mentor action)
  respondToMatch: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        action: z.enum(["accept", "reject"]),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.id, input.matchId),
            eq(matches.mentorId, ctx.user.id),
            eq(matches.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);

      if (!match) throw new TRPCError({ code: "NOT_FOUND" });

      const newStatus = input.action === "accept" ? "active" : "rejected";

      await ctx.db
        .update(matches)
        .set({
          status: newStatus,
          rejectionReason: input.rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(matches.id, input.matchId));

      return { success: true, status: newStatus };
    }),
});
