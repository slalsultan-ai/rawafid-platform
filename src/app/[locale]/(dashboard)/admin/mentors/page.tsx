"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminMentorsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === "ar";

  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const { data: pending, refetch, isLoading } = trpc.mentors.getPending.useQuery();

  const approve = trpc.mentors.approve.useMutation({ onSuccess: () => refetch() });
  const reject = trpc.mentors.reject.useMutation({ onSuccess: () => refetch() });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isRTL ? "اعتماد المرشدين" : "Mentor Approvals"}
        </h1>
        <p className="text-slate-500 mt-1">
          {isRTL
            ? `${pending?.length ?? 0} طلب في انتظار المراجعة`
            : `${pending?.length ?? 0} applications pending review`}
        </p>
      </div>

      {!pending?.length && (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-500">
            {isRTL ? "لا توجد طلبات معلقة" : "No pending applications"}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {pending?.map(({ profile, user }) => {
          const isOpen = expanded === profile.id;
          const areas = (profile.areasOfExpertise as Array<{ nameAr: string; nameEn: string }>) ?? [];
          const skills = (profile.skills as Array<{ nameAr: string; nameEn: string }>) ?? [];

          return (
            <Card key={profile.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.jobTitle}</p>
                      <p className="text-xs text-slate-400">{user.department} • {user.yearsOfExperience} {isRTL ? "سنة خبرة" : "yrs exp"}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {areas.slice(0, 2).map((a, i) => (
                          <Badge key={i} variant="default" className="text-xs">
                            {isRTL ? a.nameAr : a.nameEn}
                          </Badge>
                        ))}
                        {skills.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {isRTL ? s.nameAr : s.nameEn}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpanded(isOpen ? null : profile.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    {profile.motivation && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          {isRTL ? "دافع الإرشاد" : "Mentoring Motivation"}
                        </p>
                        <p className="text-sm text-slate-700">{profile.motivation}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        {isRTL ? "التوفر" : "Availability"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(profile.availability as Array<{ day: string; from: string; to: string }> ?? []).map((slot, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {slot.day} {slot.from}—{slot.to}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Reject with reason */}
                    <div>
                      <textarea
                        placeholder={isRTL ? "سبب الرفض (إذا رفضت)" : "Rejection reason (if rejecting)"}
                        value={rejectReason[profile.id] ?? ""}
                        onChange={(e) => setRejectReason((prev) => ({ ...prev, [profile.id]: e.target.value }))}
                        rows={2}
                        className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        onClick={() => reject.mutate({ profileId: profile.id, reason: rejectReason[profile.id] ?? "" })}
                        disabled={reject.isPending || !rejectReason[profile.id]}
                        className="flex-1 gap-2"
                      >
                        {reject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        {isRTL ? "رفض" : "Reject"}
                      </Button>
                      <Button
                        onClick={() => approve.mutate({ profileId: profile.id })}
                        disabled={approve.isPending}
                        className="flex-1 gap-2"
                      >
                        {approve.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {isRTL ? "اعتماد" : "Approve"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
