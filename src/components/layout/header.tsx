"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { LogOut, Bell, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface HeaderProps {
  locale: string;
  userName: string;
  userRole: string;
}

export function Header({ locale, userName, userRole }: HeaderProps) {
  const router = useRouter();
  const tAuth = useTranslations("auth");
  const tAdmin = useTranslations("admin");

  const roleLabel =
    userRole === "org_admin"
      ? tAdmin("roles.org_admin")
      : userRole === "super_admin"
      ? tAdmin("roles.super_admin")
      : userRole === "mentor"
      ? tAdmin("roles.mentor")
      : userRole === "mentee"
      ? tAdmin("roles.mentee")
      : tAdmin("roles.employee");

  const { data: unread } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale === "ar" ? "en" : "ar"}`)}
          className="text-slate-500 gap-1.5"
        >
          <Globe className="w-4 h-4" />
          {locale === "ar" ? "EN" : "ع"}
        </Button>

        <Link href={`/${locale}/notifications`}>
          <Button variant="ghost" size="icon" className="text-slate-500 relative">
            <Bell className="w-5 h-5" />
            {unread !== undefined && unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          className="text-slate-500 gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          {tAuth("logout")}
        </Button>
      </div>
    </header>
  );
}
