import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "روافد — منصة الإرشاد المهني الذكي",
  description: "Rawafid — Smart Professional Mentoring Platform for Organizations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexArabic.variable} h-full`}>
      <body className="font-arabic antialiased">{children}</body>
    </html>
  );
}
