import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { UserPlus } from "lucide-react";

const roleColors: Record<string, "default" | "success" | "secondary" | "warning" | "destructive" | "outline"> = {
  org_admin: "default",
  mentor: "success",
  mentee: "secondary",
  employee: "outline",
  super_admin: "destructive",
};

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const currentUser = session.user as { id: string; role: string; tenantId: string };
  if (!["org_admin", "super_admin"].includes(currentUser.role)) redirect(`/${locale}`);

  const isRTL = locale === "ar";

  const allUsers = db ? await db
    .select()
    .from(users)
    .where(eq(users.tenantId, currentUser.tenantId)) : [];

  const roleLabel = (role: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      org_admin: { ar: "مسؤول", en: "Admin" },
      mentor: { ar: "مرشد", en: "Mentor" },
      mentee: { ar: "متدرب", en: "Mentee" },
      employee: { ar: "موظف", en: "Employee" },
      super_admin: { ar: "مدير المنصة", en: "Super Admin" },
    };
    return isRTL ? (map[role]?.ar ?? role) : (map[role]?.en ?? role);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRTL ? "إدارة المستخدمين" : "User Management"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? `${allUsers.length} مستخدم` : `${allUsers.length} users`}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-start p-4">{isRTL ? "المستخدم" : "User"}</th>
                  <th className="text-start p-4">{isRTL ? "القسم" : "Department"}</th>
                  <th className="text-start p-4">{isRTL ? "المسمى الوظيفي" : "Job Title"}</th>
                  <th className="text-start p-4">{isRTL ? "الدور" : "Role"}</th>
                  <th className="text-start p-4">{isRTL ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{u.department ?? "—"}</td>
                    <td className="p-4 text-sm text-slate-600">{u.jobTitle ?? "—"}</td>
                    <td className="p-4">
                      <Badge variant={roleColors[u.role] ?? "secondary"}>{roleLabel(u.role)}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={u.status === "active" ? "success" : "destructive"}>
                        {u.status === "active" ? (isRTL ? "نشط" : "Active") : (isRTL ? "معطل" : "Inactive")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
