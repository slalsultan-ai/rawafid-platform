import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { users, tenants } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  selfRegister: publicProcedure
    .input(
      z.object({
        tenantSlug: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        nameEn: z.string().optional(),
        department: z.string().optional(),
        jobTitle: z.string().optional(),
        yearsOfExperience: z.number().int().min(0).max(60).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, input.tenantSlug))
        .limit(1)
        .then((r) => r[0]);
      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      const existing = await ctx.db
        .select()
        .from(users)
        .where(
          and(eq(users.tenantId, tenant.id), eq(users.email, input.email))
        )
        .limit(1)
        .then((r) => r[0]);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered for this organization",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const created = await ctx.db
        .insert(users)
        .values({
          tenantId: tenant.id,
          email: input.email,
          name: input.name,
          nameEn: input.nameEn,
          department: input.department,
          jobTitle: input.jobTitle,
          yearsOfExperience: input.yearsOfExperience,
          passwordHash,
          role: "employee",
          status: "active",
        })
        .returning()
        .then((r) => r[0]);

      return { id: created.id, email: created.email };
    }),
});
