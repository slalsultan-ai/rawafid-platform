"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Summary {
  discussedPoints: string | null;
  decisions: string | null;
  actionItems: string | null;
}

interface Props {
  sessionId: string;
  initialSummary: Summary | null;
  isRTL: boolean;
}

export function SummaryClient({ sessionId, initialSummary, isRTL }: Props) {
  const [discussedPoints, setDiscussedPoints] = useState(initialSummary?.discussedPoints ?? "");
  const [decisions, setDecisions] = useState(initialSummary?.decisions ?? "");
  const [actionItems, setActionItems] = useState(initialSummary?.actionItems ?? "");
  const [saved, setSaved] = useState(false);

  const save = trpc.sessions.saveSummary.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function handleSave() {
    save.mutate({ sessionId, discussedPoints, decisions, actionItems });
  }

  const textareaClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none";

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {isRTL ? "النقاط التي تمت مناقشتها" : "Discussed Points"}
        </label>
        <textarea
          rows={3}
          className={textareaClass}
          placeholder={isRTL ? "ما الموضوعات التي تمت مناقشتها..." : "Topics discussed in this session..."}
          value={discussedPoints}
          onChange={(e) => setDiscussedPoints(e.target.value)}
          disabled={save.isPending}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {isRTL ? "القرارات والتوصيات" : "Decisions & Recommendations"}
        </label>
        <textarea
          rows={3}
          className={textareaClass}
          placeholder={isRTL ? "ما القرارات أو التوصيات التي خرجتم بها..." : "Key decisions or recommendations..."}
          value={decisions}
          onChange={(e) => setDecisions(e.target.value)}
          disabled={save.isPending}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {isRTL ? "بنود العمل (Action Items)" : "Action Items"}
        </label>
        <textarea
          rows={3}
          className={textareaClass}
          placeholder={isRTL ? "ما الخطوات العملية التي سيتخذها كل طرف..." : "Next steps and tasks for each party..."}
          value={actionItems}
          onChange={(e) => setActionItems(e.target.value)}
          disabled={save.isPending}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={save.isPending} className="gap-2">
          {isRTL ? "حفظ الملخص" : "Save Summary"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-teal-600">
            <CheckCircle2 className="w-4 h-4" />
            {isRTL ? "تم الحفظ" : "Saved"}
          </span>
        )}
      </div>
    </div>
  );
}
