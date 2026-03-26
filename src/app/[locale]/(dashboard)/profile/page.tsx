import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { users, mentorProfiles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Briefcase, Mail, Building, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const currentUser = session.user as { id: string; role: string; tenantId: string };
  const isRTL = locale === "ar";

  const userData = db ? await db
    .select()
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1)
    .then((r) => r[0]) : null;

  const mentorProfile = db && (currentUser.role === "mentor") ? await db
    .select()
    .from(mentorProfiles)
    .where(eq(mentorProfiles.userId, currentUser.id))
    .limit(1)
    .then((r) => r[0]) : null;

  if (!userData) redirect(`/${locale}/login`);

  const areas = (mentorProfile?.areasOfExpertise as Array<{ nameAr: string; nameEn: string }>) ?? [];
  const skills = (mentorProfile?.skills as Array<{ nameAr: string; nameEn: string }>) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isRTL ? "الملف الشخصي" : "Profile"}
      </h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl font-bold">{getInitials(userData.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{userData.name}</h2>
              {userData.nameEn && <p className="text-slate-500 text-sm">{userData.nameEn}</p>}
              <div className="flex flex-wrap gap-3 mt-2">
                {userData.jobTitle && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Briefcase className="w-4 h-4" />
                    {userData.jobTitle}
                  </span>
                )}
                {userData.department && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Building className="w-4 h-4" />
                    {userData.department}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  {userData.email}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant={currentUser.role === "mentor" ? "success" : currentUser.role === "org_admin" ? "default" : "secondary"}>
                  {isRTL
                    ? { org_admin: "مسؤول", mentor: "مرشد", mentee: "متدرب", employee: "موظف" }[currentUser.role] ?? currentUser.role
                    : { org_admin: "Admin", mentor: "Mentor", mentee: "Mentee", employee: "Employee" }[currentUser.role] ?? currentUser.role}
                </Badge>
                {userData.yearsOfExperience && (
                  <Badge variant="outline">
                    {userData.yearsOfExperience} {isRTL ? "سنة خبرة" : "yrs exp"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {userData.bio && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed">{userData.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mentor Profile */}
      {mentorProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{isRTL ? "ملف المرشد" : "Mentor Profile"}</CardTitle>
              <Badge variant={mentorProfile.status === "approved" ? "success" : mentorProfile.status === "pending" ? "warning" : "destructive"}>
                {mentorProfile.status === "approved" ? (isRTL ? "معتمد" : "Approved")
                  : mentorProfile.status === "pending" ? (isRTL ? "قيد المراجعة" : "Pending")
                  : (isRTL ? "مرفوض" : "Rejected")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {areas.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">{isRTL ? "مجالات الخبرة" : "Areas of Expertise"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {areas.map((a, i) => <Badge key={i} variant="default">{isRTL ? a.nameAr : a.nameEn}</Badge>)}
                </div>
              </div>
            )}
            {skills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">{isRTL ? "المهارات" : "Skills"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => <Badge key={i} variant="secondary">{isRTL ? s.nameAr : s.nameEn}</Badge>)}
                </div>
              </div>
            )}
            {mentorProfile.motivation && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">{isRTL ? "دافع الإرشاد" : "Motivation"}</p>
                <p className="text-sm text-slate-600">{mentorProfile.motivation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentUser.role !== "mentor" && (
        <div className="text-center">
          <Link href={`/${locale}/mentors/register`}>
            <Button variant="outline">
              {isRTL ? "سجّل كمرشد" : "Register as Mentor"}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
