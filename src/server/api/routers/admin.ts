import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import {
  users,
  mentorProfiles,
  matches,
  sessions,
  sessionReviews,
  tenants,
} from "@/server/db/schema";
import { eq, and, count, avg } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logAudit } from "@/server/services/audit";

export const adminRouter = createTRPCRouter({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;

    const [
      totalUsers,
      totalMentors,
      totalActiveMatches,
      totalSessions,
      pendingMentors,
      cancelledSessions,
      scheduledSessions,
      avgRatingRow,
    ] = await Promise.all([
      ctx.db
        .select({ count: count() })
        .from(users)
        .where(eq(users.tenantId, tenantId))
        .then((r) => Number(r[0]?.count ?? 0)),
      ctx.db
        .select({ count: count() })
        .from(mentorProfiles)
        .where(
          and(
            eq(mentorProfiles.tenantId, tenantId),
            eq(mentorProfiles.status, "approved")
          )
        )
        .then((r) => Number(r[0]?.count ?? 0)),
      ctx.db
        .select({ count: count() })
        .from(matches)
        .where(
          and(eq(matches.tenantId, tenantId), eq(matches.status, "active"))
        )
        .then((r) => Number(r[0]?.count ?? 0)),
      ctx.db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(eq(sessions.tenantId, tenantId), eq(sessions.status, "completed"))
        )
        .then((r) => Number(r[0]?.count ?? 0)),
      ctx.db
        .select({ count: count() })
        .from(mentorProfiles)
        .where(
          and(
            eq(mentorProfiles.tenantId, tenantId),
            eq(mentorProfiles.status, "pending")
          )
        )
        .then((r) => Number(r[0]?.count ?? 0)),
      ctx.db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(eq(sessions.tenantId, tenantId), eq(sessions.status, "cancelled"))
        )
        .then((r) => Number(r[0]?.count ?? 0)),
      ctx.db
        .select({ count: count() })
        .from(sessions)
        .where(
          and(eq(sessions.tenantId, tenantId), eq(sessions.status, "scheduled"))
        )
        .then((r) => Number(r[0]?.count ?? 0)),
      ctx.db
        .select({ avg: avg(sessionReviews.overallRating) })
        .from(sessionReviews)
        .where(eq(sessionReviews.tenantId, tenantId))
        .then((r) => Number(r[0]?.avg ?? 0)),
    ]);

    return {
      totalUsers,
      totalMentors,
      totalActiveMatches,
      totalSessions,
      pendingMentors,
      cancelledSessions,
      scheduledSessions,
      avgRating: Number(avgRatingRow.toFixed(2)),
    };
  }),

  getUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(users)
      .where(eq(users.tenantId, ctx.user.tenantId));
  }),

  addUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        nameEn: z.string().optional(),
        role: z.enum(["org_admin", "mentor", "mentee", "employee"]).default("employee"),
        department: z.string().optional(),
        jobTitle: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.password, 10);
      const created = await ctx.db
        .insert(users)
        .values({
          tenantId: ctx.user.tenantId,
          email: input.email,
          name: input.name,
          nameEn: input.nameEn,
          role: input.role,
          department: input.department,
          jobTitle: input.jobTitle,
          yearsOfExperience: input.yearsOfExperience,
          passwordHash,
          status: "active",
        })
        .returning()
        .then((r) => r[0]);

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "user.create",
        entityType: "user",
        entityId: created.id,
        details: { role: input.role },
      });

      return created;
    }),

  updateUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.enum(["active", "inactive", "suspended"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(eq(users.id, input.userId), eq(users.tenantId, ctx.user.tenantId))
        );

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "user.update_status",
        entityType: "user",
        entityId: input.userId,
        details: { status: input.status },
      });

      return { success: true };
    }),

  updateSettings: adminProcedure
    .input(
      z.object({
        allowSameDepartmentMatch: z.boolean().optional(),
        maxMenteesPerMentor: z.number().int().min(1).max(20).optional(),
        matchingWeights: z
          .object({
            domain: z.number(),
            skills: z.number(),
            experience: z.number(),
            availability: z.number(),
            rating: z.number(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const t = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, ctx.user.tenantId))
        .limit(1)
        .then((r) => r[0]);

      if (!t) return { success: false };
      const merged = { ...(t.settings ?? {}), ...input };
      await ctx.db
        .update(tenants)
        .set({ settings: merged, updatedAt: new Date() })
        .where(eq(tenants.id, ctx.user.tenantId));
      return { success: true };
    }),

  getSettings: adminProcedure.query(async ({ ctx }) => {
    const t = await ctx.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, ctx.user.tenantId))
      .limit(1)
      .then((r) => r[0]);
    return t?.settings ?? {};
  }),

});
