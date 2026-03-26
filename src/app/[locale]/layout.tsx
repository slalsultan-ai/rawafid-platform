import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { TRPCProvider } from "@/lib/trpc/provider";
import "../globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "روافد — منصة الإرشاد المهني الذكي",
  description: "Rawafid — Smart Professional Mentoring Platform",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      className={`${ibmPlexArabic.variable} ${inter.variable} h-full`}
    >
      <body className={`min-h-full antialiased ${isRTL ? "font-arabic" : "font-inter"}`}>
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>{children}</TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
