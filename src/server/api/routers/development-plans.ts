import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  developmentPlans,
  developmentGoals,
  goalMilestones,
  goalProgressNotes,
  matches,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logAudit } from "@/server/services/audit";

async function assertMatchAccess(
  db: NonNullable<typeof import("@/server/db").db>,
  matchId: string,
  userId: string,
  tenantId: string
) {
  const match = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.tenantId, tenantId)))
    .limit(1)
    .then((r) => r[0]);
  if (!match) throw new TRPCError({ code: "NOT_FOUND" });
  if (match.mentorId !== userId && match.menteeId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return match;
}

export const developmentPlansRouter = createTRPCRouter({
  getOrCreateForMatch: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
await assertMatchAccess(ctx.db, input.matchId, ctx.user.id, ctx.user.tenantId);

      const existing = await ctx.db
        .select()
        .from(developmentPlans)
        .where(
          and(
            eq(developmentPlans.matchId, input.matchId),
            eq(developmentPlans.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);
      if (existing) return existing;

      const created = await ctx.db
        .insert(developmentPlans)
        .values({ matchId: input.matchId, tenantId: ctx.user.tenantId })
        .returning()
        .then((r) => r[0]);

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "plan.create",
        entityType: "development_plan",
        entityId: created.id,
      });

      return created;
    }),

  getForMatch: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ ctx, input }) => {
await assertMatchAccess(ctx.db, input.matchId, ctx.user.id, ctx.user.tenantId);

      const plan = await ctx.db
        .select()
        .from(developmentPlans)
        .where(
          and(
            eq(developmentPlans.matchId, input.matchId),
            eq(developmentPlans.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);
      if (!plan) return null;

      const goals = await ctx.db
        .select()
        .from(developmentGoals)
        .where(eq(developmentGoals.planId, plan.id));

      const milestonesByGoal: Record<string, Awaited<ReturnType<typeof loadMilestones>>> = {};
      async function loadMilestones(goalId: string) {
        return ctx.db
          .select()
          .from(goalMilestones)
          .where(eq(goalMilestones.goalId, goalId));
      }
      for (const g of goals) {
        milestonesByGoal[g.id] = await loadMilestones(g.id);
      }

      return { plan, goals, milestones: milestonesByGoal };
    }),

  addGoal: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        title: z.string().min(2),
        titleEn: z.string().optional(),
        description: z.string().optional(),
        targetDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.db
        .select()
        .from(developmentPlans)
        .where(
          and(
            eq(developmentPlans.id, input.planId),
            eq(developmentPlans.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND" });
await assertMatchAccess(ctx.db, plan.matchId, ctx.user.id, ctx.user.tenantId);

      const created = await ctx.db
        .insert(developmentGoals)
        .values({
          planId: input.planId,
          tenantId: ctx.user.tenantId,
          title: input.title,
          titleEn: input.titleEn,
          description: input.description,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        })
        .returning()
        .then((r) => r[0]);
      return created;
    }),

  updateGoalStatus: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        status: z.enum(["not_started", "in_progress", "completed", "deferred"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(developmentGoals)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(developmentGoals.id, input.goalId),
            eq(developmentGoals.tenantId, ctx.user.tenantId)
          )
        );

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "goal.update",
        entityType: "development_goal",
        entityId: input.goalId,
        details: { status: input.status },
      });

      return { success: true };
    }),

  addMilestone: protectedProcedure
    .input(
      z.object({
        goalId: z.string(),
        title: z.string().min(2),
        titleEn: z.string().optional(),
        targetDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db
        .select()
        .from(developmentGoals)
        .where(
          and(
            eq(developmentGoals.id, input.goalId),
            eq(developmentGoals.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);
      if (!goal) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db
        .insert(goalMilestones)
        .values({
          goalId: input.goalId,
          tenantId: ctx.user.tenantId,
          title: input.title,
          titleEn: input.titleEn,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        })
        .returning()
        .then((r) => r[0]);
    }),

  updateMilestoneStatus: protectedProcedure
    .input(
      z.object({
        milestoneId: z.string(),
        status: z.enum(["not_started", "in_progress", "completed", "deferred"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(goalMilestones)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(goalMilestones.id, input.milestoneId),
            eq(goalMilestones.tenantId, ctx.user.tenantId)
          )
        );
      return { success: true };
    }),

  addProgressNote: protectedProcedure
    .input(z.object({ goalId: z.string(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db
        .select()
        .from(developmentGoals)
        .where(
          and(
            eq(developmentGoals.id, input.goalId),
            eq(developmentGoals.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);
      if (!goal) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db
        .insert(goalProgressNotes)
        .values({
          goalId: input.goalId,
          tenantId: ctx.user.tenantId,
          authorId: ctx.user.id,
          content: input.content,
        })
        .returning()
        .then((r) => r[0]);
    }),
});
