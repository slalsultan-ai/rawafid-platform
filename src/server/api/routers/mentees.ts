import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { menteeRequests } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

export const menteesRouter = createTRPCRouter({
  createRequest: protectedProcedure
    .input(
      z.object({
        desiredArea: z.string().min(2),
        desiredSkills: z.array(z.string()).default([]),
        description: z.string().optional(),
        goals: z.string().optional(),
        sessionPreference: z.enum(["virtual", "in_person", "both"]).default("both"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing open request
      const existing = await ctx.db
        .select()
        .from(menteeRequests)
        .where(
          and(
            eq(menteeRequests.userId, ctx.user.id),
            eq(menteeRequests.status, "open")
          )
        )
        .limit(1)
        .then((r) => r[0]);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have an open mentoring request",
        });
      }

      const request = await ctx.db
        .insert(menteeRequests)
        .values({
          id: nanoid(),
          userId: ctx.user.id,
          tenantId: ctx.user.tenantId,
          desiredArea: input.desiredArea,
          desiredSkills: input.desiredSkills,
          description: input.description,
          goals: input.goals,
          sessionPreference: input.sessionPreference,
          status: "open",
        })
        .returning()
        .then((r) => r[0]);

      return request;
    }),

  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(menteeRequests)
      .where(eq(menteeRequests.userId, ctx.user.id));
  }),

  cancelRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(menteeRequests)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(menteeRequests.id, input.requestId),
            eq(menteeRequests.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
