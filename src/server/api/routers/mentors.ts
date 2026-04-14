import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { mentorProfiles, users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logAudit } from "@/server/services/audit";
import { notify } from "@/server/services/notify";

const ItemSchema = z.object({ id: z.string(), nameAr: z.string(), nameEn: z.string() });
const SlotSchema = z.object({ day: z.string(), from: z.string(), to: z.string() });

export const mentorsRouter = createTRPCRouter({
  register: protectedProcedure
    .input(
      z.object({
        areasOfExpertise: z.array(ItemSchema).min(1, "اختر مجال خبرة واحد على الأقل"),
        skills: z.array(ItemSchema).min(1, "اختر مهارة واحدة على الأقل"),
        availability: z.array(SlotSchema).min(1, "أضف فترة توفر واحدة على الأقل"),
        maxMentees: z.number().min(1).max(10).default(3),
        sessionPreference: z.enum(["virtual", "in_person", "both"]).default("both"),
        motivation: z.string().min(20, "اكتب 20 حرفًا على الأقل عن دافعك"),
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

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "mentor.register",
        entityType: "mentor_profile",
        entityId: profile.id,
      });

      const adminsInTenant = await ctx.db
        .select()
        .from(users)
        .where(and(eq(users.tenantId, ctx.user.tenantId), eq(users.role, "org_admin")));
      await Promise.all(
        adminsInTenant.map((a) =>
          notify({
            tenantId: ctx.user.tenantId,
            userId: a.id,
            type: "mentor_registration_pending",
            title: "طلب تسجيل مرشد جديد",
            body: `تقدّم ${ctx.user.name ?? ctx.user.email} بطلب تسجيل كمرشد ينتظر اعتمادك.`,
            relatedEntityType: "mentor_profile",
            relatedEntityId: profile.id,
          })
        )
      );

      return profile;
    }),

  getPending: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({ profile: mentorProfiles, user: users })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(
        and(
          eq(mentorProfiles.tenantId, ctx.user.tenantId),
          eq(mentorProfiles.status, "pending")
        )
      );
  }),

  getApproved: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({ profile: mentorProfiles, user: users })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(
        and(
          eq(mentorProfiles.tenantId, ctx.user.tenantId),
          eq(mentorProfiles.status, "approved")
        )
      );
  }),

  getByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ profile: mentorProfiles, user: users })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(
          and(
            eq(mentorProfiles.userId, input.userId),
            eq(mentorProfiles.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);

      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  approve: adminProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db
        .select()
        .from(mentorProfiles)
        .where(
          and(
            eq(mentorProfiles.id, input.profileId),
            eq(mentorProfiles.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db
        .update(mentorProfiles)
        .set({
          status: "approved",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mentorProfiles.id, input.profileId));

      await ctx.db
        .update(users)
        .set({ role: "mentor", updatedAt: new Date() })
        .where(eq(users.id, profile.userId));

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "mentor.approve",
        entityType: "mentor_profile",
        entityId: profile.id,
      });

      await notify({
        tenantId: ctx.user.tenantId,
        userId: profile.userId,
        type: "mentor_approved",
        title: "تم اعتمادك كمرشد",
        body: "تهانينا! تم اعتماد ملفك التعريفي ويمكنك الآن استقبال طلبات الإرشاد.",
      });

      return { success: true };
    }),

  reject: adminProcedure
    .input(z.object({ profileId: z.string(), reason: z.string().min(5) }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db
        .select()
        .from(mentorProfiles)
        .where(
          and(
            eq(mentorProfiles.id, input.profileId),
            eq(mentorProfiles.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1)
        .then((r) => r[0]);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db
        .update(mentorProfiles)
        .set({
          status: "rejected",
          rejectionReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(mentorProfiles.id, input.profileId));

      await logAudit({
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        action: "mentor.reject",
        entityType: "mentor_profile",
        entityId: profile.id,
        details: { reason: input.reason },
      });

      await notify({
        tenantId: ctx.user.tenantId,
        userId: profile.userId,
        type: "mentor_rejected",
        title: "تم رفض طلب التسجيل كمرشد",
        body: `السبب: ${input.reason}`,
      });

      return { success: true };
    }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(mentorProfiles)
      .where(
        and(
          eq(mentorProfiles.userId, ctx.user.id),
          eq(mentorProfiles.tenantId, ctx.user.tenantId)
        )
      )
      .limit(1)
      .then((r) => r[0] ?? null);
  }),
});
