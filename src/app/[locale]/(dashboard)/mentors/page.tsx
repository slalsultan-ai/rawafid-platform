import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { mentorProfiles, users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { MentorCard } from "@/components/mentors/mentor-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default async function MentorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as { id: string; role: string; tenantId: string };

  const mentors = db ? await db
    .select({ profile: mentorProfiles, user: users })
    .from(mentorProfiles)
    .innerJoin(users, eq(mentorProfiles.userId, users.id))
    .where(and(eq(mentorProfiles.tenantId, user.tenantId), eq(mentorProfiles.status, "approved"))) : [];

  const isRTL = locale === "ar";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRTL ? "المرشدون" : "Mentors"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL
              ? `${mentors.length} مرشد معتمد متاح`
              : `${mentors.length} approved mentors available`}
          </p>
        </div>
        <Link href={`/${locale}/mentors/register`}>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            {isRTL ? "سجّل كمرشد" : "Register as Mentor"}
          </Button>
        </Link>
      </div>

      {mentors.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg">
            {isRTL ? "لا يوجد مرشدون معتمدون حالياً" : "No approved mentors yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mentors.map(({ profile, user: mentorUser }) => (
            <MentorCard
              key={profile.id}
              user={mentorUser}
              profile={profile}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
