"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, FlaskConical, Check } from "lucide-react";
import { getInitials } from "@/lib/utils";

type TestUser = { name: string; email: string };
type TestGroup = {
  role: string;
  roleLabel: string;
  color: string;
  users: TestUser[];
};

const TEST_USERS: TestGroup[] = [
  {
    role: "org_admin",
    roleLabel: "مسؤول",
    color: "bg-violet-500",
    users: [{ name: "مسؤول الهيئة", email: "admin@goid.gov.sa" }],
  },
  {
    role: "mentor",
    roleLabel: "مرشد",
    color: "bg-teal-500",
    users: [
      { name: "م. خالد العتيبي", email: "khalid.otaibi@goid.gov.sa" },
      { name: "د. نورة الشمري", email: "noura.shammari@goid.gov.sa" },
      { name: "أ. فهد الدوسري", email: "fahad.dossari@goid.gov.sa" },
      { name: "د. عبدالرحمن القرشي", email: "abdulrahman.qurashi@goid.gov.sa" },
      { name: "أ. ريم القحطاني", email: "reem.qahtani@goid.gov.sa" },
    ],
  },
  {
    role: "mentee",
    roleLabel: "متدرب",
    color: "bg-emerald-500",
    users: [
      { name: "أ. بدر العسيري", email: "badr.aseeri@goid.gov.sa" },
      { name: "أ. سمر الشريف", email: "samar.sharif@goid.gov.sa" },
      { name: "أ. أيمن الحمدان", email: "ayman.hamdan@goid.gov.sa" },
      { name: "أ. دلال المنصور", email: "dalal.mansour@goid.gov.sa" },
      { name: "أ. ياسر الفهيد", email: "yaser.fahid@goid.gov.sa" },
    ],
  },
  {
    role: "employee",
    roleLabel: "موظف",
    color: "bg-slate-500",
    users: [
      { name: "عبدالله المطيري", email: "e001@goid.gov.sa" },
      { name: "أميرة الدغيثر", email: "e002@goid.gov.sa" },
      { name: "جاسم الهاجري", email: "e003@goid.gov.sa" },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  org_admin: "مسؤول",
  super_admin: "مسؤول عام",
  mentor: "مرشد",
  mentee: "متدرب",
  employee: "موظف",
};

const ROLE_COLORS: Record<string, string> = {
  org_admin: "bg-violet-500",
  super_admin: "bg-violet-500",
  mentor: "bg-teal-500",
  mentee: "bg-emerald-500",
  employee: "bg-slate-500",
};

interface UserSwitcherProps {
  currentEmail: string;
  currentName: string;
  currentRole: string;
}

export function UserSwitcher({ currentEmail, currentName, currentRole }: UserSwitcherProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "ar";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentRoleLabel = ROLE_LABELS[currentRole] ?? currentRole;
  const currentRoleColor = ROLE_COLORS[currentRole] ?? "bg-slate-500";

  async function switchTo(email: string) {
    if (email === currentEmail) {
      setOpen(false);
      return;
    }
    setError(null);
    setLoading(email);
    const result = await signIn("credentials", {
      email,
      password: "Rawafid@2024",
      redirect: false,
    });
    setLoading(null);
    if (result?.error) {
      setError(`فشل التبديل إلى ${email}`);
      return;
    }
    setOpen(false);
    router.refresh();
    router.push(`/${locale}`);
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 font-arabic" dir="rtl">
      {open && (
        <div className="mb-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-l from-teal-600 to-emerald-600 px-4 py-3 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-white/80" />
            <span className="text-white font-bold text-sm">وضع الاختبار</span>
            <span className="text-white/60 text-xs mr-auto">DEMO</span>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className={`w-9 h-9 shrink-0 rounded-full ${currentRoleColor} flex items-center justify-center text-white text-xs font-bold`}>
              {getInitials(currentName)}
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[11px] text-slate-500 leading-tight">المستخدم الحالي</p>
              <p className="text-sm font-bold text-slate-900 truncate leading-tight">{currentName}</p>
              <p className="text-xs text-slate-500 truncate leading-tight">
                {currentRoleLabel} · {currentEmail}
              </p>
            </div>
          </div>

          {error && (
            <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 text-xs text-rose-600 text-right">
              {error}
            </div>
          )}

          <div className="divide-y divide-slate-100 max-h-[55vh] overflow-y-auto">
            {TEST_USERS.map((group) => (
              <div key={group.role} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${group.color}`} />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {group.roleLabel}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.users.map((u) => {
                    const isCurrent = u.email === currentEmail;
                    const isLoading = loading === u.email;
                    return (
                      <button
                        key={u.email}
                        onClick={() => switchTo(u.email)}
                        disabled={isLoading || loading !== null}
                        aria-current={isCurrent ? "true" : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-right ${
                          isCurrent
                            ? "bg-teal-50 ring-1 ring-teal-200"
                            : "hover:bg-slate-50 active:bg-slate-100"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <div className={`w-8 h-8 shrink-0 rounded-full ${group.color} flex items-center justify-center text-white text-xs font-bold`}>
                          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : getInitials(u.name)}
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-sm font-medium text-slate-800 truncate leading-tight">{u.name}</p>
                          <p className="text-xs text-slate-400 truncate leading-tight">{u.email}</p>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-[#0f2837] text-amber-400 ps-3 pe-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 hover:bg-[#1a4a66] transition-colors text-sm font-bold border border-amber-400/20"
        aria-label="تبديل المستخدم للاختبار"
      >
        <FlaskConical className="w-4 h-4" />
        <span className="flex flex-col items-end leading-tight text-right">
          <span className="text-[10px] font-normal text-amber-200/70">
            {open ? "إغلاق" : "تبديل المستخدم"}
          </span>
          <span className="text-xs font-bold text-amber-300 max-w-[140px] truncate">
            {currentName} · {currentRoleLabel}
          </span>
        </span>
      </button>
    </div>
  );
}
