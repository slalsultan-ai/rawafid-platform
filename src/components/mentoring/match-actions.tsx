"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  matchId: string;
  isRTL: boolean;
}

export function MatchActions({ matchId, isRTL }: Props) {
  const router = useRouter();
  const [action, setAction] = useState<"accept" | "reject" | null>(null);

  const respond = trpc.matching.respondToMatch.useMutation({
    onSuccess: () => {
      setAction(null);
      router.refresh();
    },
    onError: () => setAction(null),
  });

  const handleAccept = () => {
    setAction("accept");
    respond.mutate({ matchId, action: "accept" });
  };

  const handleReject = () => {
    setAction("reject");
    respond.mutate({ matchId, action: "reject" });
  };

  return (
    <div className="flex gap-2 mt-3">
      <Button
        size="sm"
        variant="outline"
        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleReject}
        disabled={respond.isPending}
      >
        {respond.isPending && action === "reject"
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : isRTL ? "رفض" : "Reject"}
      </Button>
      <Button
        size="sm"
        className="flex-1"
        onClick={handleAccept}
        disabled={respond.isPending}
      >
        {respond.isPending && action === "accept"
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : isRTL ? "قبول" : "Accept"}
      </Button>
    </div>
  );
}
