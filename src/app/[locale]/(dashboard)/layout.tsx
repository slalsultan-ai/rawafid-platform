import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { UserSwitcher } from "@/components/dev/user-switcher";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const user = session.user as {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
  };

  const isRTL = locale === "ar";
  const showUserSwitcher =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar locale={locale} userRole={user.role} />
      <div className={`${isRTL ? "mr-64" : "ml-64"} flex flex-col min-h-screen`}>
        <Header locale={locale} userName={user.name ?? user.email} userRole={user.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      {showUserSwitcher && (
        <UserSwitcher
          currentEmail={user.email}
          currentName={user.name ?? user.email}
          currentRole={user.role}
        />
      )}
    </div>
  );
}
