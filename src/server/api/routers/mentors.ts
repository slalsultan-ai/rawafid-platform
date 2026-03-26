import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { mentorProfiles, users } from "@/server/db/schema";
import { eq, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { rankMentors } from "@/server/services/matching-algorithm";

export const mentorsRouter = createTRPCRouter({
  // Register as mentor
  register: protectedProcedure
    .input(
      z.object({
        areasOfExpertise: z.array(z.object({ id: z.string(), nameAr: z.string(), nameEn: z.string() })),
        skills: z.array(z.object({ id: z.string(), nameAr: z.string(), nameEn: z.string() })),
        availability: z.array(z.object({ day: z.string(), from: z.string(), to: z.string() })),
        maxMentees: z.number().min(1).max(10).default(3),
        sessionPreference: z.enum(["virtual", "in_person", "both"]).default("both"),
        motivation: z.string().min(10),
        motivationEn: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, ctx.user.id))
        .limit(1)
        .then((r) => r[0]);

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Already registered as mentor" });
      }

      const profile = await ctx.db
        .insert(mentorProfiles)
        .values({
          id: nanoid(),
          userId: ctx.user.id,
          tenantId: ctx.user.tenantId,
          areasOfExpertise: input.areasOfExpertise,
          skills: input.skills,
          availability: input.availability,
          maxMentees: input.maxMentees,
          sessionPreference: input.sessionPreference,
          motivation: input.motivation,
          motivationEn: input.motivationEn,
          status: "pending",
        })
        .returning()
        .then((r) => r[0]);

      return profile;
    }),

  // Get pending mentor applications (Admin)
  getPending: adminProcedure.query(async ({ ctx }) => {
    const pending = await ctx.db
      .select({
        profile: mentorProfiles,
        user: users,
      })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(
        and(
          eq(mentorProfiles.tenantId, ctx.user.tenantId),
          eq(mentorProfiles.status, "pending")
        )
      );
    return pending;
  }),

  // Get approved mentors
  getApproved: protectedProcedure.query(async ({ ctx }) => {
    const approved = await ctx.db
      .select({
        profile: mentorProfiles,
        user: users,
      })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(
        and(
          eq(mentorProfiles.tenantId, ctx.user.tenantId),
          eq(mentorProfiles.status, "approved")
        )
      );
    return approved;
  }),

  // Get mentor profile by userId
  getByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ profile: mentorProfiles, user: users })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(eq(mentorProfiles.userId, input.userId))
        .limit(1)
        .then((r) => r[0]);

      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  // Approve mentor
  approve: adminProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(mentorProfiles)
        .set({
          status: "approved",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mentorProfiles.id, input.profileId),
            eq(mentorProfiles.tenantId, ctx.user.tenantId)
          )
        );

      // Update user role to mentor
      const profile = await ctx.db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.id, input.profileId))
        .limit(1)
        .then((r) => r[0]);

      if (profile) {
        await ctx.db
          .update(users)
          .set({ role: "mentor", updatedAt: new Date() })
          .where(eq(users.id, profile.userId));
      }

      return { success: true };
    }),

  // Reject mentor
  reject: adminProcedure
    .input(z.object({ profileId: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(mentorProfiles)
        .set({
          status: "rejected",
          rejectionReason: input.reason,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mentorProfiles.id, input.profileId),
            eq(mentorProfiles.tenantId, ctx.user.tenantId)
          )
        );
      return { success: true };
    }),

  // Get my mentor profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, ctx.user.id))
      .limit(1)
      .then((r) => r[0] ?? null);
  }),
});
