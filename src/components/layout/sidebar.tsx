"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  User,
  BarChart3,
  Settings,
  Shield,
  CalendarDays,
} from "lucide-react";

function StarLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 4L27.5 14.5L38 11L31 20L41 24L31 28L38 37L27.5 33.5L24 44L20.5 33.5L10 37L17 28L7 24L17 20L10 11L20.5 14.5L24 4Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <circle cx="24" cy="24" r="6" fill="white" fillOpacity="0.95" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}

interface SidebarProps {
  locale: string;
  userRole: string;
}

export function Sidebar({ locale, userRole }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isRTL = locale === "ar";

  const isAdmin = userRole === "org_admin" || userRole === "super_admin";

  const navItems = [
    {
      href: `/${locale}`,
      icon: LayoutDashboard,
      label: t("dashboard"),
      exact: true,
    },
    {
      href: `/${locale}/mentors`,
      icon: UserCheck,
      label: t("mentors"),
    },
    {
      href: `/${locale}/mentoring`,
      icon: BookOpen,
      label: t("mentoring"),
    },
    {
      href: `/${locale}/sessions`,
      icon: CalendarDays,
      label: t("sessions"),
    },
    {
      href: `/${locale}/profile`,
      icon: User,
      label: t("profile"),
    },
  ];

  const adminItems = [
    {
      href: `/${locale}/admin`,
      icon: Shield,
      label: t("admin"),
      exact: true,
    },
    {
      href: `/${locale}/admin/users`,
      icon: Users,
      label: t("users"),
    },
    {
      href: `/${locale}/admin/mentors`,
      icon: UserCheck,
      label: t("mentors"),
    },
    {
      href: `/${locale}/admin/reports`,
      icon: BarChart3,
      label: t("reports"),
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "sidebar fixed top-0 h-full w-64 bg-white border-e border-slate-200 flex flex-col z-30 shadow-sm",
        isRTL ? "right-0 border-l border-r-0" : "left-0 border-r border-l-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-center w-9 h-9 bg-amber-500 rounded-lg">
          <StarLogo className="w-5 h-5 text-[#0f2837]" />
        </div>
        <span className="font-bold text-slate-900 text-lg">روافد</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-amber-50 text-[#0f2837]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {locale === "ar" ? "الإدارة" : "Admin"}
              </p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-amber-50 text-[#0f2837]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
