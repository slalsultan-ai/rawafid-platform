import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { mentorProfiles, users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { MentorCard } from "@/components/mentors/mentor-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default async function MentorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = session.user as { id: string; role: string; tenantId: string };
  const t = await getTranslations("mentor");
  const tCommon = await getTranslations("common");

  const mentors = db
    ? await db
        .select({ profile: mentorProfiles, user: users })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(
          and(
            eq(mentorProfiles.tenantId, user.tenantId),
            eq(mentorProfiles.status, "approved")
          )
        )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("browseTitle")}</h1>
          <p className="text-slate-500 mt-1">{t("browseAvailable", { count: mentors.length })}</p>
        </div>
        <Link href={`/${locale}/mentors/register`}>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            {t("register")}
          </Button>
        </Link>
      </div>

      {mentors.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg">{t("noMentorsFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mentors.map((m) => (
            <MentorCard
              key={m.profile.id}
              user={m.user}
              profile={m.profile}
              locale={locale}
              viewLabel={t("viewProfile")}
              yearsLabel={tCommon("yearsExp")}
              prefVirtual={t("virtual")}
              prefInPerson={t("inPerson")}
              prefBoth={t("both")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
