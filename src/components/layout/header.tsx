"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { LogOut, Bell, Globe } from "lucide-react";

interface HeaderProps {
  locale: string;
  userName: string;
  userRole: string;
}

const roleLabels: Record<string, { ar: string; en: string }> = {
  org_admin: { ar: "مسؤول الجهة", en: "Org Admin" },
  mentor: { ar: "مرشد", en: "Mentor" },
  mentee: { ar: "متدرب", en: "Mentee" },
  employee: { ar: "موظف", en: "Employee" },
  super_admin: { ar: "مدير المنصة", en: "Super Admin" },
};

export function Header({ locale, userName, userRole }: HeaderProps) {
  const router = useRouter();
  const isRTL = locale === "ar";
  const roleLabel = roleLabels[userRole]?.[locale as "ar" | "en"] ?? userRole;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-slate-900 leading-tight">{userName}</p>
          <p className="text-xs text-slate-500">{roleLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale === "ar" ? "en" : "ar"}`)}
          className="text-slate-500 gap-1.5"
        >
          <Globe className="w-4 h-4" />
          {locale === "ar" ? "EN" : "ع"}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-slate-500">
          <Bell className="w-5 h-5" />
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          className="text-slate-500 gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          {locale === "ar" ? "خروج" : "Logout"}
        </Button>
      </div>
    </header>
  );
}
