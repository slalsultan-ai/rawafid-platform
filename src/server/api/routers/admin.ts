import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { users, mentorProfiles, matches, sessions, sessionReviews } from "@/server/db/schema";
import { eq, and, count, avg, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

export const adminRouter = createTRPCRouter({
  // Dashboard stats
  getStats: adminProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;

    const [
      totalUsers,
      totalMentors,
      totalActiveMatches,
      totalSessions,
      pendingMentors,
    ] = await Promise.all([
      ctx.db.select({ count: count() }).from(users).where(eq(users.tenantId, tenantId)).then((r) => r[0]?.count ?? 0),
      ctx.db.select({ count: count() }).from(mentorProfiles).where(and(eq(mentorProfiles.tenantId, tenantId), eq(mentorProfiles.status, "approved"))).then((r) => r[0]?.count ?? 0),
      ctx.db.select({ count: count() }).from(matches).where(and(eq(matches.tenantId, tenantId), eq(matches.status, "active"))).then((r) => r[0]?.count ?? 0),
      ctx.db.select({ count: count() }).from(sessions).where(and(eq(sessions.tenantId, tenantId), eq(sessions.status, "completed"))).then((r) => r[0]?.count ?? 0),
      ctx.db.select({ count: count() }).from(mentorProfiles).where(and(eq(mentorProfiles.tenantId, tenantId), eq(mentorProfiles.status, "pending"))).then((r) => r[0]?.count ?? 0),
    ]);

    return {
      totalUsers: Number(totalUsers),
      totalMentors: Number(totalMentors),
      totalActiveMatches: Number(totalActiveMatches),
      totalSessions: Number(totalSessions),
      pendingMentors: Number(pendingMentors),
    };
  }),

  // List all users
  getUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(users)
      .where(eq(users.tenantId, ctx.user.tenantId));
  }),

  // Add user
  addUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        nameEn: z.string().optional(),
        role: z.enum(["org_admin", "mentor", "mentee", "employee"]).default("employee"),
        department: z.string().optional(),
        jobTitle: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        password: z.string().min(8).default("Rawafid@2024"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await ctx.db
        .insert(users)
        .values({
          id: nanoid(),
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
      return user;
    }),

  // Update user status
  updateUserStatus: adminProcedure
    .input(z.object({ userId: z.string(), status: z.enum(["active", "inactive", "suspended"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(users.id, input.userId), eq(users.tenantId, ctx.user.tenantId)));
      return { success: true };
    }),
});
