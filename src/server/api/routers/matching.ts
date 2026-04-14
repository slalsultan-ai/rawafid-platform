import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  mentorProfiles,
  users,
  matches,
  menteeRequests,
  tenants,
} from "@/server/db/schema";
import { eq, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  rankMentors,
  calculateMatchingScore,
  DEFAULT_WEIGHTS,
} from "@/server/services/matching-algorithm";
import { logAudit } from "@/server/services/audit";
import { notify } from "@/server/services/notify";

export const matchingRouter = createTRPCRouter({
  getSuggestions: protectedProcedure
    .input(z.object({ requestId: z.string() }))
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
      if (request.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const menteeUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1)
        .then((r) => r[0]);

      const tenant = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.user.tenantId))
        .limit(1)
        .then((r) => r[0]);

      const allowSameDept = tenant?.settings?.allowSameDepartmentMatch ?? true;
      const weights = tenant?.settings?.matchingWeights ?? DEFAULT_WEIGHTS;

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

      const activeCounts = await ctx.db
        .select({ mentorId: matches.mentorId, count: count() })
        .from(matches)
        .where(
          and(eq(matches.tenantId, ctx.user.tenantId), eq(matches.status, "active"))
        )
        .groupBy(matches.mentorId);

      const countMap = new Map(activeCounts.map((c) => [c.mentorId, Number(c.count)]));

      const mentorData = approvedMentors.map(({ profile, user }) => ({
        userId: user.id,
        profileId: profile.id,
        profile: {
          areasOfExpertise: profile.areasOfExpertise ?? [],
          skills: profile.skills ?? [],
          availability: profile.availability ?? [],
          yearsOfExperience: user.yearsOfExperience ?? 0,
          maxMentees: profile.maxMentees ?? 3,
          currentMenteeCount: countMap.get(user.id) ?? 0,
          averageRating: profile.averageRating ?? null,
          totalRatings: profile.totalRatings ?? 0,
          department: user.department ?? null,
        },
      }));

      const menteeData = {
        desiredArea: request.desiredArea,
        desiredSkills: (request.desiredSkills as string[]) ?? [],
        yearsOfExperience: menteeUser?.yearsOfExperience ?? 0,
        department: menteeUser?.department ?? null,
      };

      const ranked = rankMentors(menteeData, mentorData, {
        weights,
        allowSameDepartment: allowSameDept,
      });

      return ranked
        .map((r) => {
          const mentor = approvedMentors.find((m) => m.user.id === r.mentorUserId);
          return mentor ? { ...r, mentor } : null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
    }),

  sendRequest: protectedProcedure
    .input(z.object({ requestId: z.string(), mentorUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db
        .select()
        .from(menteeRequests)
        .where(
          and(
            eq(menteeRequests.id, input.requestId),
            eq(menteeRequests.userId, ctx.user.id),
            eq(menteeRequests.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);

      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify mentor is in the same tenant + approved
      const mentorRow = await ctx.db
        .select({ profile: mentorProfiles, user: users })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(
          and(
            eq(mentorProfiles.userId, input.mentorUserId),
            eq(mentorProfiles.tenantId, ctx.user.tenantId),
            eq(mentorProfiles.status, "approved")
          )
        )
        .limit(1)
        .then((r) => r[0]);

      if (!mentorRow) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Mentor not available" });
      }

      // Recompute matching score server-side (don't trust client)
      const menteeUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)
        .then((r) => r[0]);

      const activeCount = await ctx.db
        .select({ count: count() })
        .from(matches)
        .where(
          and(
            eq(matches.mentorId, input.mentorUserId),
            eq(matches.status, "active"),
            eq(matches.tenantId, ctx.user.tenantId)
          )
        )
        .then((r) => Number(r[0]?.count ?? 0));

      const score = calculateMatchingScore(
        {
          desiredArea: request.desiredArea,
          desiredSkills: (request.desiredSkills as string[]) ?? [],
          yearsOfExperience: menteeUser?.yearsOfExperience ?? 0,
        },
        {
          areasOfExpertise: mentorRow.profile.areasOfExpertise ?? [],
          skills: mentorRow.profile.skills ?? [],
          availability: mentorRow.profile.availability ?? [],
          yearsOfExperience: mentorRow.user.yearsOfExperience ?? 0,
          maxMentees: mentorRow.profile.maxMentees ?? 3,
          currentMenteeCount: activeCount,
          averageRating: mentorRow.profile.averageRating ?? null,
          totalRatings: mentorRow.profile.totalRatings ?? 0,
        }
      );

      const match = await ctx.db
        .insert(matches)
        .values({
          tenantId: ctx.user.tenantId,
          mentorId: input.mentorUserId,
          menteeId: ctx.user.id,
          requestId: input.requestId,
          matchingScore: score,
          status: "proposed",
        })
        .returning()
        .then((r) => r[0]);

      await ctx.db
        .update(menteeRequests)
        .set({ status: "matched", updatedAt: new Date() })
        .where(eq(menteeRequests.id, input.requestId));

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "match.send_request",
        entityType: "match",
        entityId: match.id,
        details: { mentorUserId: input.mentorUserId, score },
      });

      await notify({
        tenantId: ctx.user.tenantId,
        userId: input.mentorUserId,
        type: "new_mentoring_request",
        title: "طلب إرشاد جديد",
        body: `وصل طلب إرشاد جديد بنسبة توافق ${score}%.`,
        relatedEntityType: "match",
        relatedEntityId: match.id,
      });

      return match;
    }),

  getMyMatches: protectedProcedure.query(async ({ ctx }) => {
    const asmentor = await ctx.db
      .select({ match: matches, mentee: users })
      .from(matches)
      .innerJoin(users, eq(matches.menteeId, users.id))
      .where(
        and(eq(matches.mentorId, ctx.user.id), eq(matches.tenantId, ctx.user.tenantId))
      );

    const asMentee = await ctx.db
      .select({ match: matches, mentor: users })
      .from(matches)
      .innerJoin(users, eq(matches.mentorId, users.id))
      .where(
        and(eq(matches.menteeId, ctx.user.id), eq(matches.tenantId, ctx.user.tenantId))
      );

    return { asmentor, asMentee };
  }),

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

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "match.respond",
        entityType: "match",
        entityId: match.id,
        details: { newStatus, reason: input.rejectionReason },
      });

      await notify({
        tenantId: ctx.user.tenantId,
        userId: match.menteeId,
        type: input.action === "accept" ? "request_accepted" : "request_rejected",
        title:
          input.action === "accept"
            ? "تم قبول طلب الإرشاد"
            : "تم رفض طلب الإرشاد",
        body:
          input.action === "accept"
            ? "وافق المرشد على طلبك. يمكنكما الآن جدولة الجلسات."
            : `السبب: ${input.rejectionReason ?? "غير محدد"}`,
        relatedEntityType: "match",
        relatedEntityId: match.id,
      });

      return { success: true, status: newStatus };
    }),
});
