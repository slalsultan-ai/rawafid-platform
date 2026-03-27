"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  sessionId: string;
  currentStatus: string;
  isRTL: boolean;
}

export function StatusActions({ sessionId, currentStatus, isRTL }: Props) {
  const router = useRouter();

  const update = trpc.sessions.updateStatus.useMutation({
    onSuccess: () => router.refresh(),
  });

  if (currentStatus === "completed" || currentStatus === "cancelled") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "scheduled" && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50"
          onClick={() => update.mutate({ sessionId, status: "preparing" })}
          disabled={update.isPending}
        >
          <PlayCircle className="w-4 h-4" />
          {isRTL ? "بدء التحضير" : "Start Preparing"}
        </Button>
      )}

      {(currentStatus === "scheduled" || currentStatus === "preparing") && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
          onClick={() => update.mutate({ sessionId, status: "completed" })}
          disabled={update.isPending}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isRTL ? "تم الاكتمال" : "Mark Completed"}
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
        onClick={() => update.mutate({ sessionId, status: "cancelled" })}
        disabled={update.isPending}
      >
        <XCircle className="w-4 h-4" />
        {isRTL ? "إلغاء الجلسة" : "Cancel Session"}
      </Button>
    </div>
  );
}
