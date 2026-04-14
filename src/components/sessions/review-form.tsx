"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface Props {
  sessionId: string;
  revieweeId: string;
  alreadyReviewed?: boolean;
  onCreated?: () => void;
}

function StarRow({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className="text-amber-400 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${i <= value ? "fill-amber-400" : "fill-transparent text-slate-300"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ sessionId, revieweeId, alreadyReviewed, onCreated }: Props) {
  const t = useTranslations("session");

  const [overall, setOverall] = useState(5);
  const [benefit, setBenefit] = useState(5);
  const [prep, setPrep] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = trpc.reviews.create.useMutation({
    onSuccess: () => onCreated?.(),
    onError: (err) => setError(err.message),
  });

  if (alreadyReviewed) {
    return <p className="text-sm text-slate-500">{t("alreadyReviewed")}</p>;
  }

  return (
    <div className="space-y-4">
      <StarRow value={overall} onChange={setOverall} label={t("rateOverall")} />
      <StarRow value={benefit} onChange={setBenefit} label={t("rateBenefit")} />
      <StarRow value={prep} onChange={setPrep} label={t("ratePreparation")} />
      <StarRow value={punctuality} onChange={setPunctuality} label={t("ratePunctuality")} />
      <StarRow value={communication} onChange={setCommunication} label={t("rateCommunication")} />

      <textarea
        rows={3}
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder={t("comments")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Button
        onClick={() =>
          create.mutate({
            sessionId,
            revieweeId,
            overallRating: overall,
            ratingBenefit: benefit,
            ratingPreparation: prep,
            ratingPunctuality: punctuality,
            ratingCommunication: communication,
            comments: comments || undefined,
          })
        }
        disabled={create.isPending}
      >
        {t("submitReview")}
      </Button>
    </div>
  );
}
