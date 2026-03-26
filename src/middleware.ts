import createMiddleware from "next-intl/middleware";
import { auth } from "@/server/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
});

const publicPaths = ["/login", "/register", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";
  return (
    publicPaths.some((p) => withoutLocale.startsWith(p)) ||
    pathname.startsWith("/api/")
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let API routes through
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Apply i18n routing
  const intlResponse = intlMiddleware(req);

  // Check auth for protected routes
  if (!isPublicPath(pathname)) {
    const session = await auth();
    if (!session?.user) {
      const locale = pathname.startsWith("/en") ? "en" : "ar";
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }

    // Role-based redirect for admin paths
    const isAdminPath = pathname.includes("/admin");
    if (
      isAdminPath &&
      session.user &&
      !["org_admin", "super_admin"].includes((session.user as { role?: string }).role ?? "")
    ) {
      const locale = pathname.startsWith("/en") ? "en" : "ar";
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
